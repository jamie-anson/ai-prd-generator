/**
 * @file main.js
 * @description This is the main entry point for the webview's client-side JavaScript.
 * It orchestrates the application by initializing event handlers and managing message passing between the webview and the extension.
 */

import { updateApiKeyDisplay, showPostGenerationControls, displayError } from './ui.js';
import { initializeEventHandlers } from './eventHandlers.js';

(function() {
    const vscode = acquireVsCodeApi();

    // Notify the extension that the webview is ready.
    vscode.postMessage({ command: 'webviewReady' });

    // Set up all event listeners for user interactions.
    initializeEventHandlers(vscode);

    // Handle messages received from the extension.
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'apiKeyStatus':
                updateApiKeyDisplay(message.apiKey);
                break;
            case 'prdGenerated':
                showPostGenerationControls();
                break;
            case 'error':
                displayError(message.text);
                break;
        }
    });
})();

