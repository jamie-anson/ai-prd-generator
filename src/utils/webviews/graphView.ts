// @ts-nocheck
import * as vscode from 'vscode';

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

    const script = `
        const vscode = acquireVsCodeApi();
        const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: ${elementsJson},
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#0D47A1', // A deep blue color
                        'color': '#FFFFFF',
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '12px',
                        'width': 'label',
                        'height': 'label',
                        'padding': '15px',
                        'shape': 'round-rectangle',
                        'border-width': 1,
                        'border-color': '#BBDEFB' // A light blue border
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#42A5F5', // A medium blue color
                        'target-arrow-color': '#42A5F5',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'color': '#E3F2FD', // A very light blue for text
                        'font-size': '10px',
                        'text-background-opacity': 1,
                        'text-background-color': '#000000',
                        'text-background-padding': '3px'
                    }
                }
            ],
            layout: {
                name: 'dagre',
                nodeSep: 50,
                edgeSep: 10,
                rankSep: 100,
                rankDir: 'TB'
            }
        });

        const tooltip = document.getElementById('tooltip');

        cy.on('mouseover', 'node', function(evt){
            const node = evt.target;
            const data = node.data();

            let content = '<strong>' + data.label + '</strong>';
            if (data.description) {
                content += '<br>' + data.description;
            }

            tooltip.innerHTML = content;
            tooltip.style.display = 'block';
        });

        cy.on('mousemove', function(evt){
            tooltip.style.left = evt.originalEvent.clientX + 15 + 'px';
            tooltip.style.top = evt.originalEvent.clientY + 15 + 'px';
        });

        cy.on('mouseout', 'node', function(evt){
            tooltip.style.display = 'none';
        });
    `;

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
                padding: 10px;
                border-radius: 5px;
                pointer-events: none; /* so the tooltip does not interfere with mouse events on the graph */
                z-index: 100;
                max-width: 300px;
                word-wrap: break-word;
            }
        </style>
    </head>
    <body>
        <div id="cy"></div>
        <div id="tooltip" class="tooltip" style="display:none;"></div>

        <script>
            ${script}
        </script>
    </body>
    </html>`;
}