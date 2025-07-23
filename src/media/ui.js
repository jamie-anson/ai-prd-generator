/**
 * @file ui.js
 * @description This module is responsible for all direct DOM manipulations and UI updates.
 * It exports DOM elements and functions to keep the UI logic separate from event handling and state management.
 */

// --- DOM Element Exports ---
// We export a single object containing all required DOM elements to avoid cluttering the global namespace.
export const elements = {
    generatePrdButton: document.getElementById('generate-prd'),
    prdPrompt: document.getElementById('prd-prompt'),
    errorContainer: document.getElementById('error-container'),
    generationControls: document.getElementById('generation-controls'),
    postGenerationControls: document.getElementById('post-generation-controls'),
    viewPrdButton: document.getElementById('view-prd'),
    viewGraphButton: document.getElementById('view-graph'),
    apiKeyDisplay: document.getElementById('api-key-display'),
    apiKeyInputContainer: document.getElementById('api-key-input-container'),
    apiKeyObfuscated: document.getElementById('api-key-obfuscated'),
    apiKeyInput: document.getElementById('api-key-input'),
    setApiKeyButton: document.getElementById('set-api-key'),
    changeApiKeyButton: document.getElementById('change-api-key'),
};

// --- UI Update Functions ---
// These functions encapsulate the logic for changing the visibility and content of UI elements.

export function updateApiKeyDisplay(apiKey) {
    if (elements.apiKeyDisplay && elements.apiKeyInputContainer && elements.apiKeyObfuscated) {
        const hasApiKey = apiKey && apiKey.trim() !== '';
        if (hasApiKey) {
            elements.apiKeyObfuscated.textContent = `sk-******************${apiKey.slice(-4)}`;
            elements.apiKeyDisplay.classList.remove('hidden');
            elements.apiKeyInputContainer.classList.add('hidden');
        } else {
            elements.apiKeyDisplay.classList.add('hidden');
            elements.apiKeyInputContainer.classList.remove('hidden');
        }
    }
}

export function showPostGenerationControls() {
    if (elements.generationControls && elements.postGenerationControls) {
        elements.generationControls.classList.add('hidden');
        elements.postGenerationControls.classList.remove('hidden');
    }
}

export function displayError(errorMessage) {
    if (elements.errorContainer) {
        elements.errorContainer.textContent = errorMessage;
        elements.errorContainer.style.display = 'block';
    }
}
