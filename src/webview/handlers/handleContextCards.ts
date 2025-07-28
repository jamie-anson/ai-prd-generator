import * as vscode from 'vscode';
import { TypeScriptContextCardGenerator } from '../../services/contextCardGenerator';

/**
 * Handles the 'bulkGenerateContextCards' message from the webview.
 * Uses the new TypeScript Language Service-based context card generator.
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
            return true; // Command was handled
        }
        
        try {
            const workspaceUri = workspaceFolders[0].uri;
            
            // Show progress to user
            await webview.postMessage({ command: 'info', text: 'Generating context cards using TypeScript Language Service...' });
            
            // Use the new TypeScript Language Service-based generator
            const generator = new TypeScriptContextCardGenerator(workspaceUri, context);
            await generator.generateAndSaveContextCards();
            
            // Success message
            vscode.window.showInformationMessage('Context cards generated successfully!');
            await webview.postMessage({ command: 'success', text: 'Context cards generated successfully! Check the mise-en-place-output/context-cards directory.' });
            
        } catch (error: any) {
            console.error('Error generating context cards:', error);
            vscode.window.showErrorMessage(`Error generating context cards: ${error.message}`);
            await webview.postMessage({ command: 'error', text: `Error: ${error.message}` });
        }
        return true; // Command was handled
    }

    return false; // Command was not a context cards command
}
