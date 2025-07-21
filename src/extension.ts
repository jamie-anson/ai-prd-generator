// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';
import MarkdownIt = require('markdown-it');

/**
 * Defines the structure for the complete PRD output from the AI service.
 */
interface PrdOutput {
    markdown: string;
    json: object;
    graph: { nodes: object[], edges: object[] };
}

/**
 * This method is called when the extension is activated.
 * It sets up the main command, registers event listeners, and initializes resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ai-prd-generator" is now active!');

    // Register the main command to generate a PRD.
    const generatePrdCommand = vscode.commands.registerCommand('ai-prd-generator.generatePrd', async () => {
        const panel = vscode.window.createWebviewPanel('prdGenerator', 'PRD Generator', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
        });
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'main.js'));
        panel.webview.html = getWebviewContent(scriptUri);

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'generate') {
                vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating PRD...", cancellable: false }, async (progress) => {
                    progress.report({ increment: 0, message: "Calling AI..." });
                    const apiKey = await context.secrets.get('openAiApiKey');
                    if (!apiKey) {
                        vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
                        panel.webview.postMessage({ command: 'error', text: 'API Key is not set.' });
                        return;
                    }
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        vscode.window.showErrorMessage('No workspace folder found. Please open a folder to save PRD files.');
                        panel.webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
                        return;
                    }
                    try {
                        const prdOutput = await callOpenAiAPI(message.text, apiKey);
                        progress.report({ increment: 50, message: "Saving files..." });
                        if (prdOutput) {
                            const workspacePath = workspaceFolders[0].uri.fsPath;
                            const timestamp = new Date().toISOString().replace(/:/g, '-');
                            const mdFilePath = vscode.Uri.file(`${workspacePath}/PRD-${timestamp}.md`);
                            const jsonFilePath = vscode.Uri.file(`${workspacePath}/PRD-${timestamp}.json`);
                            const graphFilePath = vscode.Uri.file(`${workspacePath}/PRD-${timestamp}.graph.json`);
                            await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown));
                            await vscode.workspace.fs.writeFile(jsonFilePath, Buffer.from(JSON.stringify(prdOutput, null, 4)));
                            await vscode.workspace.fs.writeFile(graphFilePath, Buffer.from(JSON.stringify({ graph: prdOutput.graph }, null, 4)));
                            vscode.window.showInformationMessage('PRD files generated successfully!');
                            await vscode.window.showTextDocument(mdFilePath);
                            panel.webview.postMessage({ command: 'success' });
                        } else {
                            throw new Error("Received no data from API.");
                        }
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Failed to generate PRD: ${error.message}`);
                        panel.webview.postMessage({ command: 'error', text: `Error: ${error.message}` });
                    }
                });
            }
        }, undefined, context.subscriptions);
    });

    const setApiKeyCommand = vscode.commands.registerCommand('ai-prd-generator.setOpenAiApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({ prompt: 'Enter your OpenAI API Key', password: true });
        if (apiKey) {
            await context.secrets.store('openAiApiKey', apiKey);
            vscode.window.showInformationMessage('OpenAI API Key stored successfully.');
        }
    });

    const viewPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewPrd', async (uri: vscode.Uri) => {
        vscode.window.showInformationMessage('View PRD command started.');
        try {
            if (!uri) {
                vscode.window.showInformationMessage('No URI from context menu, opening file dialog.');
                const uris = await vscode.window.showOpenDialog({ canSelectMany: false, openLabel: 'Select PRD File', filters: { 'PRD Files': ['json', 'md', 'graph.json'] } });
                if (!uris || uris.length === 0) {
                    vscode.window.showInformationMessage('File dialog cancelled.');
                    return;
                }
                uri = uris[0];
            }

            vscode.window.showInformationMessage(`Processing file: ${uri.fsPath}`);
            const rawContent = await vscode.workspace.fs.readFile(uri);
            const contentStr = Buffer.from(rawContent).toString('utf8');

            const panel = vscode.window.createWebviewPanel(
                'prdViewer',
                'PRD Viewer',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
                }
            );

            if (uri.fsPath.endsWith('.md')) {
                vscode.window.showInformationMessage('Opening styled MD viewer...');
                panel.title = 'Styled PRD';
                panel.webview.html = getStyledMdViewerWebviewContent(contentStr);
            } else {
                const fileData = JSON.parse(contentStr);
                if (uri.fsPath.endsWith('.graph.json')) {
                    vscode.window.showInformationMessage('Opening graph viewer...');
                    panel.title = 'Graph PRD';
                    const cytoscapeUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'cytoscape.min.js'));
                    panel.webview.html = getGraphViewerWebviewContent(fileData, cytoscapeUri);
                } else {
                    vscode.window.showInformationMessage('Opening styled PRD viewer...');
                    panel.title = 'Styled PRD';
                    const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'styled-prd-viewer.css'));
                    panel.webview.html = getStyledPrdWebviewContent(fileData, styleUri);
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to open PRD viewer: ${error.message}`);
        }
    });

    context.subscriptions.push(generatePrdCommand, setApiKeyCommand, viewPrdCommand);
}

async function callOpenAiAPI(prompt: string, apiKey: string): Promise<PrdOutput | null> {
    const openai = new OpenAI({ apiKey });
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Product Manager. Your task is to generate a comprehensive Product Requirements Document (PRD) based on the user's prompt. The PRD must be structured as a single, clean JSON object with no extra text or explanations. The JSON object should contain three top-level keys: 'markdown', 'json', and 'graph'.

1.  **'markdown'**: A string containing the full PRD in GitHub-flavored Markdown. It must include sections for Introduction, User Personas, Features, and User Stories.

2.  **'json'**: A structured JSON object containing the PRD details. It must have the following keys: 'title', 'introduction', 'userPersonas' (an array of objects with 'name' and 'description'), 'features' (an array of objects with 'id', 'title', and 'description'), and 'userStories' (an array of objects with 'id', 'story', and 'relatesToFeature').

3.  **'graph'**: A JSON object formatted for a graph visualization library like Cytoscape.js. It must contain two keys: 'nodes' and 'edges'.
    *   'nodes': An array of objects, where each object represents a User Persona, Feature, or User Story. Each node must have a 'data' object with an 'id' (unique identifier, e.g., 'p1', 'f1', 's1'), a 'label' (display name), and a 'type' (e.g., 'User Persona', 'Feature', 'User Story').
    *   'edges': An array of objects representing the relationships. Each edge must have a 'data' object with a 'source' (the 'id' of the source node) and a 'target' (the 'id' of the target node).

Generate the complete JSON object based on the following user prompt.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("Empty response from OpenAI API.");
        }

        // Instead of parsing here, we expect the model to return a single JSON object string.
        return JSON.parse(content) as PrdOutput;

    } catch (error: any) {
        console.error("Error calling OpenAI API:", error);
        let errorMessage = "An unknown error occurred.";
        if (error.response) {
            errorMessage = `API Error: ${error.response.status} ${error.response.data?.error?.message || ''}`.trim();
        } else if (error.message) {
            errorMessage = error.message;
        }
        vscode.window.showErrorMessage(`Failed to call OpenAI API: ${errorMessage}`);
        return null;
    }
}

function getWebviewContent(scriptUri: vscode.Uri) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PRD Generator</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); padding: 20px; }
            textarea { width: 100%; height: 200px; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); margin-bottom: 10px; }
            button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 15px; cursor: pointer; }
            button:hover { background-color: var(--vscode-button-hoverBackground); }
            #loader { display: none; }
            #error-message { color: var(--vscode-errorForeground); }
        </style>
    </head>
    <body>
        <h1>AI-Powered PRD Generator</h1>
        <p>Enter your product idea or requirements below, and the AI will generate a detailed PRD for you.</p>
        <textarea id="prompt-input" placeholder="e.g., A mobile app for tracking personal fitness goals with social sharing features."></textarea>
        <button id="generate-btn">Generate PRD</button>
        <div id="loader">Generating...</div>
        <p id="error-message"></p>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getJsonViewerWebviewContent(scriptUri: vscode.Uri, styleUri: vscode.Uri) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSON Viewer</title>
        <link rel="stylesheet" href="${styleUri}">
        <style>
            body { background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
            #loader { text-align: center; padding-top: 50px; font-size: 1.5em; }
        </style>
    </head>
    <body>
        <div id="loader">Loading JSON...</div>
        <div id="json-viewer"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getGraphViewerWebviewContent(graphData: any, cytoscapeUri: vscode.Uri): string {
    if (!graphData) {
        return `<h1>Error: No graph data provided.</h1>`;
    }

    const nodes = (graphData.nodes || []).map((n: any) => ({ data: n }));
    const edges = (graphData.edges || []).map((e: any) => ({ data: e }));
    const elements = [...nodes, ...edges];
    const graphJsonString = JSON.stringify(elements);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${'vscode-resource:'}; script-src 'unsafe-inline' 'unsafe-eval' ${'vscode-resource:'} https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graph PRD</title>
        <script src="${cytoscapeUri}"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
            #cy { width: 100%; height: 100%; display: block; }
            #info-panel { position: absolute; top: 10px; right: 10px; background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-sideBar-border); padding: 10px; max-width: 300px; max-height: 90vh; overflow-y: auto; border-radius: 5px; display: none; }
            h2 { color: var(--vscode-editor-foreground); }
            p { margin: 5px 0; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
    </head>
    <body>
        <div id="cy">Loading Graph...</div>
        <div id="info-panel">
            <h2>Node Properties</h2>
            <p id="info-content"></p>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
             try {
                const elements = ${graphJsonString};
                cytoscape.use(cytoscapeDagre); // Register the dagre layout
                const cy = cytoscape({
                    container: document.getElementById('cy'),
                    elements: elements,
                    style: [
                        { selector: 'node', style: { 'background-color': '#666', 'label': 'data(label)', 'color': '#fff', 'text-outline-color': '#222', 'text-outline-width': 2 } },
                        { selector: 'edge', style: { 'width': 2, 'line-color': '#ccc', 'target-arrow-color': '#ccc', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
                        { selector: 'node[type="Feature"]', style: { 'background-color': '#3a8dff' } },
                        { selector: 'node[type="User Story"]', style: { 'background-color': '#ffab3a' } },
                        { selector: 'node[type="User Persona"]', style: { 'background-color': '#ff5a5a', 'shape': 'diamond' } }
                    ],
                    layout: { name: 'dagre', rankDir: 'TB', spacingFactor: 1.2 }
                });

                const infoPanel = document.getElementById('info-panel');
                const infoContent = document.getElementById('info-content');

                cy.on('tap', 'node', function(evt){
                    const node = evt.target;
                    const data = node.data();
                    let content = '';
                    for (const key in data) {
                        if (key !== 'id' && key !== 'label') { // Simplified to show all other properties
                            content += '<strong>' + key + ':</strong> ' + JSON.stringify(data[key]) + '<br>';
                        }
                    }
                    infoContent.innerHTML = content;
                    infoPanel.style.display = 'block';
                });

                cy.on('tap', function(evt){
                    if(evt.target === cy){
                        infoPanel.style.display = 'none';
                    }
                });
              } catch (e) {
                console.error('Error rendering graph:', e);
                const container = document.getElementById('cy');
                container.innerHTML = '<h2>Error Rendering Graph</h2><p>Check the developer console for details (Developer: Toggle Developer Tools).</p><pre>' + e.stack + '</pre>';
              }
            });
        </script>
    </body>
    </html>`;
}

function getStyledPrdWebviewContent(prdJson: any, styleUri: vscode.Uri): string {
    const escapeHtml = (unsafe: string) => {
        if (!unsafe) { return ''; }
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const title = prdJson.title ? `<h1>${escapeHtml(prdJson.title)}</h1>` : '';
    const introduction = prdJson.introduction ? `<div class="section"><h2>Introduction</h2><p>${escapeHtml(prdJson.introduction)}</p></div>` : '';
    const userPersonas = prdJson.userPersonas?.map((persona: any) => `
        <div class="persona-card">
            <h3>${escapeHtml(persona.name)}</h3>
            <p>${escapeHtml(persona.description)}</p>
        </div>`).join('') || '';
    const features = prdJson.features?.map((feature: any) => `
        <div class="feature-card">
            <h3>${escapeHtml(feature.title)} (ID: ${escapeHtml(feature.id)})</h3>
            <p>${escapeHtml(feature.description)}</p>
        </div>`).join('') || '';
    const userStories = prdJson.userStories?.map((story: any) => `
        <li>
            <strong>${escapeHtml(story.id)}:</strong> ${escapeHtml(story.story)} 
            <em>(Relates to: ${escapeHtml(story.relatesToFeature)})</em>
        </li>`).join('') || '';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Styled PRD</title>
        <link rel="stylesheet" href="${styleUri}">
    </head>
    <body>
        <div class="container">
            ${title}
            ${introduction}
            ${userPersonas ? `<div class="section"><h2>User Personas</h2><div class="card-container">${userPersonas}</div></div>` : ''}
            ${features ? `<div class="section"><h2>Features</h2><div class="card-container">${features}</div></div>` : ''}
            ${userStories ? `<div class="section"><h2>User Stories</h2><ul>${userStories}</ul></div>` : ''}
        </div>
    </body>
    </html>`;
}

function getStyledMdViewerWebviewContent(markdownContent: string): string {
    const md = new MarkdownIt();
    const htmlContent = md.render(markdownContent);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Styled PRD</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                font-size: 18px; /* Increased for readability */
                padding: 20px;
                line-height: 1.6;
            }
            h1, h2, h3, h4, h5, h6 {
                color: var(--vscode-editor-foreground);
                border-bottom: 1px solid var(--vscode-side-bar-border);
                padding-bottom: 5px;
            }
            p {
                margin-bottom: 10px;
            }
            code {
                background-color: var(--vscode-text-block-quote-background);
                padding: 2px 4px;
                border-radius: 4px;
                font-family: var(--vscode-editor-font-family);
            }
            pre {
                background-color: var(--vscode-text-block-quote-background);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
            }
            blockquote {
                border-left: 4px solid var(--vscode-side-bar-border);
                padding-left: 10px;
                color: var(--vscode-text-separator-foreground);
                margin-left: 0;
            }
            ul, ol {
                padding-left: 20px;
            }
            a {
                color: var(--vscode-text-link-foreground);
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>`;
}

export function deactivate() {}
