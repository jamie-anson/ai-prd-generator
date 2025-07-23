// @ts-nocheck
import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import { PrdJson } from './types';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getWebviewContent(scriptContent: string, panel: vscode.WebviewPanel) {
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PRD Generator</title>
        <style nonce="${nonce}">
            .hidden {
                display: none;
            }
            #api-key-input-container, #api-key-display {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            #api-key-input {
                flex-grow: 1;
            }
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
        <textarea id="prd-prompt" rows="10" cols="50" placeholder="Enter your product requirements here..."></textarea>
        <br>
        <button id="generate-prd">Generate PRD</button>
        <div id="post-generation-controls" class="hidden">
            <hr>
            <button id="bulk-generate-context-cards">Generate Context Cards</button>
            <button id="view-context-cards">View Context Cards</button>
            <hr>
            <button id="view-prd">View PRD</button>
        </div>

        <div id="prd-output"></div>

        <script nonce="${nonce}">
            ${scriptContent}
        </script>
    </body>
    </html>`;
}

export function getPrdMarkdownViewContent(markdown: string) {
    const md = new MarkdownIt();
    const result = md.render(markdown);
    return getStyledMdViewerWebviewContent(result);
}

export function getPrdJsonViewContent(json: any) {
    return getStyledPrdWebviewContent(json);
}

export function getGraphViewerWebviewContent(graphData: any, cytoscapeUri: vscode.Uri, dagreUri: vscode.Uri, cyDagreUri: vscode.Uri): string {
    let elements: any[] = [];
    if (Array.isArray(graphData)) {
        elements = graphData;
    } else if (graphData.graph && Array.isArray(graphData.graph.nodes) && Array.isArray(graphData.graph.edges)) {
        elements = graphData.graph.nodes.concat(graphData.graph.edges);
    } else if (graphData.nodes && graphData.edges) {
        elements = graphData.nodes.concat(graphData.edges);
    }
    const elementsJson = JSON.stringify(elements);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PRD Graph</title>
        <script src="${cytoscapeUri}"></script>
        <script src="${dagreUri}"></script>
        <script src="${cyDagreUri}"></script>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: var(--vscode-font-family); }
            #cy { width: 100%; height: 100%; display: block; }
            .tooltip {
                position: absolute;
                background-color: var(--vscode-editor-hover-background);
                color: var(--vscode-editor-hover-foreground);
                border: 1px solid var(--vscode-editor-hover-border);
                padding: 8px;
                border-radius: 4px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div id="cy"></div>
        <div id="tooltip" class="tooltip"></div>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const elements = ${elementsJson};
                const tooltip = document.getElementById('tooltip');

                const cy = cytoscape({
                    container: document.getElementById('cy'),
                    elements: elements,
                    style: [
                        {
                            selector: 'node',
                            style: {
                                'background-color': (ele) => {
                                    const type = ele.data('type');
                                    if (type === 'prd') return '#FF6347';
                                    if (type === 'feature') return '#4682B4';
                                    if (type === 'class') return '#32CD32';
                                    if (type === 'function') return '#FFD700';
                                    return '#ccc';
                                },
                                'label': 'data(label)',
                                'color': '#fff',
                                'text-outline-color': '#555',
                                'text-outline-width': 2,
                                'font-size': '16px',
                                'text-valign': 'center',
                                'text-halign': 'center',
                                'shape': 'round-rectangle',
                                'width': 'label',
                                'height': 'label',
                                'padding': '15px'
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 2,
                                'line-color': '#ccc',
                                'target-arrow-color': '#ccc',
                                'target-arrow-shape': 'triangle',
                                'curve-style': 'bezier',
                                'label': 'data(label)',
                                'color': 'white',
                                'font-size': '10px',
                                'text-background-color': '#555',
                                'text-background-opacity': 0.7,
                                'text-background-padding': '2px'
                            }
                        }
                    ],
                    layout: {
                        name: 'dagre',
                        rankDir: 'TB',
                        spacingFactor: 1.2
                    }
                });

                cy.on('mouseover', 'node', function(evt){
                    const node = evt.target;
                    const data = node.data();
                    let content = '<strong>' + data.label + '</strong>';
                    if(data.filePath) content += '<br>File: ' + data.filePath;
                    if(data.summary) content += '<br>Summary: ' + data.summary;

                    tooltip.innerHTML = content;
                    tooltip.style.opacity = 0.9;
                });

                cy.on('mousemove', function(evt){
                    tooltip.style.left = evt.originalEvent.clientX + 15 + 'px';
                    tooltip.style.top = evt.originalEvent.clientY + 15 + 'px';
                });

                cy.on('mouseout', 'node', function(evt){
                    tooltip.style.opacity = 0;
                });
            });
        </script>
    </body>
    </html>`;
}

export function getStyledPrdWebviewContent(prdData: PrdJson): string {
    const { title, purpose, goals, userRoles, features, technicalRequirements, nonFunctionalRequirements, userJourneys, successMetrics, futureEnhancements } = prdData;

    const featuresHtml = features.map(f => `
        <div class="feature">
            <h4>${f.title}</h4>
            <ul>${f.requirements.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
    `).join('');

    const journeysHtml = Object.entries(userJourneys).map(([role, steps]) => `
        <div class="journey">
            <h4>${role}</h4>
            <ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
    `).join('');
    const metricsHtml = successMetrics.map(m => `<li>${m}</li>`).join('');
    const enhancementsHtml = futureEnhancements.map(e => `<li>${e}</li>`).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 25px; }
                .container { max-width: 900px; margin: 0 auto; }
                .section { margin-bottom: 25px; border-bottom: 1px solid var(--vscode-side-bar-border); padding-bottom: 15px; }
                h1, h2, h3 { color: var(--vscode-editor-foreground); }
                h1 { text-align: center; margin-bottom: 30px; }
                ul, ol { padding-left: 20px; }
                .feature, .journey { margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <div class="section">
                    <h2>Purpose</h2>
                    <p>${purpose}</p>
                </div>
                <div class="section">
                    <h2>Goals</h2>
                    <ul>${goals.map(g => `<li>${g}</li>`).join('')}</ul>
                </div>
                <div class="section">
                    <h2>User Roles</h2>
                    <ul>${userRoles.map(r => `<li>${r}</li>`).join('')}</ul>
                </div>
                <div class="section">
                    <h2>Features</h2>
                    ${featuresHtml}
                </div>
                <div class="section">
                    <h2>Technical Requirements</h2>
                    <h4>Frontend</h4><p><strong>Stack:</strong> ${technicalRequirements.frontend.stack}<br><strong>Notes:</strong> ${technicalRequirements.frontend.notes}</p>
                    <h4>Backend</h4><p><strong>Stack:</strong> ${technicalRequirements.backend.stack}<br><strong>Notes:</strong> ${technicalRequirements.backend.notes}</p>
                    <h4>Database</h4><p><strong>Stack:</strong> ${technicalRequirements.database.stack}<br><strong>Notes:</strong> ${technicalRequirements.database.notes}</p>
                </div>

                <div class="section">
                    <h2>Non-Functional Requirements</h2>
                    <p><strong>Security:</strong> ${nonFunctionalRequirements.security}</p>
                    <p><strong>Scalability:</strong> ${nonFunctionalRequirements.scalability}</p>
                    <p><strong>Performance:</strong> ${nonFunctionalRequirements.performance}</p>
                </div>
                
                <div class="section">
                    <h2>User Journey Summary</h2>
                    ${journeysHtml}
                </div>

                <div class="section">
                    <h2>Success Metrics</h2>
                    <ul>${metricsHtml}</ul>
                </div>

                <div class="section">
                    <h2>Future Enhancements</h2>
                    <ul>${enhancementsHtml}</ul>
                </div>

            </div>
        </body>
        </html>
    `;
}

export function getStyledMdViewerWebviewContent(markdownContent: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Styled Markdown PRD</title>
        <style>
            body { font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-size: 18px; padding: 20px; line-height: 1.6; }
            h1, h2, h3, h4, h5, h6 { color: var(--vscode-editor-foreground); border-bottom: 1px solid var(--vscode-side-bar-border); padding-bottom: 5px; }
            p { margin-bottom: 10px; }
            code { background-color: var(--vscode-text-block-quote-background); padding: 2px 4px; border-radius: 4px; font-family: var(--vscode-editor-font-family); }
            pre { background-color: var(--vscode-text-block-quote-background); padding: 10px; border-radius: 4px; overflow-x: auto; }
            blockquote { border-left: 4px solid var(--vscode-side-bar-border); padding-left: 10px; color: var(--vscode-text-separator-foreground); margin-left: 0; }
            ul, ol { padding-left: 20px; }
            a { color: var(--vscode-text-link-foreground); text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        ${markdownContent}
    </body>
    </html>`;
}

export function getContextCardViewContent(markdown: string, title: string): string {
    const md = new MarkdownIt();
    const result = md.render(markdown);
    return getStyledMdViewerWebviewContent(result);
}
