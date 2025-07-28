// @ts-nocheck
/**
 * @file types.ts
 * @description Comprehensive type definitions for webview UI components, project state, and message passing.
 * 
 * The logic of this file is to:
 * 1. Define strict TypeScript interfaces for all UI-related data structures
 * 2. Provide type safety for project state detection and UI updates
 * 3. Ensure type-safe message passing between webview and extension
 * 4. Support maintainable and extensible UI code with proper typing
 * 5. Enable consistent error handling and validation across UI components
 */

// --- Project State Types ---

/**
 * Represents the current state of project artifacts detected in the workspace.
 * Used by ProjectStateDetector and UI update functions for context-aware behavior.
 */
export interface ProjectState {
    /** Whether any PRD files exist in the workspace */
    hasPRD: boolean;
    /** Array of URIs pointing to detected PRD files */
    prdFiles: Array<{ fsPath: string }>;
    /** Number of PRD files found */
    prdCount: number;
    
    /** Whether context cards exist in the workspace */
    hasContextCards: boolean;
    /** Array of URIs pointing to detected context card files */
    contextCardFiles: Array<{ fsPath: string }>;
    /** Number of context card files found */
    contextCardCount: number;
    
    /** Whether context templates exist in the workspace */
    hasContextTemplates: boolean;
    /** Array of URIs pointing to detected context template files */
    contextTemplateFiles: Array<{ fsPath: string }>;
    /** Number of context template files found */
    contextTemplateCount: number;
    
    /** Whether data flow diagrams exist in the workspace */
    hasDataFlowDiagram: boolean;
    /** Array of URIs pointing to detected data flow diagram files */
    dataFlowDiagramFiles: Array<{ fsPath: string }>;
    
    /** Whether component hierarchy diagrams exist in the workspace */
    hasComponentHierarchy: boolean;
    /** Array of URIs pointing to detected component hierarchy files */
    componentHierarchyFiles: Array<{ fsPath: string }>;
    
    /** Whether CCS (Code Comprehension Score) analysis exists in the workspace */
    hasCCS: boolean;
    /** Array of URIs pointing to detected CCS analysis files */
    ccsFiles: Array<{ fsPath: string }>;
    /** Number of CCS analysis files found */
    ccsCount: number;
}

// --- UI Element Types ---

/**
 * Type-safe references to all DOM elements used in the webview.
 * Ensures null safety and proper element type casting.
 */
export interface UIElements {
    // PRD Generation Elements
    generatePrdButton: HTMLButtonElement;
    prdPrompt: HTMLTextAreaElement;
    
    // Error and Status Display
    errorContainer: HTMLDivElement;
    
    // Control Sections
    generationControls: HTMLDivElement;
    postGenerationControls: HTMLDivElement;
    
    // View Action Buttons
    viewPrdButton: HTMLButtonElement;
    viewGraphButton: HTMLButtonElement;
    
    // Context Generation Buttons
    bulkGenerateContextCardsButton: HTMLButtonElement;
    generateContextTemplatesButton: HTMLButtonElement;
    
    // API Key Management
    apiKeyDisplay: HTMLDivElement;
    apiKeyInputContainer: HTMLDivElement;
    apiKeyObfuscated: HTMLSpanElement;
    apiKeyInput: HTMLInputElement;
    setApiKeyButton: HTMLButtonElement;
    changeApiKeyButton: HTMLButtonElement;
    
    // Diagram Generation and View Buttons
    generateDataFlowDiagramButton: HTMLButtonElement;
    viewDataFlowDiagramButton: HTMLButtonElement;
    generateComponentHierarchyButton: HTMLButtonElement;
    viewComponentHierarchyButton: HTMLButtonElement;
    
    // CCS (Code Comprehension Score) Elements
    generateCCSButton: HTMLButtonElement;
    ccsResults: HTMLDivElement;
    
    // CCS Documentation & Testing Elements
    generateComprehensiveReadmeButton: HTMLButtonElement;
    generateCodebaseMapButton: HTMLButtonElement;
    generateTestingFrameworkButton: HTMLButtonElement;
    generateAiPromptingGuideButton: HTMLButtonElement;
    generateAllCcsDocsButton: HTMLButtonElement;
}

/**
 * Configuration for UI section visibility and behavior.
 * Used to control which sections are shown based on project state.
 */
export interface UISectionConfig {
    /** ID of the section element */
    sectionId: string;
    /** Whether the section should be visible */
    visible: boolean;
    /** Optional button text override */
    buttonText?: string;
    /** Optional button title/tooltip override */
    buttonTitle?: string;
}

// --- Message Types ---

/**
 * Base interface for all messages passed between webview and extension.
 */
export interface BaseMessage {
    /** The command/action type for this message */
    command: string;
}

/**
 * Message sent from extension to webview with project state updates.
 */
export interface ProjectStateUpdateMessage extends BaseMessage {
    command: 'project-state-update';
    /** Current project state data */
    projectState: ProjectState;
}

/**
 * Message sent from extension to webview with API key status.
 */
export interface ApiKeyStatusMessage extends BaseMessage {
    command: 'api-key-status';
    /** Whether an API key is currently set */
    hasApiKey: boolean;
}

/**
 * Message sent from webview to extension to set API key.
 */
export interface SetApiKeyMessage extends BaseMessage {
    command: 'set-api-key';
    /** The API key value to set */
    apiKey: string;
}

/**
 * Message sent from webview to extension for generation commands.
 */
export interface GenerationMessage extends BaseMessage {
    command: 'generate-prd' | 'generate-context-templates' | 'bulk-generate-context-cards' | 
             'generate-data-flow-diagram' | 'generate-component-hierarchy' | 'generate-ccs';
    /** Optional prompt text for PRD generation */
    prompt?: string;
}

/**
 * Message sent from webview to extension for view commands.
 */
export interface ViewMessage extends BaseMessage {
    command: 'view-prd' | 'view-graph' | 'view-data-flow-diagram' | 'view-component-hierarchy';
}

/**
 * Union type for all possible messages sent from webview to extension.
 */
export type WebviewToExtensionMessage = SetApiKeyMessage | GenerationMessage | ViewMessage;

/**
 * Union type for all possible messages sent from extension to webview.
 */
export type ExtensionToWebviewMessage = ProjectStateUpdateMessage | ApiKeyStatusMessage;

// --- UI Update Function Types ---

/**
 * Function type for updating UI sections based on project state.
 */
export type UIUpdateFunction = (projectState: ProjectState) => void;

/**
 * Function type for handling DOM element visibility and content updates.
 */
export type ElementUpdateFunction = (element: HTMLElement, config: UISectionConfig) => void;

// --- Error Types ---

/**
 * Structured error information for UI display.
 */
export interface UIError {
    /** Error message to display to user */
    message: string;
    /** Error type/category for styling */
    type: 'generation' | 'api' | 'file' | 'validation';
    /** Optional additional context */
    context?: string;
}

// --- Utility Types ---

/**
 * Type guard to check if an element exists and is of the expected type.
 */
export type ElementTypeGuard<T extends HTMLElement> = (element: HTMLElement | null) => element is T;

/**
 * Configuration for button state management.
 */
export interface ButtonConfig {
    /** Button text content */
    text: string;
    /** Button title/tooltip */
    title?: string;
    /** Whether button is enabled */
    enabled: boolean;
    /** Whether button is visible */
    visible: boolean;
}
