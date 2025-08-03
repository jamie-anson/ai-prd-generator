// @ts-nocheck
/**
 * @file uiUtils.ts
 * @description Type-safe utilities for DOM element management and UI state updates.
 * 
 * The logic of this file is to:
 * 1. Provide type-safe DOM element retrieval with null checking
 * 2. Implement reusable UI update patterns with proper error handling
 * 3. Centralize button and section state management logic
 * 4. Ensure consistent UI behavior across all webview interactions
 * 5. Support comprehensive validation and error handling for UI operations
 */

import { UIElements, ProjectState, UISectionConfig, ButtonConfig, UIError, ElementTypeGuard } from './types';

// --- Type Guards ---

/**
 * Logic Step: Create type guard for HTMLButtonElement.
 * Ensures element exists and is the correct type before use.
 */
export const isButton: ElementTypeGuard<HTMLButtonElement> = (element): element is HTMLButtonElement => {
    return element !== null && element instanceof HTMLButtonElement;
};

/**
 * Logic Step: Create type guard for HTMLDivElement.
 * Ensures element exists and is the correct type before use.
 */
export const isDiv: ElementTypeGuard<HTMLDivElement> = (element): element is HTMLDivElement => {
    return element !== null && element instanceof HTMLDivElement;
};

/**
 * Logic Step: Create type guard for HTMLTextAreaElement.
 * Ensures element exists and is the correct type before use.
 */
export const isTextArea: ElementTypeGuard<HTMLTextAreaElement> = (element): element is HTMLTextAreaElement => {
    return element !== null && element instanceof HTMLTextAreaElement;
};

/**
 * Logic Step: Create type guard for HTMLInputElement.
 * Ensures element exists and is the correct type before use.
 */
export const isInput: ElementTypeGuard<HTMLInputElement> = (element): element is HTMLInputElement => {
    return element !== null && element instanceof HTMLInputElement;
};

/**
 * Logic Step: Create type guard for HTMLSpanElement.
 * Ensures element exists and is the correct type before use.
 */
export const isSpan: ElementTypeGuard<HTMLSpanElement> = (element): element is HTMLSpanElement => {
    return element !== null && element instanceof HTMLSpanElement;
};

// --- Safe Element Retrieval ---

/**
 * Logic Step: Safely retrieve and cast DOM element with type checking.
 * Returns null if element doesn't exist or is wrong type, preventing runtime errors.
 * @param id The element ID to retrieve
 * @param typeGuard Type guard function to validate element type
 * @returns Typed element or null if not found/wrong type
 */
export function safeGetElement<T extends HTMLElement>(
    id: string, 
    typeGuard: ElementTypeGuard<T>
): T | null {
    const element = document.getElementById(id);
    return typeGuard(element) ? element : null;
}

/**
 * Logic Step: Initialize all UI elements with type safety and error handling.
 * Returns a complete UIElements object with null-safe element references.
 * @returns UIElements object with all required DOM elements or null for missing ones
 */
export function initializeUIElements(): Partial<UIElements> {
    return {
        // PRD Generation Elements
        generatePrdButton: safeGetElement('generate-prd', isButton) || undefined,
        prdPrompt: safeGetElement('prd-prompt', isTextArea) || undefined,
        
        // Error and Status Display
        errorContainer: safeGetElement('error-container', isDiv) || undefined,
        
        // Control Sections
        generationControls: safeGetElement('generation-controls', isDiv) || undefined,
        postGenerationControls: safeGetElement('post-generation-controls', isDiv) || undefined,
        
        // View Action Buttons
        viewPrdButton: safeGetElement('view-prd', isButton) || undefined,
        viewGraphButton: safeGetElement('view-graph', isButton) || undefined,
        
        // Context Generation Buttons
        bulkGenerateContextCardsButton: safeGetElement('bulk-generate-context-cards', isButton) || undefined,
        generateContextTemplatesButton: safeGetElement('generate-context-templates', isButton) || undefined,
        
        // API Key Management
        apiKeyDisplay: safeGetElement('api-key-display', isDiv) || undefined,
        apiKeyInputContainer: safeGetElement('api-key-input-container', isDiv) || undefined,
        apiKeyObfuscated: safeGetElement('api-key-obfuscated', isSpan) || undefined,
        apiKeyInput: safeGetElement('api-key-input', isInput) || undefined,
        setApiKeyButton: safeGetElement('set-api-key', isButton) || undefined,
        changeApiKeyButton: safeGetElement('change-api-key', isButton) || undefined,
        
        // Diagram Generation and View Buttons
        generateDataFlowDiagramButton: safeGetElement('generate-data-flow-diagram', isButton) || undefined,
        viewDataFlowDiagramButton: safeGetElement('view-data-flow-diagram', isButton) || undefined,
        generateComponentHierarchyButton: safeGetElement('generate-component-hierarchy', isButton) || undefined,
        viewComponentHierarchyButton: safeGetElement('view-component-hierarchy', isButton) || undefined,
        
        // CCS (Code Comprehension Score) Elements
        generateCCSButton: safeGetElement('generate-ccs', isButton) || undefined,
        ccsResults: safeGetElement('ccs-results', isDiv) || undefined,
        
        // CCS Documentation & Testing Elements
        generateComprehensiveReadmeButton: safeGetElement('generate-comprehensive-readme', isButton) || undefined,
        generateCodebaseMapButton: safeGetElement('generate-codebase-map', isButton) || undefined,
        generateTestingFrameworkButton: safeGetElement('generate-testing-framework', isButton) || undefined,
        generateAiPromptingGuideButton: safeGetElement('generate-ai-prompting-guide', isButton) || undefined,
        generateAllCcsDocsButton: safeGetElement('generate-all-ccs-docs', isButton) || undefined,
        generateHandoverFileButton: safeGetElement('generate-handover-file', isButton) || undefined,
        handoverDocumentSection: safeGetElement('handover-document-section', isDiv) || undefined,
    };
}

// --- Button Management ---

/**
 * Logic Step: Update button state with type safety and null checking.
 * Safely updates button properties without throwing errors for missing elements.
 * @param button The button element to update (may be null/undefined)
 * @param config Configuration object with button properties
 */
export function updateButton(button: HTMLButtonElement | null | undefined, config: ButtonConfig): void {
    if (!button) {
        console.warn('Attempted to update null/undefined button');
        return;
    }
    
    button.textContent = config.text;
    button.disabled = !config.enabled;
    button.style.display = config.visible ? 'inline-block' : 'none';
    
    if (config.title) {
        button.title = config.title;
    }
}

/**
 * Logic Step: Update multiple buttons with consistent configuration.
 * Applies the same configuration to an array of buttons safely.
 * @param buttons Array of button elements (may contain null/undefined)
 * @param config Configuration to apply to all buttons
 */
export function updateButtons(buttons: Array<HTMLButtonElement | null | undefined>, config: ButtonConfig): void {
    buttons.forEach(button => updateButton(button, config));
}

// --- Section Management ---

/**
 * Logic Step: Update section visibility with type safety.
 * Safely shows/hides sections and updates associated buttons.
 * @param sectionId ID of the section element to update
 * @param config Configuration for section visibility and content
 */
export function updateSection(sectionId: string, config: UISectionConfig): void {
    const section = safeGetElement(sectionId, isDiv);
    if (!section) {
        console.warn(`Section with ID '${sectionId}' not found`);
        return;
    }
    
    if (config.visible) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
    
    // Update associated button if text/title overrides are provided
    if (config.buttonText || config.buttonTitle) {
        const buttons = section.querySelectorAll('button');
        buttons.forEach(button => {
            if (config.buttonText) {
                button.textContent = config.buttonText;
            }
            if (config.buttonTitle) {
                button.title = config.buttonTitle;
            }
        });
    }
}

// --- Error Display ---

/**
 * Logic Step: Display error message with type safety and proper styling.
 * Shows error in the designated container with appropriate styling for error type.
 * @param error Error information to display
 * @param errorContainer The container element for error display
 */
export function displayError(error: UIError, errorContainer: HTMLDivElement | null | undefined): void {
    if (!errorContainer) {
        console.error('Error container not available:', error.message);
        return;
    }
    
    errorContainer.textContent = error.message;
    errorContainer.style.display = 'block';
    
    // Apply error type styling
    errorContainer.className = `error-container error-${error.type}`;
    
    if (error.context) {
        errorContainer.title = error.context;
    }
}

/**
 * Logic Step: Clear error display safely.
 * Hides error container and clears its content.
 * @param errorContainer The container element for error display
 */
export function clearError(errorContainer: HTMLDivElement | null | undefined): void {
    if (!errorContainer) {
        return;
    }
    
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';
    errorContainer.className = 'error-container';
    errorContainer.title = '';
}

// --- State Validation ---

/**
 * Logic Step: Validate project state object structure.
 * Ensures project state has all required properties with correct types.
 * @param projectState Object to validate
 * @returns True if valid, false otherwise
 */
export function isValidProjectState(projectState: any): projectState is ProjectState {
    return projectState &&
           typeof projectState.hasPRD === 'boolean' &&
           Array.isArray(projectState.prdFiles) &&
           typeof projectState.prdCount === 'number' &&
           typeof projectState.hasContextCards === 'boolean' &&
           Array.isArray(projectState.contextCardFiles) &&
           typeof projectState.contextCardCount === 'number' &&
           typeof projectState.hasContextTemplates === 'boolean' &&
           Array.isArray(projectState.contextTemplateFiles) &&
           typeof projectState.contextTemplateCount === 'number' &&
           typeof projectState.hasDataFlowDiagram === 'boolean' &&
           Array.isArray(projectState.dataFlowDiagramFiles) &&
           typeof projectState.hasComponentHierarchy === 'boolean' &&
           Array.isArray(projectState.componentHierarchyFiles) &&
           typeof projectState.hasCCS === 'boolean' &&
           Array.isArray(projectState.ccsFiles) &&
           typeof projectState.ccsCount === 'number';
}

// --- Utility Functions ---

/**
 * Logic Step: Toggle element visibility with class-based approach.
 * Uses CSS classes for consistent visibility management.
 * @param element Element to toggle
 * @param visible Whether element should be visible
 */
export function toggleVisibility(element: HTMLElement | null | undefined, visible: boolean): void {
    if (!element) {
        return;
    }
    
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Logic Step: Safely set element text content.
 * Updates text content only if element exists.
 * @param element Element to update
 * @param text Text content to set
 */
export function safeSetText(element: HTMLElement | null | undefined, text: string): void {
    if (element) {
        element.textContent = text;
    }
}
