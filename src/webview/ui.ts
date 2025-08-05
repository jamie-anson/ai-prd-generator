/**
 * @file ui.ts
 * @description Type-safe UI management module for webview DOM manipulations and state updates.
 * 
 * The logic of this file is to:
 * 1. Provide type-safe access to all DOM elements with proper null checking
 * 2. Implement context-aware UI updates based on project state
 * 3. Ensure consistent error handling and user feedback
 * 4. Maintain separation between UI logic and business logic
 */

import { ProjectState, UIElements, UIError, ButtonConfig } from './types';
import { 
    initializeUIElements, 
    updateButton, 
    updateSection, 
    displayError, 
    clearError, 
    toggleVisibility, 
    safeSetText, 
    isValidProjectState 
} from './uiUtils';

// --- Type-Safe DOM Element Management ---

/**
 * Logic Step: Initialize UI elements with type safety and null checking.
 * Uses the type-safe initialization utility to prevent runtime errors.
 */
export let elements: UIElements;

let resolveUiReady: (value: UIElements) => void;
export const uiReady = new Promise<UIElements>(resolve => {
    resolveUiReady = resolve;
});

function initializeElementsWithRetry(attempt: number = 1): void {
    const initialized = initializeUIElements();
    const criticalElements = {
        generationControls: initialized.generationControls,
        postGenerationControls: initialized.postGenerationControls,
        generatePrdButton: initialized.generatePrdButton,
        apiKeyDisplay: initialized.apiKeyDisplay
    };
    
    const allCriticalElementsFound = Object.values(criticalElements).every(el => el !== null);

    if (allCriticalElementsFound) {
        console.log('[UI] All critical elements found. UI is ready.');
        elements = initialized as UIElements;
        resolveUiReady(elements);
    } else if (attempt < 10) { // Increased retry attempts
        console.log(`[UI] Critical elements not yet found, retrying in ${attempt * 50}ms...`);
        setTimeout(() => initializeElementsWithRetry(attempt + 1), attempt * 50);
    } else {
        console.error('[UI] Failed to initialize critical UI elements after multiple attempts.');
        // Optionally, reject the promise or display a permanent error message
    }
}

// Start the initialization process as soon as the DOM is interactive
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeElementsWithRetry());
} else {
    initializeElementsWithRetry();
}

// --- Type-Safe UI Update Functions ---

/**
 * Logic Step: Update API key display with type safety and proper error handling.
 * Uses type-safe utilities to manage element visibility and content updates.
 * @param hasApiKey Whether an API key is currently set
 */
export async function updateApiKeyDisplay(hasApiKey: boolean): Promise<void> {
    const elements = await uiReady;
    const { apiKeyDisplay, apiKeyInputContainer, apiKeyObfuscated } = elements;
    
    console.log('[UI] updateApiKeyDisplay called with hasApiKey:', hasApiKey);
    console.log('[UI] Elements found:', {
        apiKeyDisplay: !!apiKeyDisplay,
        apiKeyInputContainer: !!apiKeyInputContainer,
        apiKeyObfuscated: !!apiKeyObfuscated
    });
    
    if (hasApiKey) {
        console.log('[UI] Setting API key display to show obfuscated key');
        safeSetText(apiKeyObfuscated, 'sk-******************key-saved');
        toggleVisibility(apiKeyDisplay, true);
        toggleVisibility(apiKeyInputContainer, false);
    } else {
        console.log('[UI] Setting API key display to show input form');
        toggleVisibility(apiKeyDisplay, false);
        toggleVisibility(apiKeyInputContainer, true);
    }
}

/**
 * Logic Step: Show post-generation controls with type safety.
 * Transitions from generation input to post-generation action buttons.
 */
export async function showPostGenerationControls(): Promise<void> {
    const elements = await uiReady;
    console.log('[UI] showPostGenerationControls called');
    console.log('[UI] elements.generationControls:', elements.generationControls);
    console.log('[UI] elements.postGenerationControls:', elements.postGenerationControls);
    
    // Check if elements exist before trying to toggle them
    if (!elements.generationControls) {
        console.error('[UI] generationControls element not found!');
        // Try to find it directly
        const directElement = document.getElementById('generation-controls');
        console.log('[UI] Direct lookup of generation-controls:', directElement);
    }
    
    if (!elements.postGenerationControls) {
        console.error('[UI] postGenerationControls element not found!');
        // Try to find it directly
        const directElement = document.getElementById('post-generation-controls');
        console.log('[UI] Direct lookup of post-generation-controls:', directElement);
    }
    
    toggleVisibility(elements.generationControls, false);
    toggleVisibility(elements.postGenerationControls, true);
}

/**
 * Logic Step: Display error message with proper typing and error categorization.
 * Uses the type-safe error display utility for consistent error presentation.
 * @param errorMessage Error message to display
 * @param errorType Optional error type for styling (defaults to 'generation')
 */
export async function displayErrorMessage(errorMessage: string, errorType: UIError['type'] = 'generation'): Promise<void> {
    const elements = await uiReady;
    const error: UIError = {
        message: errorMessage,
        type: errorType
    };
    displayError(error, elements.errorContainer);
}

/**
 * Logic Step: Display info message to user.
 * Shows informational messages like progress updates during generation.
 * @param infoMessage Info message to display
 */
export async function displayInfoMessage(infoMessage: string): Promise<void> {
    const elements = await uiReady;
    if (elements.errorContainer) {
        elements.errorContainer.innerHTML = `<div class="info-message" style="color: #0078d4; background: #f3f9ff; border: 1px solid #0078d4; padding: 8px; border-radius: 4px; margin: 8px 0;">${infoMessage}</div>`;
        elements.errorContainer.style.display = 'block';
    }
}

/**
 * Logic Step: Display success message to user.
 * Shows success messages when operations complete successfully.
 * @param successMessage Success message to display
 */
export async function displaySuccessMessage(successMessage: string): Promise<void> {
    const elements = await uiReady;
    if (elements.errorContainer) {
        elements.errorContainer.innerHTML = `<div class="success-message" style="color: #107c10; background: #f3fff3; border: 1px solid #107c10; padding: 8px; border-radius: 4px; margin: 8px 0;">${successMessage}</div>`;
        elements.errorContainer.style.display = 'block';
    }
}

/**
 * Logic Step: Clear any displayed error messages.
 * Hides error container and clears its content safely.
 */
export async function clearErrorMessage(): Promise<void> {
    const elements = await uiReady;
    clearError(elements.errorContainer);
}

/**
 * Logic Step: Update the UI sections based on the current project state with full type safety.
 * This function implements the core context-aware UI logic by showing/hiding sections
 * based on detected artifacts in the project. The logic ensures users only see relevant
 * options for their current workflow stage.
 * @param projectState Typed object containing project artifact detection results
 */
export async function updateUIBasedOnProjectState(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    // Logic Step: Validate project state structure before processing
    if (!isValidProjectState(projectState)) {
        console.error('Invalid project state received:', projectState);
        displayErrorMessage('Invalid project state data received', 'validation');
        return;
    }
    
    // Logic Step: Clear any existing error messages
    clearErrorMessage();
    
    // Logic Step: Determine if any artifacts exist to control main UI flow
    const hasAnyArtifacts = projectState.hasPRD || projectState.hasContextCards || projectState.hasContextTemplates;
    
    console.log('[UI] Project state received:', {
        hasPRD: projectState.hasPRD,
        hasContextCards: projectState.hasContextCards,
        hasContextTemplates: projectState.hasContextTemplates,
        hasAnyArtifacts,
        prdCount: projectState.prdCount
    });
    
    if (hasAnyArtifacts) {
        console.log('[UI] Showing post-generation controls (artifacts detected)');
        showPostGenerationControls();
    } else {
        console.log('[UI] Showing generation controls (no artifacts detected)');
        // Show PRD generation controls only if no artifacts exist
        toggleVisibility(elements.generationControls, true);
        toggleVisibility(elements.postGenerationControls, false);
    }

    // Logic Step: Update individual sections based on project state
    updateContextTemplatesSection(projectState);
    updateContextCardsSection(projectState);
    updateDiagramSection(projectState);
    updateCCSSection(projectState);
    updateHandoverSection(projectState);
}

/**
 * Logic Step: Update the Code Templates section visibility and button text with type safety.
 * Shows the section only if a PRD exists (required to generate templates).
 * Updates button text to indicate regeneration if templates already exist.
 * @param projectState Typed object containing project artifact detection results
 */
async function updateContextTemplatesSection(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    if (projectState.hasPRD) {
        const buttonConfig: ButtonConfig = {
            text: projectState.hasContextTemplates ? 'Regenerate Code Templates' : 'Generate Code Templates',
            title: projectState.hasContextTemplates ? 'Context templates already exist. Click to regenerate them.' : 'Generate context templates from PRD',
            enabled: true,
            visible: true
        };
        
        updateButton(elements.generateContextTemplatesButton, buttonConfig);
        updateSection('context-templates-container', {
            sectionId: 'context-templates-container',
            visible: true
        });
    } else {
        updateSection('context-templates-container', {
            sectionId: 'context-templates-container',
            visible: false
        });
    }
}

/**
 * Logic Step: Update the Development Guidelines section visibility and button text with type safety.
 * Shows the section only if a PRD exists (required to generate context cards).
 * Updates button text to indicate regeneration if context cards already exist.
 * @param projectState Typed object containing project artifact detection results
 */
async function updateContextCardsSection(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    if (projectState.hasPRD) {
        const buttonConfig: ButtonConfig = {
            text: projectState.hasContextCards ? 'Regenerate Development Guidelines' : 'Generate Development Guidelines',
            title: projectState.hasContextCards ? 'Context cards already exist. Click to regenerate them.' : 'Generate context cards from PRD',
            enabled: true,
            visible: true
        };
        
        updateButton(elements.bulkGenerateContextCardsButton, buttonConfig);
        updateSection('context-cards-container', {
            sectionId: 'context-cards-container',
            visible: true
        });
    } else {
        updateSection('context-cards-container', {
            sectionId: 'context-cards-container',
            visible: false
        });
    }
}

/**
 * Logic Step: Update the diagram buttons section visibility and button types with type safety.
 * Shows generate buttons if PRD exists but diagrams don't, or view buttons if diagrams exist.
 * @param projectState Typed object containing project artifact detection results
 */
async function updateDiagramSection(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    // Logic Step: Only show diagram options if PRD exists
    if (!projectState.hasPRD) {
        // Hide all diagram buttons if no PRD
        const hiddenConfig: ButtonConfig = {
            text: '',
            enabled: false,
            visible: false
        };
        
        updateButton(elements.generateDataFlowDiagramButton, hiddenConfig);
        updateButton(elements.generateComponentHierarchyButton, hiddenConfig);
        updateButton(elements.viewDataFlowDiagramButton, hiddenConfig);
        updateButton(elements.viewComponentHierarchyButton, hiddenConfig);
        return;
    }

    // Logic Step: Handle Data Flow Diagram buttons
    if (projectState.hasDataFlowDiagram) {
        updateButton(elements.generateDataFlowDiagramButton, {
            text: 'Generate Data Flow Diagram',
            enabled: false,
            visible: false
        });
        updateButton(elements.viewDataFlowDiagramButton, {
            text: 'View Data Flow Diagram',
            title: 'Open the generated data flow diagram',
            enabled: true,
            visible: true
        });
    } else {
        updateButton(elements.generateDataFlowDiagramButton, {
            text: 'Generate Data Flow Diagram',
            title: 'Create a data flow diagram from PRD',
            enabled: true,
            visible: true
        });
        updateButton(elements.viewDataFlowDiagramButton, {
            text: 'View Data Flow Diagram',
            enabled: false,
            visible: false
        });
    }

    // Logic Step: Handle Component Hierarchy buttons
    if (projectState.hasComponentHierarchy) {
        updateButton(elements.generateComponentHierarchyButton, {
            text: 'Generate Component Hierarchy',
            enabled: false,
            visible: false
        });
        updateButton(elements.viewComponentHierarchyButton, {
            text: 'View Component Hierarchy',
            title: 'Open the generated component hierarchy diagram',
            enabled: true,
            visible: true
        });
    } else {
        updateButton(elements.generateComponentHierarchyButton, {
            text: 'Generate Component Hierarchy',
            title: 'Create a component hierarchy diagram from PRD',
            enabled: true,
            visible: true
        });
        updateButton(elements.viewComponentHierarchyButton, {
            text: 'View Component Hierarchy',
            enabled: false,
            visible: false
        });
    }
}

/**
 * Logic Step: Update the CCS section visibility and button text with type safety.
 * Shows the section only if a codebase exists (always true for workspace projects).
 * Updates button text to indicate regeneration if CCS analysis already exists.
 * @param projectState Typed object containing project artifact detection results
 */
async function updateHandoverSection(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    const isEnabled = projectState.hasCCS;
    updateSection('document-section', {
        sectionId: 'document-section',
        visible: projectState.hasPRD // Handover should be enabled if PRD exists
    });

    const buttonConfig: ButtonConfig = {
        text: projectState.hasHandover ? 'Regenerate Handover Document' : 'Generate Handover Document',
        title: isEnabled 
            ? (projectState.hasHandover ? 'Regenerate the handover document from the latest CCS analysis' : 'Generate a handover document from the CCS analysis')
            : 'Generate a CCS score first to enable handover document generation',
        enabled: isEnabled,
        visible: true
    };
    updateButton(elements.generateHandoverFileButton, buttonConfig);
}

async function updateCCSSection(projectState: ProjectState): Promise<void> {
    const elements = await uiReady;
    const buttonConfig: ButtonConfig = {
        text: projectState.hasCCS ? 'Regenerate CCS Score' : 'Generate CCS Score',
        title: projectState.hasCCS ? 'CCS analysis already exists. Click to regenerate it.' : 'Analyze codebase comprehension score',
        enabled: true,
        visible: true
    };
    
    updateButton(elements.generateCCSButton, buttonConfig);
    updateSection('test-section', {
        sectionId: 'test-section',
        visible: projectState.hasPRD // CCS analysis should be enabled if PRD exists
    });
}

/**
 * Logic Step: Display CCS analysis results in the UI with proper formatting.
 * Updates the CCS results container with the analysis content and converts markdown to HTML.
 * @param analysis The CCS analysis text to display
 */
export async function displayCCSResults(analysis: string): Promise<void> {
    const elements = await uiReady;
    const resultsContainer = elements.ccsResults;
    if (resultsContainer) {
        // Convert markdown-style formatting to HTML for better display
        const formattedAnalysis = analysis
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.)/gm, '<p>$1')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h([123])><\/p>/g, '</h$1>')
            .replace(/<p><\/p>/g, '')
            + '</p>';
        
        resultsContainer.innerHTML = formattedAnalysis;
        toggleVisibility(resultsContainer, true);
    }
}
