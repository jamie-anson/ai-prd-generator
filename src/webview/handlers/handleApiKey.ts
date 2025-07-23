import * as vscode from 'vscode';

/**
 * Handles all API key-related messages from the webview.
 * @param message The message object from the webview.
 * @param context The extension context for accessing secrets.
 * @param webview The webview instance to post messages back to.
 */
export async function handleApiKey(message: any, context: vscode.ExtensionContext, webview: vscode.Webview) {
    if (message.command === 'webviewReady') {
        const apiKey = await context.secrets.get('openAiApiKey');
        await webview.postMessage({ command: 'apiKeyStatus', apiKey: apiKey });
        return true; // Command was handled
    }

    if (message.command === 'saveApiKey') {
        await context.secrets.store('openAiApiKey', message.apiKey);
        await webview.postMessage({ command: 'apiKeyStatus', apiKey: message.apiKey });
        return true; // Command was handled
    }

    return false; // Command was not an API key command
}
