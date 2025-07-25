// @ts-nocheck
/**
 * @file main.ts
 * @description This is the main entry point for the webview's client-side TypeScript.
 * 
 * The logic of this file is to:
 * 1. Initialize the webview by sending a ready message to the extension.
 * 2. Set up all event handlers for user interactions with UI elements.
 * 3. Handle incoming messages from the extension (API key status, project state, errors).
 * 4. Update the UI based on received project state for context-aware behavior.
 * 5. Manage the communication bridge between the webview and VS Code extension.
 */

import { elements, updateApiKeyDisplay, updateUIBasedOnProjectState, displayErrorMessage } from './ui';
import { MessageRouter } from './router';
import { initializeEventHandlers } from './eventHandlers';
import { ExtensionToWebviewMessage, ProjectState, isValidProjectState } from './types';
import { isValidProjectState as validateProjectState } from './uiUtils';

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
    vscode.postMessage({ command: 'webviewReady' });

    // Set up all event listeners for user interactions.
    initializeEventHandlers(vscode);

    // Logic Step: Listen for messages from the extension with type safety
    window.addEventListener('message', (event: MessageEvent<ExtensionToWebviewMessage>) => {
        const message = event.data;
        
        try {
            switch (message.command) {
                case 'api-key-status':
                    if (typeof message.hasApiKey === 'boolean') {
                        updateApiKeyDisplay(message.hasApiKey);
                    } else {
                        console.error('Invalid api-key-status message format:', message);
                        displayErrorMessage('Invalid API key status received', 'validation');
                    }
                    break;
                    
                case 'project-state-update':
                    if (validateProjectState(message.projectState)) {
                        updateUIBasedOnProjectState(message.projectState as ProjectState);
                    } else {
                        console.error('Invalid project-state-update message format:', message);
                        displayErrorMessage('Invalid project state data received', 'validation');
                    }
                    break;
                    
                default:
                    console.log('Unknown message command:', message.command);
            }
        } catch (error) {
            console.error('Error processing message:', error, message);
            displayErrorMessage('Error processing extension message', 'validation');
        }
    });
})();
