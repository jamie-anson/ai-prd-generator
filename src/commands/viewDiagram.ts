// @ts-nocheck
/**
 * @file viewDiagram.ts
 * @description Registers the viewDiagram command for rendering Data Flow Diagrams and Component Hierarchy diagrams in visual webviews.
 * 
 * The logic of this file is to:
 * 1. Register the 'ai-prd-generator.viewDiagram' VS Code command
 * 2. Create webview panels for visual diagram rendering with Mermaid support
 * 3. Extract and render Mermaid diagrams from markdown content
 * 4. Provide fallback display for content without Mermaid diagrams
 * 5. Handle file reading errors and provide user feedback
 */

import * as vscode from 'vscode';
import { getMermaidViewerWebviewContent } from '../utils/webview';
import { registerCommandOnce } from './commandRegistry';

/**
 * Logic Step: Register the viewDiagram command for visual diagram rendering.
 * This function creates a VS Code command that opens diagrams in interactive webviews
 * with Mermaid rendering support, providing a much better user experience than plain markdown.
 * @param context The extension context for command registration and resource management
 */
export function registerViewDiagramCommand(context: vscode.ExtensionContext) {
    registerCommandOnce('ai-prd-generator.viewDiagram', async (filePath: string, diagramType: 'data-flow' | 'component-hierarchy') => {
        if (!filePath) {
            vscode.window.showErrorMessage('No diagram file path provided.');
            return;
        }

        const diagramTitle = diagramType === 'data-flow' ? 'Data Flow Diagram' : 'Component Hierarchy';
        
        const panel = vscode.window.createWebviewPanel(
            `diagramView-${diagramType}`,
            `${diagramTitle} Viewer`,
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                enableForms: false,
                enableCommandUris: false,
                localResourceRoots: [context.extensionUri],
                portMapping: []
            }
        );

        try {
            const fileUri = vscode.Uri.file(filePath);
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const contentString = Buffer.from(fileContent).toString('utf-8');

            // Extract Mermaid diagrams from the markdown content
            const mermaidDiagrams = extractMermaidDiagrams(contentString);
            
            if (mermaidDiagrams.length === 0) {
                panel.webview.html = `
                    <html>
                        <body>
                            <h1>${diagramTitle}</h1>
                            <div style="padding: 20px; background: #f0f0f0; border-radius: 5px; margin: 20px 0;">
                                <p><strong>No Mermaid diagrams found in this file.</strong></p>
                                <p>The diagram content will be displayed as markdown instead:</p>
                            </div>
                            <div style="white-space: pre-wrap; font-family: monospace; background: #f8f8f8; padding: 15px; border-radius: 5px;">
                                ${contentString.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                            </div>
                        </body>
                    </html>
                `;
                return;
            }

            // Create webview content with Mermaid rendering
            panel.webview.html = getMermaidViewerWebviewContent(contentString, diagramTitle, mermaidDiagrams);
            
        } catch (error: any) {
            console.error('Error reading diagram file:', error);
            vscode.window.showErrorMessage(`Failed to open diagram viewer: ${error.message}`);
        }
    }, context);
}

/**
 * Logic Step: Extract Mermaid diagram code blocks from markdown content.
 * This function uses regex pattern matching to find all ```mermaid code blocks
 * and extracts their content for rendering in the webview.
 * @param content The full markdown content containing potential Mermaid diagrams
 * @returns Array of Mermaid diagram code strings (without the markdown code block syntax)
 */
function extractMermaidDiagrams(content: string): string[] {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    const diagrams: string[] = [];
    let match;
    
    while ((match = mermaidRegex.exec(content)) !== null) {
        diagrams.push(match[1].trim());
    }
    
    return diagrams;
}
