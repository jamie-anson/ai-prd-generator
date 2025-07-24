/**
 * @file ui.ts
 * @description This module is responsible for all direct DOM manipulations and UI updates.
 * It exports DOM elements and functions to keep the UI logic separate from event handling and state management.
 */

// --- DOM Element Exports ---
// We export a single object containing all required DOM elements to avoid cluttering the global namespace.
export const elements = {
    generatePrdButton: document.getElementById('generate-prd') as HTMLButtonElement,
    prdPrompt: document.getElementById('prd-prompt') as HTMLTextAreaElement,
    errorContainer: document.getElementById('error-container') as HTMLDivElement,
    generationControls: document.getElementById('generation-controls') as HTMLDivElement,
    postGenerationControls: document.getElementById('post-generation-controls') as HTMLDivElement,
    viewPrdButton: document.getElementById('view-prd') as HTMLButtonElement,
    viewGraphButton: document.getElementById('view-graph') as HTMLButtonElement,
    bulkGenerateContextCardsButton: document.getElementById('bulk-generate-context-cards') as HTMLButtonElement,
    apiKeyDisplay: document.getElementById('api-key-display') as HTMLDivElement,
    apiKeyInputContainer: document.getElementById('api-key-input-container') as HTMLDivElement,
    apiKeyObfuscated: document.getElementById('api-key-obfuscated') as HTMLSpanElement,
    apiKeyInput: document.getElementById('api-key-input') as HTMLInputElement,
    setApiKeyButton: document.getElementById('set-api-key') as HTMLButtonElement,
    changeApiKeyButton: document.getElementById('change-api-key') as HTMLButtonElement,
    generateContextTemplatesButton: document.getElementById('generate-context-templates') as HTMLButtonElement,
};

// --- UI Update Functions ---

export function updateApiKeyDisplay(hasApiKey: boolean): void {
    if (elements.apiKeyDisplay && elements.apiKeyInputContainer && elements.apiKeyObfuscated) {
        if (hasApiKey) {
            elements.apiKeyObfuscated.textContent = `sk-******************key-saved`;
            elements.apiKeyDisplay.classList.remove('hidden');
            elements.apiKeyInputContainer.classList.add('hidden');
        } else {
            elements.apiKeyDisplay.classList.add('hidden');
            elements.apiKeyInputContainer.classList.remove('hidden');
        }
    }
}

export function showPostGenerationControls(): void {
    if (elements.generationControls && elements.postGenerationControls) {
        elements.generationControls.classList.add('hidden');
        elements.postGenerationControls.classList.remove('hidden');
    }
}

export function displayError(errorMessage: string): void {
    if (elements.errorContainer) {
        elements.errorContainer.textContent = errorMessage;
        elements.errorContainer.style.display = 'block';
    }
}
