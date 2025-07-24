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
    console.log('handleWebviewReady called');
    const apiKey = await context.secrets.get('openAiApiKey');
    const hasApiKey = !!apiKey;
    console.log('Sending apiKeyStatus message, hasApiKey:', hasApiKey);
    webview.postMessage({ command: 'apiKeyStatus', hasApiKey });
}
