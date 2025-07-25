// @ts-nocheck
/**
 * @file commands.ts
 * @description Defines the single source of truth for command names used in communication
 * between the webview and the extension backend. Using a centralized registry prevents
 * typos and ensures consistency.
 * 
 * The logic of this file is to:
 * 1. Provide a centralized registry of all command names used in webview-extension communication.
 * 2. Prevent typos and ensure consistency across the codebase.
 * 3. Support both user-initiated commands and system messages (like project state updates).
 * 4. Group commands by functionality for better organization and maintainability.
 */

export const COMMANDS = {
    // Webview lifecycle
    WEBVIEW_READY: 'webviewReady',
    /** Logic Step: Command sent from extension to webview with detected project artifacts */
    PROJECT_STATE_UPDATE: 'project-state-update',

    // API Key management
    GET_API_KEY: 'get-api-key',
    SAVE_API_KEY: 'save-api-key',

    // Core PRD generation
    GENERATE_PRD: 'generate-prd',

    // Post-generation actions
    VIEW_PRD: 'view-prd',
    VIEW_GRAPH: 'view-graph',

    // Context Card and Template generation
    GENERATE_CONTEXT_CARDS: 'generate-context-cards',
    GENERATE_CONTEXT_TEMPLATES: 'generate-context-templates',

    // Diagram generation
    GENERATE_DATA_FLOW_DIAGRAM: 'generate-data-flow-diagram',
    GENERATE_COMPONENT_HIERARCHY: 'generate-component-hierarchy',

    // Diagram viewing
    VIEW_DATA_FLOW_DIAGRAM: 'view-data-flow-diagram',
    VIEW_COMPONENT_HIERARCHY: 'view-component-hierarchy',
};
