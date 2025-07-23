/**
 * @file generatePrd.ts
 * @description This file contains the logic for registering and handling the main 'Generate PRD' command.
 * 
 * The logic of this file is to:
 * 1.  Register the 'ai-prd-generator.generatePrd-dev' command with VS Code.
 * 2.  Create and manage a singleton webview panel to serve as the UI.
 * 3.  Load the webview's HTML content from `mainView.ts` and inject the `main.js` script.
 * 4.  Handle all messages sent from the webview's client-side script.
 * 5.  Orchestrate the backend logic, including fetching API keys, calling the OpenAI API, and saving files.
 * 6.  Send status updates, data, and errors back to the webview to update the UI.
 */
import * as vscode from 'vscode';
import { getWebviewContent } from '../utils/webview';
import { callOpenAiAPI } from '../utils/openai';
import { PrdOutput } from '../utils/types';
import { updateAiManifest } from '../utils/manifest';

/**
 * Logic Step: Register the command that creates and shows the PRD generator webview panel.
 * This function is called once when the extension is activated.
 * @param context The extension context provided by VS Code.
 */
export function registerGeneratePrdCommand(context: vscode.ExtensionContext) {
    // Use a singleton pattern for the webview panel to avoid multiple instances.
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    // Logic Step: Register the command with VS Code's command palette.
    const command = vscode.commands.registerCommand('ai-prd-generator.generatePrd-dev', async () => {
        // If the panel already exists, just reveal it.
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Logic Step: Create a new webview panel if one doesn't exist.
        currentPanel = vscode.window.createWebviewPanel('prdGenerator', 'PRD Generator', vscode.ViewColumn.One, {
            enableScripts: true, // Allow scripts to run in the webview.
            retainContextWhenHidden: true // Keep the webview state even when it's not visible.
        });

        // Logic Step: Load the client-side script and set the webview's HTML content.
        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'main.js');
        const scriptContent = await vscode.workspace.fs.readFile(scriptPath);
        currentPanel.webview.html = getWebviewContent(Buffer.from(scriptContent).toString('utf-8'), currentPanel);

        let isWebviewReady = false;

        // Logic Step: Set up a listener to clean up the panel when it's closed by the user.
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, context.subscriptions);

        // --- Message Handler ---

        // Logic Step: Set up a listener to handle all messages from the webview's script.
        currentPanel.webview.onDidReceiveMessage(async message => {
            // Logic Step: Handle the 'webviewReady' handshake message.
            if (message.command === 'webviewReady') {
                isWebviewReady = true;
                // The webview is ready, so we can now send it the initial API key status.
                const apiKey = await context.secrets.get('openAiApiKey');
                if (currentPanel) {
                    await currentPanel.webview.postMessage({ command: 'apiKeyStatus', apiKey: apiKey });
                }
                return;
            }

            // Logic Step: Handle the 'saveApiKey' message.
            if (message.command === 'saveApiKey') {
                // Securely store the API key using VS Code's SecretStorage.
                await context.secrets.store('openAiApiKey', message.apiKey);
                // Send the updated status back to the webview to refresh the UI.
                if (currentPanel) {
                    await currentPanel.webview.postMessage({ command: 'apiKeyStatus', apiKey: message.apiKey });
                }
                return;
            }

            // Logic Step: Handle the 'generate' PRD message.
            if (message.command === 'generate') {
                // Use a progress indicator to give the user feedback during the long-running task.
                vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating PRD...", cancellable: false }, async (progress) => {
                    progress.report({ increment: 0, message: "Calling AI..." });
                    // Get the API key from secret storage.
                    const apiKey = await context.secrets.get('openAiApiKey');
                    if (!apiKey) {
                        // Validate that the API key exists.
                        vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
                        if (isWebviewReady && currentPanel) {
                            await currentPanel.webview.postMessage({ command: 'error', text: 'API Key is not set.' });
                        }
                        return;
                    }
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        // Validate that a workspace is open to save files.
                        vscode.window.showErrorMessage('No workspace folder found. Please open a folder to save PRD files.');
                        if (isWebviewReady && currentPanel) {
                            await currentPanel.webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
                        }
                        return;
                    }
                    try {
                        // Logic Step: Call the OpenAI API and handle the file-saving logic.
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
                        // Logic Step: Handle any errors during the generation process.
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

    // Logic Step: Add the command to the extension's subscriptions to ensure it's disposed of correctly.
    context.subscriptions.push(command);
}
