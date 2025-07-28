/**
 * @ts-nocheck
 * DOM Fixtures for Webview Testing
 * 
 * Logic: Provides centralized HTML fixtures and DOM setup utilities
 * for consistent webview testing across all test files.
 */

import { JSDOM } from 'jsdom';

/**
 * Standard webview HTML fixture with all common UI elements
 */
export const WEBVIEW_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-test-nonce' 'unsafe-inline'; style-src 'nonce-test-nonce' 'unsafe-inline'; img-src https: data:; font-src 'self';">
    <title>AI PRD Generator</title>
    <style nonce="test-nonce">
        .hidden { display: none !important; }
        .visible { display: block !important; }
        .error { color: red; }
        .success { color: green; }
        .button-group { display: flex; gap: 10px; }
        .controls-section { margin: 20px 0; }
    </style>
</head>
<body>
    <!-- API Key Management Section -->
    <div id="api-key-section">
        <!-- API Key Display (shown when key is set) -->
        <div id="api-key-display" class="hidden">
            <span id="api-key-obfuscated">sk-******************key-saved</span>
            <button id="change-api-key">Change</button>
        </div>
        
        <!-- API Key Input (shown when key is not set) -->
        <div id="api-key-input-container">
            <input type="text" id="api-key-input" placeholder="Enter your OpenAI API Key..." size="50">
            <button id="set-api-key">Set API Key</button>
        </div>
    </div>

    <!-- PRD Generation Section -->
    <div id="prd-section">
        <!-- Generation Controls (shown when no PRDs exist) -->
        <div id="generation-controls">
            <h2>Generate PRD</h2>
            <textarea id="prd-prompt" placeholder="Enter your product requirements here..." rows="5" cols="50"></textarea>
            <button id="generate-prd">Generate PRD</button>
        </div>

        <!-- Post Generation Controls (shown when PRDs exist) -->
        <div id="post-generation-controls" class="hidden">
            <div class="controls-section">
                <h2>View Outputs</h2>
                <div class="button-group">
                    <button id="view-prd">View PRD</button>
                    <button id="view-graph">View Graph</button>
                    <button id="regenerate-prd">Regenerate PRD</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Context Cards Section -->
    <div id="context-cards-section" class="hidden">
        <h2>Context Cards</h2>
        <div class="button-group">
            <button id="generate-context-cards">Generate Context Cards</button>
            <button id="view-context-cards">View Context Cards</button>
        </div>
    </div>

    <!-- Context Templates Section -->
    <div id="context-templates-section" class="hidden">
        <h2>Context Templates</h2>
        <div class="button-group">
            <button id="generate-context-templates">Generate Context Templates</button>
            <button id="view-context-templates">View Context Templates</button>
        </div>
    </div>

    <!-- CCS Documentation Section -->
    <div id="ccs-section" class="hidden">
        <h2>Code Comprehension Score</h2>
        <div class="button-group">
            <button id="generate-ccs">Generate CCS Analysis</button>
            <button id="generate-ccs-docs">Generate CCS Documentation</button>
        </div>
    </div>

    <!-- Error Display -->
    <div id="error-container" class="hidden">
        <div id="error-message"></div>
        <button id="clear-error">Clear</button>
    </div>

    <!-- Success Display -->
    <div id="success-container" class="hidden">
        <div id="success-message"></div>
    </div>

    <!-- Progress Display -->
    <div id="progress-container" class="hidden">
        <div id="progress-message">Processing...</div>
        <div id="progress-bar">
            <div id="progress-fill" style="width: 0%; height: 20px; background: #007acc;"></div>
        </div>
    </div>

    <!-- Script loading with error handling -->
    <script nonce="test-nonce" src="main.js" onerror="console.error('Failed to load script')"></script>
    
    <!-- Inline error monitoring script -->
    <script nonce="test-nonce">
        window.addEventListener('error', function(e) {
            console.error('Runtime error:', e.error);
        });
    </script>
</body>
</html>
`;

/**
 * Minimal HTML fixture for basic DOM testing
 */
export const MINIMAL_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div id="test-element">Test Content</div>
    <button id="test-button">Test Button</button>
</body>
</html>
`;

/**
 * CSP-focused HTML fixture for security testing
 */
export const CSP_TEST_HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-{{NONCE}}' 'unsafe-inline'; style-src 'nonce-{{NONCE}}' 'unsafe-inline'; img-src https: data:; font-src 'self';">
    <style nonce="{{NONCE}}">
        body { font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    <div id="content">CSP Test Content</div>
    <script nonce="{{NONCE}}" src="{{SCRIPT_URI}}" onerror="console.error('Failed to load script')"></script>
    <script nonce="{{NONCE}}">
        window.addEventListener('error', function(e) {
            console.error('Runtime error:', e.error);
        });
    </script>
</body>
</html>
`;

/**
 * DOM Fixture Factory for creating configured JSDOM instances
 */
export class DOMFixtureFactory {
    /**
     * Logic Step: Create a standard webview DOM environment
     * @param options Configuration options for the DOM
     * @returns Configured JSDOM instance with document
     */
    public static createWebviewDOM(options: {
        url?: string;
        pretendToBeVisual?: boolean;
        resources?: string;
        customHTML?: string;
    } = {}): { dom: JSDOM; document: Document } {
        const dom = new JSDOM(options.customHTML || WEBVIEW_HTML_FIXTURE, {
            url: options.url || 'https://localhost',
            pretendToBeVisual: options.pretendToBeVisual !== false,
            resources: options.resources || 'usable'
        });

        return {
            dom,
            document: dom.window.document
        };
    }

    /**
     * Logic Step: Create a minimal DOM for basic testing
     * @returns Simple JSDOM instance
     */
    public static createMinimalDOM(): { dom: JSDOM; document: Document } {
        const dom = new JSDOM(MINIMAL_HTML_FIXTURE, {
            url: 'https://localhost'
        });

        return {
            dom,
            document: dom.window.document
        };
    }

    /**
     * Logic Step: Create CSP-focused DOM with nonce replacement
     * @param nonce The nonce value to inject
     * @param scriptUri The script URI to inject
     * @returns CSP-configured JSDOM instance
     */
    public static createCSPTestDOM(nonce: string, scriptUri: string): { dom: JSDOM; document: Document } {
        const html = CSP_TEST_HTML_FIXTURE
            .replace(/\{\{NONCE\}\}/g, nonce)
            .replace(/\{\{SCRIPT_URI\}\}/g, scriptUri);

        const dom = new JSDOM(html, {
            url: 'https://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        return {
            dom,
            document: dom.window.document
        };
    }

    /**
     * Logic Step: Create DOM with custom project state UI
     * @param projectState The project state to reflect in UI
     * @returns DOM configured for specific project state
     */
    public static createProjectStateDOM(projectState: {
        hasApiKey?: boolean;
        hasPRD?: boolean;
        hasContextCards?: boolean;
        hasContextTemplates?: boolean;
        hasCCS?: boolean;
    }): { dom: JSDOM; document: Document } {
        const { dom, document } = this.createWebviewDOM();

        // Apply project state to DOM
        if (projectState.hasApiKey) {
            document.getElementById('api-key-display')?.classList.remove('hidden');
            document.getElementById('api-key-input-container')?.classList.add('hidden');
        }

        if (projectState.hasPRD) {
            document.getElementById('generation-controls')?.classList.add('hidden');
            document.getElementById('post-generation-controls')?.classList.remove('hidden');
            document.getElementById('context-cards-section')?.classList.remove('hidden');
            document.getElementById('context-templates-section')?.classList.remove('hidden');
        }

        if (projectState.hasContextCards) {
            const generateBtn = document.getElementById('generate-context-cards');
            if (generateBtn) generateBtn.textContent = 'Regenerate Context Cards';
        }

        if (projectState.hasContextTemplates) {
            const generateBtn = document.getElementById('generate-context-templates');
            if (generateBtn) generateBtn.textContent = 'Regenerate Context Templates';
        }

        if (projectState.hasCCS) {
            document.getElementById('ccs-section')?.classList.remove('hidden');
        }

        return { dom, document };
    }
}

/**
 * DOM Element Selectors for consistent element access
 */
export const DOM_SELECTORS = {
    // API Key elements
    API_KEY_DISPLAY: '#api-key-display',
    API_KEY_INPUT_CONTAINER: '#api-key-input-container',
    API_KEY_INPUT: '#api-key-input',
    API_KEY_OBFUSCATED: '#api-key-obfuscated',
    SET_API_KEY_BTN: '#set-api-key',
    CHANGE_API_KEY_BTN: '#change-api-key',

    // PRD elements
    GENERATION_CONTROLS: '#generation-controls',
    POST_GENERATION_CONTROLS: '#post-generation-controls',
    PRD_PROMPT: '#prd-prompt',
    GENERATE_PRD_BTN: '#generate-prd',
    VIEW_PRD_BTN: '#view-prd',
    VIEW_GRAPH_BTN: '#view-graph',
    REGENERATE_PRD_BTN: '#regenerate-prd',

    // Context elements
    CONTEXT_CARDS_SECTION: '#context-cards-section',
    CONTEXT_TEMPLATES_SECTION: '#context-templates-section',
    GENERATE_CONTEXT_CARDS_BTN: '#generate-context-cards',
    GENERATE_CONTEXT_TEMPLATES_BTN: '#generate-context-templates',

    // CCS elements
    CCS_SECTION: '#ccs-section',
    GENERATE_CCS_BTN: '#generate-ccs',
    GENERATE_CCS_DOCS_BTN: '#generate-ccs-docs',

    // Feedback elements
    ERROR_CONTAINER: '#error-container',
    ERROR_MESSAGE: '#error-message',
    SUCCESS_CONTAINER: '#success-container',
    SUCCESS_MESSAGE: '#success-message',
    PROGRESS_CONTAINER: '#progress-container',
    PROGRESS_MESSAGE: '#progress-message',
    PROGRESS_FILL: '#progress-fill'
} as const;

/**
 * CSS Classes for consistent styling
 */
export const CSS_CLASSES = {
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    ERROR: 'error',
    SUCCESS: 'success',
    BUTTON_GROUP: 'button-group',
    CONTROLS_SECTION: 'controls-section'
} as const;
