/**
 * @file eventHandlers.js
 * @description This module is responsible for setting up all event listeners for the webview's interactive elements.
 * It imports the DOM elements from ui.js and uses the vscode API to post messages to the extension.
 */

import { elements } from './ui.js';

/**
 * Initializes all event listeners for the webview.
 * @param {object} vscode - The VS Code API object for posting messages.
 */
export function initializeEventHandlers(vscode) {
    // Generate PRD button
    if (elements.generatePrdButton && elements.prdPrompt) {
        elements.generatePrdButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'generate', text: elements.prdPrompt.value });
        });
    }

    // Set API Key button
    if (elements.setApiKeyButton && elements.apiKeyInput) {
        elements.setApiKeyButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'saveApiKey', apiKey: elements.apiKeyInput.value });
        });
    }

    // Change API Key button
    if (elements.changeApiKeyButton) {
        elements.changeApiKeyButton.addEventListener('click', () => {
            if (elements.apiKeyDisplay && elements.apiKeyInputContainer) {
                elements.apiKeyDisplay.classList.add('hidden');
                elements.apiKeyInputContainer.classList.remove('hidden');
            }
        });
    }

    // View PRD button
    if (elements.viewPrdButton) {
        elements.viewPrdButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'viewPrd' });
        });
    }

    // View Graph button
    if (elements.viewGraphButton) {
        elements.viewGraphButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'viewGraph' });
        });
    }

    // Bulk Generate Context Cards button
    if (elements.bulkGenerateContextCardsButton) {
        elements.bulkGenerateContextCardsButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'bulkGenerateContextCards' });
        });
    }
}
