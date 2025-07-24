/**
 * @file main.ts
 * @description This is the main entry point for the webview's client-side TypeScript.
 * It orchestrates the application by initializing event handlers and managing message passing between the webview and the extension.
 */

import { updateApiKeyDisplay, showPostGenerationControls, displayError } from './ui.js';
import { initializeEventHandlers } from './eventHandlers.js';
import { COMMANDS } from './commands.js';

// Define a global type for the VS Code API object
declare global {
    interface VscodeState {
        [key: string]: any;
    }

    var vscode: {
        postMessage(message: any): void;
        getState(): VscodeState;
        setState(state: VscodeState): void;
    };
}

// Ensure vscode API is available
const vscode = (window as any).acquireVsCodeApi();

(function() {
    console.log('Webview main.ts loaded');
    
    // Notify the extension that the webview is ready.
    console.log('Sending webviewReady message');
    vscode.postMessage({ command: COMMANDS.WEBVIEW_READY });

    // Set up all event listeners for user interactions.
    initializeEventHandlers(vscode);

    // Handle messages received from the extension.
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        console.log('Received message:', message);
        switch (message.command) {
            case 'apiKeyStatus': // This is sent from the extension, not a shared command
                console.log('Received apiKeyStatus:', message.hasApiKey);
                updateApiKeyDisplay(message.hasApiKey);
                break;
            case 'prdGenerated': // This is also sent from the extension
                showPostGenerationControls();
                break;
            case 'error': // Generic error message from extension
                displayError(message.text);
                break;
        }
    });
})();
