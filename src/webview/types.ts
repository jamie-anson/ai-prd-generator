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

    /** Whether a handover document exists in the workspace */
    hasHandover: boolean;
    /** Array of URIs pointing to detected handover documents */
    handoverFiles: Array<{ fsPath: string }>;
    /** Number of handover documents found */
    handoverCount: number;
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
    generateHandoverFileButton: HTMLButtonElement;
    handoverDocumentSection: HTMLDivElement;
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

// --- PHASE 3: Enhanced State Management Types ---

/**
 * Webview state that persists across sessions using vscode.getState/setState.
 * PHASE 3: Community-proven state persistence pattern.
 */
export interface WebviewState {
    /** Last message processed by webview */
    lastMessage?: string;
    /** Timestamp of last state update */
    timestamp?: number;
    /** Previous project state for comparison */
    previousProjectState?: ProjectState;
    /** UI preferences and settings */
    uiPreferences?: {
        expandedSections?: string[];
        lastActiveTab?: string;
    };
    /** Communication metrics for debugging */
    communicationMetrics?: {
        messagesReceived?: number;
        lastSuccessfulUpdate?: number;
        errorCount?: number;
    };
}

/**
 * Enhanced message format for webview-ready signal.
 * PHASE 2: Message-based initialization pattern.
 */
export interface WebviewReadyMessage {
    /** Message type identifier */
    type: 'webview-ready';
    /** Timestamp when webview became ready */
    timestamp: number;
    /** Any previous state restored from VS Code */
    previousState?: WebviewState | null;
}

// --- Message Types ---

/**
 * Base interface for all messages passed between webview and extension.
 */
export interface BaseMessage {
    /** The command/action type for this message */
    command: string;
    /** Optional timestamp for latency tracking */
    timestamp?: number;
    /** Optional source identifier for debugging */
    source?: string;
}

/**
 * Enhanced message sent from extension to webview with project state updates.
 * PHASE 3: Includes timing and source information for debugging.
 */
export interface ProjectStateUpdateMessage extends BaseMessage {
    command: 'updateState';
    /** Current project state data */
    projectState: ProjectState;
    /** Timestamp when state was detected */
    timestamp?: number;
    /** Source of the state update */
    source?: string;
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
 * PHASE 3: Enhanced message types for improved communication.
 */
export interface InfoMessage extends BaseMessage {
    command: 'info';
    text: string;
}

export interface SuccessMessage extends BaseMessage {
    command: 'success';
    text: string;
}

export interface ErrorMessage extends BaseMessage {
    command: 'error';
    text: string;
}

export interface CCSGeneratedMessage extends BaseMessage {
    command: 'ccsGenerated';
    analysis: string;
}

/**
 * Union type for all possible messages sent from extension to webview.
 * PHASE 3: Expanded to include all message types used in the application.
 */
export type ExtensionToWebviewMessage = 
    | ProjectStateUpdateMessage 
    | ApiKeyStatusMessage 
    | InfoMessage 
    | SuccessMessage 
    | ErrorMessage 
    | CCSGeneratedMessage;

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
