// @ts-nocheck
/**
 * @file mainView.ts
 * @description This file defines the HTML content and styling for the main webview panel of the AI PRD Generator.
 * 
 * The logic of this file is to:
 * 1.  Define the complete HTML structure for the webview panel.
 * 2.  Provide the necessary CSS for laying out and styling the UI elements.
 * 3.  Ensure a secure environment by generating and using a nonce for the Content Security Policy (CSP).
 */
import * as vscode from 'vscode';

/**
 * Logic Step: Generate the full HTML content for the webview.
 * This function returns a string containing the complete HTML document, including CSS and a script tag.
 * @param scriptContent The string content of the main.js script to be injected.
 * @param webview The webview panel instance.
 * @returns A string of the complete HTML for the webview.
 */
export function getWebviewContent(scriptUri: vscode.Uri, webview: vscode.WebviewPanel): string {
    // Logic Step: Generate a unique nonce for the Content Security Policy.
    // This is a security measure to allowlist specific inline scripts and styles.
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI PRD Generator</title>
        <style nonce="${nonce}">
            /* General styles */
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .hidden {
                display: none !important;
            }
            #api-key-display, #api-key-input-container {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
            }
            #api-key-obfuscated {
                font-family: monospace;
            }
            #prd-prompt {
                width: 100%;
                height: 150px;
                margin-bottom: 10px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 15px;
                cursor: pointer;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            #error-container {
                color: var(--vscode-errorForeground);
                margin-bottom: 10px;
            }
            .controls-section {
                margin-top: 20px;
                border-top: 1px solid var(--vscode-editor-foreground);
                padding-top: 20px;
            }
            .button-group {
                display: flex;
                gap: 10px;
            }
            .ccs-results {
                margin-top: 15px;
                padding: 20px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                white-space: pre-wrap;
                max-height: 600px;
                overflow-y: auto;
            }
            .ccs-results h2 {
                color: var(--vscode-foreground);
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.2em;
                border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 5px;
            }
            .ccs-results h3 {
                color: var(--vscode-foreground);
                margin-top: 20px;
                margin-bottom: 10px;
                font-size: 1.1em;
            }
            .ccs-results strong {
                color: var(--vscode-textPreformat-foreground);
            }
        </style>
    </head>
    <body>
        <h1>AI PRD Generator</h1>

        <div id="api-key-display" class="hidden">
            <span id="api-key-obfuscated"></span>
            <button id="change-api-key">Change</button>
        </div>

        <!-- Visible by default; JS will toggle visibility based on API Key status -->
        <div id="api-key-input-container">
            <input type="text" id="api-key-input" placeholder="Enter your OpenAI API Key..." size="50">
            <button id="set-api-key">Set API Key</button>
        </div>

        <div id="error-container" class="hidden"></div>

        <div id="generation-controls">
            <textarea id="prd-prompt" placeholder="Enter your product requirements here..."></textarea>
            <button id="generate-prd">Generate PRD</button>
        </div>

        <div id="post-generation-controls" class="hidden">
            <div class="controls-section">
                <h2>View Outputs</h2>
                <div class="button-group">
                    <button id="view-prd">View PRD</button>
                    <button id="view-graph">View Graph</button>
                </div>
            </div>
            <!-- Logic Step: Code Templates section with unique ID for context-aware visibility control -->
            <div id="context-templates-section" class="controls-section">
                <h2>Code Templates</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Generate reusable code patterns and boilerplate templates for your project</p>
                <div class="button-group">
                    <button id="generate-context-templates">Generate Code Templates</button>
                </div>
            </div>
            <!-- Logic Step: Development Guidelines section with unique ID for context-aware visibility control -->
            <div id="context-cards-section" class="controls-section">
                <h2>Development Guidelines</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Create coding standards, best practices, and team conventions for your project</p>
                <div class="button-group">
                    <button id="bulk-generate-context-cards">Generate Development Guidelines</button>
                </div>
            </div>
            <div class="controls-section">
                <h2>Further Options</h2>
                <div class="button-group">
                    <button id="generate-data-flow-diagram">Generate Data Flow Diagram</button>
                    <button id="view-data-flow-diagram" style="display: none;">View Data Flow Diagram</button>
                    <button id="generate-component-hierarchy">Generate Component Hierarchy</button>
                    <button id="view-component-hierarchy" style="display: none;">View Component Hierarchy</button>
                </div>
            </div>
            <!-- Logic Step: Code Comprehension Score section with unique ID for context-aware visibility control -->
            <div id="ccs-section" class="controls-section">
                <h2>Code Comprehension Score</h2>
                <div class="button-group">
                    <button id="generate-ccs">Generate CCS Score</button>
                </div>
                <div id="ccs-results" class="hidden ccs-results"></div>
            </div>
            <!-- Logic Step: Documentation & Testing section for CCS improvement artifacts -->
            <div id="documentation-testing-section" class="controls-section">
                <h2>Documentation & Testing</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Generate comprehensive documentation and testing frameworks to improve Code Comprehension Scores</p>
                <div class="button-group">
                    <button id="generate-comprehensive-readme">Generate README.md</button>
                    <button id="generate-codebase-map">Generate Codebase Map</button>
                </div>
                <div class="button-group" style="margin-top: 10px;">
                    <button id="generate-testing-framework">Generate Testing Framework</button>
                    <button id="generate-ai-prompting-guide">Generate AI Prompting Guide</button>
                </div>
                <div class="button-group" style="margin-top: 10px;">
                    <button id="generate-all-ccs-docs">Generate All CCS Documentation</button>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            console.log('Inline script executing');
            console.log('Script URI:', '${scriptUri}');
            window.addEventListener('error', function(e) {
                console.error('Script error:', e.error, e.filename, e.lineno);
            });
        </script>
        <script nonce="${nonce}" src="${scriptUri}" onerror="console.error('Failed to load script:', '${scriptUri}')"></script>
    </body>
    </html>`;
}

/**
 * Logic Step: Generate a random string for the nonce.
 * @returns A 32-character random string.
 */
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}