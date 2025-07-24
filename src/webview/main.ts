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

    const vscode: {
        postMessage(message: any): void;
        getState(): VscodeState;
        setState(state: VscodeState): void;
    };
}

(function() {
    // Notify the extension that the webview is ready.
    vscode.postMessage({ command: COMMANDS.WEBVIEW_READY });

    // Set up all event listeners for user interactions.
    initializeEventHandlers(vscode);

    // Handle messages received from the extension.
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
            case 'apiKeyStatus': // This is sent from the extension, not a shared command
                updateApiKeyDisplay(message.apiKey);
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
