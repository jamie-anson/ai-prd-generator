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
    generateDataFlowDiagramButton: document.getElementById('generate-data-flow-diagram') as HTMLButtonElement,
    generateComponentHierarchyButton: document.getElementById('generate-component-hierarchy') as HTMLButtonElement,
    viewDataFlowDiagramButton: document.getElementById('view-data-flow-diagram') as HTMLButtonElement,
    viewComponentHierarchyButton: document.getElementById('view-component-hierarchy') as HTMLButtonElement,
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

/**
 * Logic Step: Update the UI sections based on the current project state.
 * This function implements the core context-aware UI logic by showing/hiding sections
 * based on detected artifacts in the project. The logic ensures users only see relevant
 * options for their current workflow stage.
 * @param projectState Object containing boolean flags for detected artifacts
 */
export function updateUIBasedOnProjectState(projectState: any): void {
    // If any artifacts exist (PRD, context cards, or context templates), 
    // hide the generation controls and show post-generation controls
    // Logic: If context cards/templates exist, a PRD must have been used to generate them
    const hasAnyArtifacts = projectState.hasPRD || projectState.hasContextCards || projectState.hasContextTemplates;
    
    if (hasAnyArtifacts) {
        if (elements.generationControls) {
            elements.generationControls.classList.add('hidden');
        }
        if (elements.postGenerationControls) {
            elements.postGenerationControls.classList.remove('hidden');
        }
    } else {
        // Show PRD generation controls only if no artifacts exist
        if (elements.generationControls) {
            elements.generationControls.classList.remove('hidden');
        }
        if (elements.postGenerationControls) {
            elements.postGenerationControls.classList.add('hidden');
        }
    }

    // Update individual sections within post-generation controls
    updateContextTemplatesSection(projectState);
    updateContextCardsSection(projectState);
    updateDiagramSection(projectState);
}

/**
 * Logic Step: Update the Context Templates section visibility and button text.
 * Shows the section only if a PRD exists (required to generate templates).
 * Updates button text to indicate regeneration if templates already exist.
 * @param projectState Object containing project artifact detection results
 */
function updateContextTemplatesSection(projectState: any): void {
    const contextTemplatesSection = document.getElementById('context-templates-section');
    if (contextTemplatesSection) {
        if (projectState.hasPRD && !projectState.hasContextTemplates) {
            // Show if PRD exists but context templates don't
            contextTemplatesSection.classList.remove('hidden');
        } else if (projectState.hasContextTemplates) {
            // Update button text if context templates already exist
            const button = elements.generateContextTemplatesButton;
            if (button) {
                button.textContent = 'Regenerate Context Templates';
                button.title = 'Context templates already exist. Click to regenerate them.';
            }
            contextTemplatesSection.classList.remove('hidden');
        } else {
            // Hide if PRD doesn't exist
            contextTemplatesSection.classList.add('hidden');
        }
    }
}

/**
 * Logic Step: Update the Context Cards section visibility and button text.
 * Shows the section only if a PRD exists (required to generate context cards).
 * Updates button text to indicate regeneration if context cards already exist.
 * @param projectState Object containing project artifact detection results
 */
function updateContextCardsSection(projectState: any): void {
    const contextCardsSection = document.getElementById('context-cards-section');
    if (contextCardsSection) {
        if (projectState.hasPRD && !projectState.hasContextCards) {
            // Show if PRD exists but context cards don't
            contextCardsSection.classList.remove('hidden');
        } else if (projectState.hasContextCards) {
            // Update button text if context cards already exist
            const button = elements.bulkGenerateContextCardsButton;
            if (button) {
                button.textContent = 'Regenerate Context Cards';
                button.title = 'Context cards already exist. Click to regenerate them.';
            }
            contextCardsSection.classList.remove('hidden');
        } else {
            // Hide if PRD doesn't exist
            contextCardsSection.classList.add('hidden');
        }
    }
}

/**
 * Logic Step: Update the diagram buttons section visibility and button types.
 * Shows generate buttons if PRD exists but diagrams don't, or view buttons if diagrams exist.
 * @param projectState Object containing project artifact detection results
 */
function updateDiagramSection(projectState: any): void {
    // Only show diagram options if PRD exists
    if (!projectState.hasPRD) {
        // Hide both generate and view buttons if no PRD
        if (elements.generateDataFlowDiagramButton) {
            elements.generateDataFlowDiagramButton.style.display = 'none';
        }
        if (elements.generateComponentHierarchyButton) {
            elements.generateComponentHierarchyButton.style.display = 'none';
        }
        if (elements.viewDataFlowDiagramButton) {
            elements.viewDataFlowDiagramButton.style.display = 'none';
        }
        if (elements.viewComponentHierarchyButton) {
            elements.viewComponentHierarchyButton.style.display = 'none';
        }
        return;
    }

    // Handle Data Flow Diagram button
    if (projectState.hasDataFlowDiagram) {
        // Show view button, hide generate button
        if (elements.generateDataFlowDiagramButton) {
            elements.generateDataFlowDiagramButton.style.display = 'none';
        }
        if (elements.viewDataFlowDiagramButton) {
            elements.viewDataFlowDiagramButton.style.display = 'inline-block';
        }
    } else {
        // Show generate button, hide view button
        if (elements.generateDataFlowDiagramButton) {
            elements.generateDataFlowDiagramButton.style.display = 'inline-block';
        }
        if (elements.viewDataFlowDiagramButton) {
            elements.viewDataFlowDiagramButton.style.display = 'none';
        }
    }

    // Handle Component Hierarchy button
    if (projectState.hasComponentHierarchy) {
        // Show view button, hide generate button
        if (elements.generateComponentHierarchyButton) {
            elements.generateComponentHierarchyButton.style.display = 'none';
        }
        if (elements.viewComponentHierarchyButton) {
            elements.viewComponentHierarchyButton.style.display = 'inline-block';
        }
    } else {
        // Show generate button, hide view button
        if (elements.generateComponentHierarchyButton) {
            elements.generateComponentHierarchyButton.style.display = 'inline-block';
        }
        if (elements.viewComponentHierarchyButton) {
            elements.viewComponentHierarchyButton.style.display = 'none';
        }
    }
}
