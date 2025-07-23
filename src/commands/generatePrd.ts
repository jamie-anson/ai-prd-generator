import * as vscode from 'vscode';
import { getWebviewContent } from '../utils/webview';
import { callOpenAiAPI } from '../utils/openai';
import { PrdOutput } from '../utils/types';
import { updateAiManifest } from '../utils/manifest';


export function registerGeneratePrdCommand(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    const command = vscode.commands.registerCommand('ai-prd-generator.generatePrd-dev', async () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        currentPanel = vscode.window.createWebviewPanel('prdGenerator', 'PRD Generator', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
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
                const apiKey = await context.secrets.get('openAiApiKey');
                if (currentPanel) {
                    await currentPanel.webview.postMessage({ command: 'apiKeyStatus', apiKey: !!apiKey });
                }
                return;
            }

            if (message.command === 'generate') {
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

                            const safeTitle = prdOutput.json.title.replace(/[^a-z0-9_\\-]+/gi, '-').toLowerCase();
                            const jsonFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}.json`);
                            const mdFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}.md`);

                            await vscode.workspace.fs.writeFile(jsonFilePath, Buffer.from(JSON.stringify(prdOutput.json, null, 2), 'utf-8'));
                            await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown, 'utf-8'));

                            if (isWebviewReady && currentPanel) {
                                await currentPanel.webview.postMessage({ command: 'prdGenerated', prd: prdOutput.json });
                            }

                            await updateAiManifest(context, { type: 'prd', ...prdOutput.json });

                            vscode.window.showInformationMessage(`PRD "${prdOutput.json.title}" generated and saved.`);
                        } else {
                            vscode.window.showErrorMessage('Failed to generate PRD. No output from AI.');
                            if (isWebviewReady && currentPanel) {
                                await currentPanel.webview.postMessage({ command: 'error', text: 'No output from AI.' });
                            }
                        }
                    } catch (error: any) {
                        console.error('Error generating PRD:', error);
                        vscode.window.showErrorMessage(`Error generating PRD: ${error.message}`);
                        if (isWebviewReady && currentPanel) {
                            await currentPanel.webview.postMessage({ command: 'error', text: `Error: ${error.message}` });
                        }
                    }
                });
            }
        });
    });

    context.subscriptions.push(command);
}
