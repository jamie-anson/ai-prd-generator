/**
 * @file eventHandlers.ts
 * @description This module is responsible for setting up all event listeners for the webview's interactive elements.
 * It imports the DOM elements from ui.ts and uses the vscode API to post messages to the extension.
 */

import { elements } from './ui.js';
import { COMMANDS } from './commands.js';

/**
 * Initializes all event listeners for the webview.
 * @param vscode - The VS Code API object for posting messages.
 */
export function initializeEventHandlers(vscode: any): void {
    // Generate PRD button
    if (elements.generatePrdButton && elements.prdPrompt) {
        elements.generatePrdButton.addEventListener('click', () => {
            if (elements.prdPrompt) {
                vscode.postMessage({ command: COMMANDS.GENERATE_PRD, text: elements.prdPrompt.value });
            }
        });
    }

    // Set API Key button
    if (elements.setApiKeyButton && elements.apiKeyInput) {
        elements.setApiKeyButton.addEventListener('click', () => {
            if (elements.apiKeyInput) {
                vscode.postMessage({ command: COMMANDS.SAVE_API_KEY, apiKey: elements.apiKeyInput.value });
            }
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
            vscode.postMessage({ command: COMMANDS.VIEW_PRD });
        });
    }

    // View Graph button
    if (elements.viewGraphButton) {
        elements.viewGraphButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.VIEW_GRAPH });
        });
    }

    // Bulk Generate Context Cards button
    if (elements.bulkGenerateContextCardsButton) {
        elements.bulkGenerateContextCardsButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.GENERATE_CONTEXT_CARDS });
        });
    }

    // Generate Context Templates button
    if (elements.generateContextTemplatesButton) {
        elements.generateContextTemplatesButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.GENERATE_CONTEXT_TEMPLATES });
        });
    }

    // Generate Data Flow Diagram button
    if (elements.generateDataFlowDiagramButton) {
        elements.generateDataFlowDiagramButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.GENERATE_DATA_FLOW_DIAGRAM });
        });
    }

    // Generate Component Hierarchy button
    if (elements.generateComponentHierarchyButton) {
        elements.generateComponentHierarchyButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.GENERATE_COMPONENT_HIERARCHY });
        });
    }

    // View Data Flow Diagram button
    if (elements.viewDataFlowDiagramButton) {
        elements.viewDataFlowDiagramButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.VIEW_DATA_FLOW_DIAGRAM });
        });
    }

    // View Component Hierarchy button
    if (elements.viewComponentHierarchyButton) {
        elements.viewComponentHierarchyButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.VIEW_COMPONENT_HIERARCHY });
        });
    }

    // Generate CCS button
    if (elements.generateCCSButton) {
        elements.generateCCSButton.addEventListener('click', () => {
            vscode.postMessage({ command: COMMANDS.GENERATE_CCS });
        });
    }
}
