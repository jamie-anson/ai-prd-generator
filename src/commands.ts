// @ts-nocheck
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { ContextCardGenerator } from './context-card-generator/generator';
import { MarkdownFormatter } from './context-card-generator/formatter';
import MarkdownIt from 'markdown-it';
import { PrdJson, PrdOutput } from './utils/types';
import { callOpenAiAPI } from './utils/openai';
import { getWebviewContent, getGraphViewerWebviewContent, getStyledPrdWebviewContent, getStyledMdViewerWebviewContent } from './utils/webview';
import { updateAiManifest } from './utils/manifest';

export function registerCommands(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    const generatePrdCommand = vscode.commands.registerCommand('ai-prd-generator.generatePrd-dev', async () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        currentPanel = vscode.window.createWebviewPanel('prdGenerator', 'PRD Generator', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true // Keep the webview alive even when not visible
        });

        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'main.js');
        const scriptContent = await vscode.workspace.fs.readFile(scriptPath);
        currentPanel.webview.html = getWebviewContent(Buffer.from(scriptContent).toString('utf-8'), currentPanel);

        let isWebviewReady = false;

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, context.subscriptions);

        currentPanel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'webviewReady') {
                isWebviewReady = true;
                console.log('Webview is ready.');
                return;
            }

            switch (message.command) {
                case 'generate':
                    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating PRD...", cancellable: false }, async (progress) => {
                        progress.report({ increment: 0, message: "Calling AI..." });
                        const apiKey = await context.secrets.get('openAiApiKey');
                        if (!apiKey) {
                            vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
                            if (isWebviewReady && currentPanel) {
                                await currentPanel.webview.postMessage({ command: 'error', text: 'API Key is not set.' });
                            }
                            return;
                        }
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            vscode.window.showErrorMessage('No workspace folder found. Please open a folder to save PRD files.');
                            if (isWebviewReady && currentPanel) {
                                await currentPanel.webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
                            }
                            return;
                        }
                        try {
                            const prdOutput = await callOpenAiAPI(message.text, apiKey);
                            progress.report({ increment: 50, message: "Saving files..." });
                            if (prdOutput) {
                                const workspaceUri = workspaceFolders[0].uri;
                                const outputDir = vscode.Uri.joinPath(workspaceUri, 'mise-en-place-output', 'prd');
                                await vscode.workspace.fs.createDirectory(outputDir);
                                const prdData = prdOutput.json as { title?: string };
                                const baseFilename = prdData.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'prd';
                                const mdFilePath = vscode.Uri.joinPath(outputDir, `${baseFilename}.md`);
                                const jsonFilePath = vscode.Uri.joinPath(outputDir, `${baseFilename}.json`);
                                await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown));
                                await vscode.workspace.fs.writeFile(jsonFilePath, Buffer.from(JSON.stringify(prdOutput.json, null, 4)));
                                const relativeMdPath = vscode.workspace.asRelativePath(mdFilePath);
                                const relativeJsonPath = vscode.workspace.asRelativePath(jsonFilePath);
                                const manifestPath = await updateAiManifest(context, { type: 'prd', files: [relativeMdPath, relativeJsonPath] });
                                vscode.window.showInformationMessage(`PRD and manifest generated successfully at ${outputDir.fsPath}`);

                                if (isWebviewReady && currentPanel) {
                                    const ok = await currentPanel.webview.postMessage({ command: 'generationComplete', files: [relativeMdPath, relativeJsonPath, manifestPath] });
                                    console.log('Delivery status of generationComplete message:', ok);
                                } else {
                                    console.log('Webview not ready or panel not available to post generationComplete message.');
                                }
                            } else {
                                if (isWebviewReady && currentPanel) {
                                    await currentPanel.webview.postMessage({ command: 'error', text: 'Failed to generate PRD.' });
                                }
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage('Failed to call OpenAI API: ' + error.message);
                            if (isWebviewReady && currentPanel) {
                                await currentPanel.webview.postMessage({ command: 'error', text: 'API call failed: ' + error.message });
                            }
                        }
                    });
                    break;
                case 'setApiKey':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'ai-prd-generator.openAiApiKey');
                    break;
                case 'bulkGenerateContextCards':
                    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating Context Cards...", cancellable: false }, async (progress) => {
                        progress.report({ increment: 0, message: "Analyzing codebase..." });
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders) {
                            panel.webview.postMessage({ command: 'contextCardsError', text: 'No workspace folder found.' });
                            return;
                        }
                        const workspaceUri = workspaceFolders[0].uri;
                        const allFiles = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');
                        const outputDir = vscode.Uri.joinPath(workspaceUri, 'mise-en-place-output', 'context-cards');
                        await vscode.workspace.fs.createDirectory(outputDir);
                        const apiKey = await context.secrets.get('openAiApiKey');
                        const analyzer = new ContextCardGenerator();
                        const formatter = new MarkdownIt();
                        let generatedCards = 0;
                        for (const file of allFiles) {
                            try {
                                const sourceCode = Buffer.from(await vscode.workspace.fs.readFile(file)).toString('utf-8');
                                let analysisResult: ContextCard[] = analyzer.analyze(sourceCode);
                                if (apiKey) {
                                    analysisResult = await analyzer.enrich(analysisResult, apiKey);
                                }
                                const formatter = new MarkdownFormatter();
                                const markdownContent = formatter.format(analysisResult, vscode.workspace.asRelativePath(file.path));
                                const cardFileName = path.basename(file.path).replace('.ts', '.md');
                                const cardFileUri = vscode.Uri.joinPath(outputDir, cardFileName);
                                await vscode.workspace.fs.writeFile(cardFileUri, Buffer.from(markdownContent));
                                generatedCards++;
                                progress.report({ increment: (generatedCards / allFiles.length) * 100, message: `Generated ${generatedCards}/${allFiles.length} cards` });
                            } catch (e: any) {
                                console.error(`Failed to process ${file.path}:`, e);
                            }
                        }
                        panel.webview.postMessage({ command: 'contextCardsComplete', count: generatedCards });
                    });
                    break;
                case 'viewAsJson':
                case 'viewAsMarkdown': {
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders) {
                        const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, message.file);
                        try {
                            const document = await vscode.workspace.openTextDocument(fileUri);
                            await vscode.window.showTextDocument(document);
                        } catch (error) {
                            vscode.window.showErrorMessage('Could not open file: ' + error);
                        }
                    }
                    break;
                }
                case 'view-prd-graph':
                    vscode.commands.executeCommand('ai-prd-generator.viewPrd', message.filePath, 'graph');
                    break;
                case 'view-styled-prd':
                    vscode.commands.executeCommand('ai-prd-generator.viewPrd', message.filePath, 'styled');
                    break;
                case 'bulk-generate-context-cards':
                    vscode.commands.executeCommand('ai-prd-generator.bulkGenerateContextCards');
                    break;
                case 'view-context-cards':
                    vscode.commands.executeCommand('ai-prd-generator.viewContextCards');
                    break;
                case 'view-prd':
                    vscode.commands.executeCommand('ai-prd-generator.viewPrd');
                    break;
            }
        });
    });

    const setApiKeyCommand = vscode.commands.registerCommand('ai-prd-generator.setOpenAiApiKey', async () => {
        const apiKey = await context.secrets.get('openAiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key not set. Please use the "Set API Key" command.');
            return;
        }
        const apiKeyInput = await vscode.window.showInputBox({ prompt: 'Enter your OpenAI API Key', password: true });
        if (apiKeyInput) {
            await context.secrets.store('openAiApiKey', apiKeyInput);
            vscode.window.showInformationMessage('OpenAI API Key stored successfully.');
        }
    });

    const bulkGenerateContextCardsCommand = vscode.commands.registerCommand('ai-prd-generator.bulkGenerateContextCards', async () => {
        const apiKey = await context.secrets.get('openAiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key not set. Please use the "Set API Key" command.');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspaceUri = workspaceFolders[0].uri;

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating Context Cards...", cancellable: true }, async (progress, token) => {
            const generator = new ContextCardGenerator(workspaceUri.fsPath, apiKey);
            let filesProcessed = 0;
            try {
                const files = await generator.findSupportedFiles();
                progress.report({ increment: 0, message: `Found ${files.length} files.` });

                for (const file of files) {
                    if (token.isCancellationRequested) {
                        vscode.window.showInformationMessage('Context Card generation cancelled.');
                        return;
                    }
                    filesProcessed++;
                    const relativePath = vscode.workspace.asRelativePath(file);
                    progress.report({ increment: (filesProcessed / files.length) * 100, message: `Processing ${relativePath}` });

                    try {
                        const card = await generator.generateContextCardForFile(file);
                        if (card) {
                            const markdown = formatAsMarkdown(card);
                            const outputDir = vscode.Uri.joinPath(workspaceUri, 'mise-en-place-output', 'context-cards');
                            await vscode.workspace.fs.createDirectory(outputDir);
                            const cardPath = vscode.Uri.joinPath(outputDir, `${path.basename(file, path.extname(file))}.md`);
                            await vscode.workspace.fs.writeFile(cardPath, Buffer.from(markdown));
                            await updateAiManifest(context, {
                                type: 'context-card',
                                filePath: vscode.workspace.asRelativePath(cardPath),
                                title: card.id,
                                forFile: relativePath
                            });
                        }
                    } catch (fileError: any) {
                        console.error(`Failed to generate card for ${relativePath}:`, fileError);
                        vscode.window.showWarningMessage(`Skipping ${relativePath}: ${fileError.message}`);
                    }
                }
                vscode.window.showInformationMessage('Context Card generation complete.');
            } catch (error: any) {
                console.error('Error during bulk generation:', error);
                vscode.window.showErrorMessage(`An error occurred: ${error.message}`);
            }
        });
    });

    const viewContextCardsCommand = vscode.commands.registerCommand('ai-prd-generator.viewContextCards', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const outputDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'mise-en-place-output', 'context-cards');
        try {
            const files = await vscode.workspace.fs.readDirectory(outputDir);
            const cardFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.md')).map(f => f[0]);

            if (cardFiles.length === 0) {
                vscode.window.showInformationMessage('No Context Cards found.');
                return;
            }

            const selectedFile = await vscode.window.showQuickPick(cardFiles, { placeHolder: 'Select a Context Card to view' });

            if (selectedFile) {
                const filePath = vscode.Uri.joinPath(outputDir, selectedFile);
                const fileContent = await vscode.workspace.fs.readFile(filePath);
                const markdown = Buffer.from(fileContent).toString('utf-8');

                const panel = vscode.window.createWebviewPanel(
                    'contextCardViewer',
                    `Context Card: ${selectedFile}`,
                    vscode.ViewColumn.One,
                    {}
                );
                panel.webview.html = getStyledMdViewerWebviewContent(markdown);
            }
        } catch (error) {
            vscode.window.showInformationMessage('No Context Cards have been generated yet.');
            console.log('Could not read context card directory, likely does not exist yet.');
        }
    });

    const viewPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewPrd', async (filePath: string, viewType: 'json' | 'markdown' | 'graph' | 'styled') => {
        if (!filePath) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open.');
                return;
            }
            const prdDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'mise-en-place-output', 'prd');
            try {
                const files = await vscode.workspace.fs.readDirectory(prdDir);
                const prdFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.json')).map(f => f[0]);

                if (prdFiles.length === 0) {
                    vscode.window.showInformationMessage('No PRDs found.');
                    return;
                }

                const selectedFile = await vscode.window.showQuickPick(prdFiles, { placeHolder: 'Select a PRD to view' });
                if (!selectedFile) { return; }
                filePath = vscode.Uri.joinPath(prdDir, selectedFile).fsPath;
            } catch (e) {
                vscode.window.showInformationMessage('No PRDs have been generated yet.');
                return;
            }
        }

        const fileUri = vscode.Uri.file(filePath);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const prdData: PrdJson = JSON.parse(Buffer.from(fileContent).toString('utf-8'));

        const panel = vscode.window.createWebviewPanel(
            `prdView-${viewType}`,
            `${prdData.title} - ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`,
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [context.extensionUri] }
        );

        try {
            if (viewType === 'styled') {
                panel.webview.html = getStyledPrdWebviewContent(prdData);
            } else if (viewType === 'markdown') {
                const mdPath = fileUri.fsPath.replace(/\.json$/, '.md');
                const mdContent = await vscode.workspace.fs.readFile(vscode.Uri.file(mdPath));
                panel.webview.html = getStyledMdViewerWebviewContent(Buffer.from(mdContent).toString('utf-8'));
            } else if (viewType === 'graph') {
                const cytoscapeUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cytoscape.min.js'));
                const dagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'dagre.min.js'));
                const cyDagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cytoscape-dagre.js'));

                // Create graph data from PRD
                const graphData = {
                    nodes: [
                        { data: { id: 'prd', label: prdData.title, type: 'prd' } },
                        ...prdData.features.map(f => ({ data: { id: f.title.replace(/\s/g, ''), label: f.title, type: 'feature' } }))
                    ],
                    edges: [
                        ...prdData.features.map(f => ({ data: { source: 'prd', target: f.title.replace(/\s/g, ''), label: 'contains' } }))
                    ]
                };

                panel.webview.html = getGraphViewerWebviewContent(graphData, cytoscapeUri, dagreUri, cyDagreUri);
            } else {
                panel.webview.html = `<pre>${JSON.stringify(prdData, null, 2)}</pre>`;
            }
        } catch (error: any) {
            console.error('Error reading or parsing PRD file:', error);
            vscode.window.showErrorMessage(`Failed to open PRD viewer: ${error.message}`);
        }
    });

    context.subscriptions.push(generatePrdCommand, setApiKeyCommand, viewPrdCommand, bulkGenerateContextCardsCommand, viewContextCardsCommand);
}
