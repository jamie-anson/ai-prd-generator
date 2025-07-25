import * as vscode from 'vscode';
import { ContextCardGenerator } from '../../context-card-generator';

/**
 * Handles the 'bulkGenerateContextCards' message from the webview.
 * @param message The message object from the webview.
 * @param context The extension context.
 * @param webview The webview instance to post messages back to.
 */
export async function handleContextCards(message: any, context: vscode.ExtensionContext, webview: vscode.Webview) {
    if (message.command === 'generate-context-cards') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a folder to generate context cards.');
            await webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
            // @intent: Return true to indicate the workspace folder error was handled
            return true; // Command was handled
        }
        try {
            const workspaceUri = workspaceFolders[0].uri;
            const generator = new ContextCardGenerator(workspaceUri, context);
            await generator.generateAndSaveContextCards();
        } catch (error: any) {
            console.error('Error generating context cards:', error);
            vscode.window.showErrorMessage(`Error generating context cards: ${error.message}`);
            await webview.postMessage({ command: 'error', text: `Error: ${error.message}` });
        }
        return true; // Command was handled
    }

    // @intent: Return false if the message command is not a context cards command
    return false; // Command was not a context cards command
}
