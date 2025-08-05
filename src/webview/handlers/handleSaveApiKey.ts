import * as vscode from 'vscode';

/**
 * @file handleSaveApiKey.ts
 * @description Handles the 'saveApiKey' command from the webview to securely store the user's API key.
 * 
 * The logic of this file is to:
 * 1. Receive the API key from the webview message.
 * 2. Use the VS Code SecretStorage API to securely store the key.
 * 3. Post a message back to the webview to confirm the key has been saved.
 * 4. Ensure the handler only responds to the 'saveApiKey' command.
 */

/**
 * Logic Step: Handles the 'saveApiKey' message from the webview.
 * @param message The message object from the webview, containing the API key.
 * @param context The extension context for accessing secrets.
 * @param webview The webview instance to post messages back to.
 */
export async function handleSaveApiKey(message: any, context: vscode.ExtensionContext, webview: vscode.Webview) {
    if (message.command === 'saveApiKey') {
        await context.secrets.store('openAiApiKey', message.apiKey);
        await webview.postMessage({ command: 'apiKeyStatus', hasApiKey: !!message.apiKey });
        return true; // Command was handled
    }
    return false; // Command was not handled
}
