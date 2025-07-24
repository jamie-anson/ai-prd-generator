import * as vscode from 'vscode';
import { OpenAiService } from '../../utils/openai';
import { updateAiManifest } from '../../utils/manifest';

/**
 * Handles the 'generate' message from the webview to generate a PRD.
 * @param message The message object from the webview.
 * @param context The extension context.
 * @param webview The webview instance to post messages back to.
 * @returns An object containing the URIs of the generated markdown and graph files, or undefined if generation fails.
 */
export async function handleGeneratePrd(message: any, context: vscode.ExtensionContext, webview: vscode.Webview): Promise<{ md?: vscode.Uri, graph?: vscode.Uri } | undefined> {
        if (message.command !== 'generate-prd') {
        return undefined;
    }

    let generatedPaths: { md?: vscode.Uri, graph?: vscode.Uri } | undefined = undefined;

    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating PRD...", cancellable: false }, async (progress) => {
        progress.report({ increment: 0, message: "Calling AI..." });

        const apiKey = await context.secrets.get('openAiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
            await webview.postMessage({ command: 'error', text: 'API Key is not set.' });
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a folder to save PRD files.');
            await webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
            return;
        }

        try {
                        const openAiService = new OpenAiService(apiKey);
            const prdOutput = await openAiService.generatePrd(message.text);
            progress.report({ increment: 50, message: "Saving files..." });

            if (prdOutput) {
                const config = vscode.workspace.getConfiguration('aiPrdGenerator.prdOutput');
                const prdPath = config.get<string>('prdPath') || 'mise-en-place-output/prd';

                const workspaceUri = workspaceFolders[0].uri;
                const outputDir = vscode.Uri.joinPath(workspaceUri, prdPath);
                await vscode.workspace.fs.createDirectory(outputDir);

                const safeTitle = prdOutput.json.title.replace(/[^a-z0-9_\-]+/gi, '-').toLowerCase();
                const mdFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}.md`);
                const graphFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}-graph.json`);

                await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown, 'utf-8'));
                await vscode.workspace.fs.writeFile(graphFilePath, Buffer.from(JSON.stringify(prdOutput.graph, null, 2), 'utf-8'));

                generatedPaths = { md: mdFilePath, graph: graphFilePath };

                await webview.postMessage({ command: 'prdGenerated', prd: prdOutput.json });
                await updateAiManifest(context, { type: 'prd', ...prdOutput.json });

                vscode.window.showInformationMessage(`PRD "${prdOutput.json.title}" generated and saved.`);
            } else {
                vscode.window.showErrorMessage('Failed to generate PRD. No output from AI.');
                await webview.postMessage({ command: 'error', text: 'No output from AI.' });
            }
            
        } catch (error: any) {
            console.error('Error generating PRD:', error);
            vscode.window.showErrorMessage(`Error generating PRD: ${error.message}`);
            await webview.postMessage({ command: 'error', text: `Error: ${error.message}` });
        }
    });

    return generatedPaths;
}
