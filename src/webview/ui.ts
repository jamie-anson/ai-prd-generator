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
export const elements: Partial<UIElements> = initializeUIElements();

// --- Type-Safe UI Update Functions ---

/**
 * Logic Step: Update API key display with type safety and proper error handling.
 * Uses type-safe utilities to manage element visibility and content updates.
 * @param hasApiKey Whether an API key is currently set
 */
export function updateApiKeyDisplay(hasApiKey: boolean): void {
    const { apiKeyDisplay, apiKeyInputContainer, apiKeyObfuscated } = elements;
    
    if (hasApiKey) {
        safeSetText(apiKeyObfuscated, 'sk-******************key-saved');
        toggleVisibility(apiKeyDisplay, true);
        toggleVisibility(apiKeyInputContainer, false);
    } else {
        toggleVisibility(apiKeyDisplay, false);
        toggleVisibility(apiKeyInputContainer, true);
    }
}

/**
 * Logic Step: Show post-generation controls with type safety.
 * Transitions from generation input to post-generation action buttons.
 */
export function showPostGenerationControls(): void {
    toggleVisibility(elements.generationControls, false);
    toggleVisibility(elements.postGenerationControls, true);
}

/**
 * Logic Step: Display error message with proper typing and error categorization.
 * Uses the type-safe error display utility for consistent error presentation.
 * @param errorMessage Error message to display
 * @param errorType Optional error type for styling (defaults to 'generation')
 */
export function displayErrorMessage(errorMessage: string, errorType: UIError['type'] = 'generation'): void {
    const error: UIError = {
        message: errorMessage,
        type: errorType
    };
    displayError(error, elements.errorContainer);
}

/**
 * Logic Step: Clear any displayed error messages.
 * Hides error container and clears its content safely.
 */
export function clearErrorMessage(): void {
    clearError(elements.errorContainer);
}

/**
 * Logic Step: Update the UI sections based on the current project state with full type safety.
 * This function implements the core context-aware UI logic by showing/hiding sections
 * based on detected artifacts in the project. The logic ensures users only see relevant
 * options for their current workflow stage.
 * @param projectState Typed object containing project artifact detection results
 */
export function updateUIBasedOnProjectState(projectState: ProjectState): void {
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
    
    if (hasAnyArtifacts) {
        showPostGenerationControls();
    } else {
        // Show PRD generation controls only if no artifacts exist
        toggleVisibility(elements.generationControls, true);
        toggleVisibility(elements.postGenerationControls, false);
    }

    // Logic Step: Update individual sections based on project state
    updateContextTemplatesSection(projectState);
    updateContextCardsSection(projectState);
    updateDiagramSection(projectState);
    updateCCSSection(projectState);
}

/**
 * Logic Step: Update the Context Templates section visibility and button text with type safety.
 * Shows the section only if a PRD exists (required to generate templates).
 * Updates button text to indicate regeneration if templates already exist.
 * @param projectState Typed object containing project artifact detection results
 */
function updateContextTemplatesSection(projectState: ProjectState): void {
    if (projectState.hasPRD) {
        const buttonConfig: ButtonConfig = {
            text: projectState.hasContextTemplates ? 'Regenerate Context Templates' : 'Generate Context Templates',
            title: projectState.hasContextTemplates ? 'Context templates already exist. Click to regenerate them.' : 'Generate context templates from PRD',
            enabled: true,
            visible: true
        };
        
        updateButton(elements.generateContextTemplatesButton, buttonConfig);
        updateSection('context-templates-section', {
            sectionId: 'context-templates-section',
            visible: true
        });
    } else {
        updateSection('context-templates-section', {
            sectionId: 'context-templates-section',
            visible: false
        });
    }
}

/**
 * Logic Step: Update the Context Cards section visibility and button text with type safety.
 * Shows the section only if a PRD exists (required to generate context cards).
 * Updates button text to indicate regeneration if context cards already exist.
 * @param projectState Typed object containing project artifact detection results
 */
function updateContextCardsSection(projectState: ProjectState): void {
    if (projectState.hasPRD) {
        const buttonConfig: ButtonConfig = {
            text: projectState.hasContextCards ? 'Regenerate Context Cards' : 'Bulk Generate Context Cards',
            title: projectState.hasContextCards ? 'Context cards already exist. Click to regenerate them.' : 'Generate context cards from PRD',
            enabled: true,
            visible: true
        };
        
        updateButton(elements.bulkGenerateContextCardsButton, buttonConfig);
        updateSection('context-cards-section', {
            sectionId: 'context-cards-section',
            visible: true
        });
    } else {
        updateSection('context-cards-section', {
            sectionId: 'context-cards-section',
            visible: false
        });
    }
}

/**
 * Logic Step: Update the diagram buttons section visibility and button types with type safety.
 * Shows generate buttons if PRD exists but diagrams don't, or view buttons if diagrams exist.
 * @param projectState Typed object containing project artifact detection results
 */
function updateDiagramSection(projectState: ProjectState): void {
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
function updateCCSSection(projectState: ProjectState): void {
    const buttonConfig: ButtonConfig = {
        text: projectState.hasCCS ? 'Regenerate CCS Score' : 'Generate CCS Score',
        title: projectState.hasCCS ? 'CCS analysis already exists. Click to regenerate it.' : 'Analyze codebase comprehension score',
        enabled: true,
        visible: true
    };
    
    updateButton(elements.generateCCSButton, buttonConfig);
    updateSection('ccs-section', {
        sectionId: 'ccs-section',
        visible: true
    });
}

/**
 * Logic Step: Display CCS analysis results in the UI with proper formatting.
 * Updates the CCS results container with the analysis content and converts markdown to HTML.
 * @param analysis The CCS analysis text to display
 */
export function displayCCSResults(analysis: string): void {
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
