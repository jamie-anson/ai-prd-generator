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

import { elements, updateApiKeyDisplay, updateUIBasedOnProjectState, displayErrorMessage, displayInfoMessage, displaySuccessMessage, displayCCSResults } from './ui';
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
                case 'apiKeyStatus':
                    console.log('[UI] API key status received:', message.hasApiKey);
                    if (typeof message.hasApiKey === 'boolean') {
                        updateApiKeyDisplay(message.hasApiKey);
                        console.log('[UI] Updated API key display with hasApiKey:', message.hasApiKey);
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
                    
                case 'ccsGenerated':
                    if (message.analysis && typeof message.analysis === 'string') {
                        displayCCSResults(message.analysis);
                    } else {
                        console.error('Invalid ccsGenerated message format:', message);
                        displayErrorMessage('Invalid CCS analysis data received', 'validation');
                    }
                    break;
                    
                case 'info':
                    if (message.text && typeof message.text === 'string') {
                        console.log('[INFO]', message.text);
                        displayInfoMessage(message.text);
                    } else {
                        console.error('Invalid info message format:', message);
                    }
                    break;
                    
                case 'success':
                    if (message.text && typeof message.text === 'string') {
                        console.log('[SUCCESS]', message.text);
                        displaySuccessMessage(message.text);
                    } else {
                        console.error('Invalid success message format:', message);
                    }
                    break;
                    
                case 'error':
                    if (message.text && typeof message.text === 'string') {
                        console.error('[ERROR]', message.text);
                        displayErrorMessage(message.text, 'generation');
                    } else {
                        console.error('Invalid error message format:', message);
                        displayErrorMessage('Unknown error occurred', 'generation');
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
