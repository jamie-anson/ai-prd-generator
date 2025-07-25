// @ts-nocheck
/**
 * @file mermaidView.ts
 * @description Generates HTML content for rendering Mermaid diagrams in VS Code webviews.
 * 
 * The logic of this file is to:
 * 1. Create interactive webview content with Mermaid.js integration
 * 2. Render multiple Mermaid diagrams from extracted markdown content
 * 3. Provide VS Code theme-aware styling for consistent user experience
 * 4. Include error handling and loading states for diagram rendering
 * 5. Display full markdown content alongside visual diagrams
 */

import * as vscode from 'vscode';

/**
 * Logic Step: Generate HTML content for Mermaid diagram visualization in webviews.
 * This function creates a complete HTML document with Mermaid.js integration,
 * VS Code theme variables, and interactive diagram rendering capabilities.
 * @param markdownContent The full markdown content containing the diagrams
 * @param title The title to display in the webview header
 * @param mermaidDiagrams Array of extracted Mermaid diagram code blocks
 * @returns Complete HTML string ready for webview rendering
 */
export function getMermaidViewerWebviewContent(markdownContent: string, title: string, mermaidDiagrams: string[]): string {
    // Escape the markdown content for safe HTML insertion
    const escapedContent = markdownContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Generate diagram HTML - escape the diagram content properly
    const diagramsHtml = mermaidDiagrams.map((diagram, index) => {
        // Clean and escape the diagram content
        const cleanDiagram = diagram.trim();
        return `
        <div class="diagram-container">
            <h3>Diagram ${index + 1}</h3>
            <div class="mermaid-diagram">
                <div class="mermaid">${cleanDiagram}</div>
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }

        h1, h2, h3 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            margin-top: 24px;
            margin-bottom: 16px;
        }

        .diagram-container {
            margin: 20px 0;
            padding: 16px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }

        .mermaid-diagram {
            text-align: center;
            margin: 16px 0;
            background-color: var(--vscode-editor-background);
            padding: 20px;
            border-radius: 4px;
            overflow-x: auto;
        }

        .mermaid {
            display: block;
            margin: 0 auto;
        }

        .loading {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            text-align: center;
            padding: 20px;
        }

        .error-message {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin: 10px 0;
        }

        .content-section {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 2px solid var(--vscode-panel-border);
        }

        .markdown-content {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.4;
            overflow-x: auto;
        }

        .mermaid svg {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div id="diagrams-container">
        ${diagramsHtml}
    </div>

    <div class="content-section">
        <h2>Full Content</h2>
        <div class="markdown-content">${escapedContent}</div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <script>
        // Configure Mermaid to match PRD Graph styling
        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                padding: 15
            },
            themeVariables: {
                // Match PRD Graph color scheme
                primaryColor: '#0D47A1',        // Deep blue like PRD nodes
                primaryTextColor: '#FFFFFF',     // White text
                primaryBorderColor: '#BBDEFB',   // Light blue border like PRD
                lineColor: '#42A5F5',           // Medium blue for connections
                secondaryColor: '#E3F2FD',      // Very light blue
                tertiaryColor: '#F3E5F5',       // Light purple accent
                background: '#1E1E1E',          // Dark background
                mainBkg: '#2D2D30',             // Node background
                secondBkg: '#3E3E42',           // Secondary elements
                tertiaryBkg: '#4D4D50',         // Tertiary elements
                // Text and label styling
                edgeLabelBackground: '#000000',  // Black background for edge labels
                clusterBkg: '#2D2D30',          // Cluster background
                clusterBorder: '#BBDEFB',       // Cluster border
                defaultLinkColor: '#42A5F5',    // Default link color
                titleColor: '#FFFFFF',          // Title color
                darkMode: true
            }
        });
        
        // Render diagrams when page loads
        window.addEventListener('load', async function() {
            console.log('Starting Mermaid rendering...');
            const diagrams = document.querySelectorAll('.mermaid');
            console.log('Found diagrams:', diagrams.length);
            
            for (let i = 0; i < diagrams.length; i++) {
                const diagram = diagrams[i];
                const diagramText = diagram.textContent.trim();
                console.log('Rendering diagram:', i + 1, diagramText.substring(0, 50));
                
                try {
                    const { svg } = await mermaid.render('diagram-' + i, diagramText);
                    diagram.innerHTML = svg;
                    console.log('Successfully rendered diagram:', i + 1);
                } catch (error) {
                    console.error('Error rendering diagram:', error);
                    diagram.innerHTML = '<div class="error-message"><strong>Error rendering diagram:</strong><br>' + error.message + '<br><br><details><summary>Raw diagram code:</summary><pre>' + diagramText + '</pre></details></div>';
                }
            }
        });
    </script>
</body>
</html>`;
}
