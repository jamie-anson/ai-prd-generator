/**
 * @file commands.ts
 * @description Defines the single source of truth for command names used in communication
 * between the webview and the extension backend. Using a centralized registry prevents
 * typos and ensures consistency.
 */

export const COMMANDS = {
    // Webview lifecycle
    WEBVIEW_READY: 'webviewReady',

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
};
