import * as vscode from 'vscode';

/**
 * Handles the 'webviewReady' message from the webview.
 * Checks if an API key is stored and sends the status back to the webview.
 * @param message The message object from the webview.
 * @param context The extension context.
 * @param webview The webview instance.
 */
export async function handleWebviewReady(
    message: any,
    context: vscode.ExtensionContext,
    webview: vscode.Webview
): Promise<void> {
    const apiKey = await context.secrets.get('openAiApiKey');
    webview.postMessage({ command: 'apiKeyStatus', apiKey: !!apiKey });
}
