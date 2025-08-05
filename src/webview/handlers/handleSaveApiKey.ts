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
    // PHASE 5: Critical fix - handle both command formats for compatibility
    if (message.command === 'saveApiKey' || message.command === 'save-api-key') {
        console.log('[Extension] 💾 Saving API key:', { hasKey: !!message.apiKey, keyLength: message.apiKey?.length || 0 });
        await context.secrets.store('openAiApiKey', message.apiKey);
        console.log('[Extension] ✅ API key saved successfully');
        await webview.postMessage({ command: 'apiKeyStatus', hasApiKey: !!message.apiKey });
        console.log('[Extension] 📤 API key status sent to webview');
        return true; // Command was handled
    }
    return false; // Command was not handled
}
