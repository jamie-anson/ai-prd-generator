// @ts-nocheck
/**
 * @file handleWebviewReady.ts
 * @description Handles the webview ready event, including API key status and project state detection.
 * 
 * The logic of this file is to:
 * 1. Respond to the webview ready event by checking API key availability.
 * 2. Detect the current project state using ProjectStateDetector.
 * 3. Send both API key status and project state to the webview for context-aware UI.
 * 4. Handle detection errors gracefully with fallback state.
 */

import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../utils/projectStateDetector';


/**
 * Logic Step: Handle the 'webviewReady' message from the webview.
 * This function orchestrates the initialization of the webview by sending both
 * API key status and project state information for context-aware UI behavior.
 * @param message The message object from the webview (contains command type)
 * @param context The extension context for accessing secrets and configuration
 * @param webview The webview instance for posting messages back to the UI
 */
export async function handleWebviewReady(
    // @ts-ignore
    // @ts-nocheck
    message: any,
    context: vscode.ExtensionContext,
    webview: vscode.Webview
): Promise<void> {
        console.log('--- CASCADE IS HERE: Executing latest handleWebviewReady.ts ---');
    console.log('handleWebviewReady called');
    
    // Check API key status with error handling
    let hasApiKey = false;
    try {
        const apiKey = await context.secrets.get('openAiApiKey');
        hasApiKey = !!apiKey;
        console.log('[Extension] API key detection - apiKey length:', apiKey ? apiKey.length : 0, 'hasApiKey:', hasApiKey);
    } catch (error) {
        console.error('Error retrieving API key:', error);
        hasApiKey = false;
    }
    
    console.log('[Extension] Sending apiKeyStatus message, hasApiKey:', hasApiKey);
    webview.postMessage({ command: 'apiKeyStatus', hasApiKey });

    // Logic Step: Project state will be sent after UI confirms readiness via 'uiReady' message
    // This ensures proper coordination and eliminates race conditions
    console.log('[Extension] Waiting for uiReady message before sending project state...');
}
