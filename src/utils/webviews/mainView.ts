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

export function getWebviewContent(scriptUri: vscode.Uri, webview: vscode.WebviewPanel): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' 'nonce-${nonce}'; style-src-attr 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource}; connect-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI PRD Generator</title>
        <style nonce="${nonce}">
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .hidden { display: none !important; }
            #api-key-display, #api-key-input-container { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
            #api-key-obfuscated { font-family: monospace; }
            #prd-prompt { width: 100%; height: 150px; margin-bottom: 10px; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
            button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 15px; cursor: pointer; }
            button:hover { background-color: var(--vscode-button-hoverBackground); }
            #error-container { color: var(--vscode-errorForeground); margin-bottom: 10px; }
            .controls-section { margin-top: 20px; border-top: 1px solid var(--vscode-editor-foreground); padding-top: 20px; }
            .button-group { display: flex; gap: 10px; flex-wrap: wrap; }
            .ccs-results { margin-top: 15px; padding: 20px; background-color: var(--vscode-textBlockQuote-background); border-left: 4px solid var(--vscode-textBlockQuote-border); border-radius: 4px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; white-space: pre-wrap; max-height: 600px; overflow-y: auto; }
            .ccs-results h2 { color: var(--vscode-foreground); margin-top: 0; margin-bottom: 15px; font-size: 1.2em; border-bottom: 1px solid var(--vscode-textSeparator-foreground); padding-bottom: 5px; }
        </style>
    </head>
    <body>
        <h1>AI PRD Generator</h1>

        <div id="api-key-display" class="hidden">
            <span id="api-key-obfuscated"></span>
            <button id="change-api-key">Change</button>
        </div>

        <div id="api-key-input-container">
            <input type="text" id="api-key-input" placeholder="Enter your OpenAI API Key..." size="50">
            <button id="set-api-key">Set API Key</button>
        </div>

        <div id="error-container" class="hidden"></div>

        <div id="generation-controls">
            <!-- DESIGN PHASE -->
            <div id="design-section" class="controls-section">
                <h2>✨ Design</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Start by defining the product requirements</p>
                <textarea id="prd-prompt" placeholder="Describe the product you want to build..."></textarea>
                <div class="button-group">
                    <button id="generate-prd">Generate PRD</button>
                    <button id="view-prd" class="hidden">View PRD</button>
                    <button id="view-project-graph" class="hidden">View Project Graph</button>
                </div>
            </div>
        </div>

        <div id="post-generation-controls" class="hidden">
            <!-- BUILD PHASE -->
            <div id="build-section" class="controls-section">
                <h2>🏗️ Build</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Generate boilerplate, templates, and diagrams from the PRD</p>
                
                <div id="context-templates-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Code Templates</h3>
                    <div class="button-group">
                        <button id="generate-context-templates">Generate Code Templates</button>
                    </div>
                </div>
                
                <div id="context-cards-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Development Guidelines</h3>
                    <div class="button-group">
                        <button id="generate-context-cards">Generate Dev Guidelines</button>
                        <button id="bulk-generate-context-cards" class="hidden">Bulk Generate Context Cards</button>
                    </div>
                </div>
                
                <div id="diagram-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Diagrams</h3>
                    <div class="button-group">
                        <button id="generate-data-flow-diagram">Generate Data Flow Diagram</button>
                        <button id="view-data-flow-diagram" class="hidden">View Data Flow Diagram</button>
                        <button id="generate-component-hierarchy">Generate Component Hierarchy</button>
                        <button id="view-component-hierarchy" class="hidden">View Component Hierarchy</button>
                    </div>
                </div>
            </div>

            <!-- TEST PHASE -->
            <div id="test-section" class="controls-section">
                <h2>🧪 Test</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Analyze code quality and generate testing frameworks</p>
                
                <div id="ccs-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Code Comprehension Score</h3>
                    <div class="button-group">
                        <button id="generate-ccs">Generate CCS Score</button>
                    </div>
                    <div id="ccs-results" class="hidden ccs-results"></div>
                </div>
                
                <div id="testing-framework-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Testing Framework</h3>
                    <div class="button-group">
                        <button id="generate-testing-framework">Generate Testing Framework</button>
                    </div>
                </div>
            </div>

            <!-- DOCUMENT PHASE -->
            <div id="document-section" class="controls-section">
                <h2>📚 Document</h2>
                <p style="margin: 8px 0 15px 0; color: var(--vscode-descriptionForeground); font-size: 0.9em;">Generate comprehensive documentation and knowledge transfer materials</p>
                
                <div id="handover-document-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 10px 0 8px 0; font-size: 1.1em;">Project Documentation</h3>
                    <div class="button-group">
                        <button id="generate-handover-file">Generate Handover Document</button>
                        <button id="generate-comprehensive-readme">Generate Comprehensive README</button>
                        <button id="generate-codebase-map">Generate Codebase Map</button>
                        <button id="generate-ai-prompting-guide">Generate AI Prompting Guide</button>
                        <button id="generate-all-ccs-docs">Generate All CCS Docs</button>
                    </div>
                </div>
            </div>
        </div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}