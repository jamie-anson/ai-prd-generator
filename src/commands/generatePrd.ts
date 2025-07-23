/**
 * @file generatePrd.ts
 * @description This file is responsible for registering the 'Generate PRD' command and managing the webview panel.
 * 
 * The logic of this file is to:
 * 1.  Register the 'ai-prd-generator.generatePrd-dev' command with VS Code.
 * 2.  Create and manage a singleton webview panel to serve as the UI.
 * 3.  Load the webview's HTML and inject the client-side script.
 * 4.  Route messages from the webview to the appropriate handlers in `src/webview/handlers`.
 */
import * as vscode from 'vscode';
import { getWebviewContent } from '../utils/webview';
import { handleApiKey } from '../webview/handlers/handleApiKey';
import { handleViewCommands } from '../webview/handlers/handleViewCommands';
import { handleContextCards } from '../webview/handlers/handleContextCards';
import { handleGeneratePrd } from '../webview/handlers/handleGeneratePrd';

/**
 * Logic Step: Register the command that creates and shows the PRD generator webview panel.
 * This function is called once when the extension is activated.
 * @param context The extension context provided by VS Code.
 */
export function registerGeneratePrdCommand(context: vscode.ExtensionContext) {
    // Use a singleton pattern for the webview panel to avoid multiple instances.
    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let lastGeneratedPaths: { md?: vscode.Uri, graph?: vscode.Uri } | undefined = undefined;

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

        // Logic Step: Handle messages from the webview's client-side script.
        currentPanel.webview.onDidReceiveMessage(async message => {
            if (await handleApiKey(message, context, currentPanel!.webview)) {
                return;
            }
            if (handleViewCommands(message, lastGeneratedPaths)) {
                return;
            }
            if (await handleContextCards(message, context, currentPanel!.webview)) {
                return;
            }

            const generatedPaths = await handleGeneratePrd(message, context, currentPanel!.webview);
            if (generatedPaths) {
                lastGeneratedPaths = generatedPaths;
            }
        });
    });

    // Logic Step: Add the command to the extension's subscriptions to ensure it's disposed of correctly.
    context.subscriptions.push(command);
}
