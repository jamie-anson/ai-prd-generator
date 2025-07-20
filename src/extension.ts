// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';

// Define the structure of the expected output from the AI
interface PrdOutput {
    markdown: string;
    json: object;
    graph: { nodes: object[], edges: object[] };
}

// Define the structure of the Gemini API response
interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ai-prd-generator" is now active!');

    const disposable = vscode.commands.registerCommand('ai-prd-generator.generatePrd', async () => {
        const panel = vscode.window.createWebviewPanel(
            'prdGenerator',
            'PRD Generator',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
            }
        );

        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'main.js'));
				panel.webview.html = getWebviewContent(scriptUri);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'generate') {
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Generating PRD...",
                        cancellable: false
                    }, async (progress) => {
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
                                const folderUri = workspaceFolders[0].uri;
                                const timestamp = new Date().getTime();
                                const mdPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.md`);
                                const jsonPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.json`);
                                const graphPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.graph.json`);

                                await vscode.workspace.fs.writeFile(mdPath, Buffer.from(prdOutput.markdown, 'utf8'));
                                await vscode.workspace.fs.writeFile(jsonPath, Buffer.from(JSON.stringify(prdOutput.json, null, 2), 'utf8'));
                                await vscode.workspace.fs.writeFile(graphPath, Buffer.from(JSON.stringify(prdOutput.graph, null, 2), 'utf8'));

                                vscode.window.showInformationMessage(`Successfully generated PRD files!`);
                                panel.webview.postMessage({ command: 'generationComplete', files: [mdPath.fsPath, jsonPath.fsPath, graphPath.fsPath] });
                                vscode.commands.executeCommand('vscode.open', mdPath);
                            } else {
                                panel.webview.postMessage({ command: 'error', text: 'Failed to generate PRD from AI. The response was empty.' });
                            }
                        } catch (error: any) {
                            console.error('Error during PRD generation or file saving:', error);
                            const errorMessage = error.message || 'An unknown error occurred.';
                            panel.webview.postMessage({ command: 'error', text: `Error: ${errorMessage}` });
                        }
                        progress.report({ increment: 100 });
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);

    const viewJsonPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewJsonPrd', (uri: vscode.Uri) => {
        const panel = vscode.window.createWebviewPanel(
            'jsonPrdViewer',
            'Interactive PRD Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
            }
        );

        // Get the paths to the resources on disk
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'json-viewer.js'));
        const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'json-viewer.css'));

        // Read the file content and send it to the webview
        vscode.workspace.fs.readFile(uri).then(document => {
            panel.webview.html = getJsonViewerWebviewContent(scriptUri, styleUri);
            panel.webview.postMessage({ command: 'renderJson', data: JSON.parse(Buffer.from(document).toString('utf-8')) });
        }).then(undefined, err => {
            vscode.window.showErrorMessage(`Could not open JSON file: ${err}`);
        });
    });

    context.subscriptions.push(viewJsonPrdCommand);

    const viewGraphPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewGraphPrd', (uri: vscode.Uri) => {
        const panel = vscode.window.createWebviewPanel(
            'graphPrdViewer',
            'Interactive Graph PRD',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
            }
        );

        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'cytoscape.min.js'));

        vscode.workspace.fs.readFile(uri).then(document => {
            panel.webview.html = getGraphViewerWebviewContent(scriptUri);
            panel.webview.postMessage({ command: 'renderGraph', data: JSON.parse(Buffer.from(document).toString('utf-8')) });
        }).then(undefined, err => {
            vscode.window.showErrorMessage(`Could not open graph file: ${err}`);
        });
    });

    context.subscriptions.push(viewGraphPrdCommand);

    const setOpenAiApiKeyCommand = vscode.commands.registerCommand('ai-prd-generator.setOpenAiApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API Key',
            password: true,
            ignoreFocusOut: true
        });

        if (apiKey) {
            await context.secrets.store('openAiApiKey', apiKey);
            vscode.window.showInformationMessage('OpenAI API Key saved successfully!');
        } else {
            vscode.window.showWarningMessage('API Key was not entered.');
        }
    });

    context.subscriptions.push(setOpenAiApiKeyCommand);
}

async function callOpenAiAPI(prompt: string, apiKey: string): Promise<PrdOutput | null> {
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a world-class product manager and system architect. Based on the following idea, generate a comprehensive Product Requirements Document (PRD). The output MUST be a single, valid JSON object that adheres to the provided schema. Do not include any other text, markdown, or formatting outside of the JSON object.

**JSON Schema:**
{
  "type": "object",
  "properties": {
    "markdown": {
      "type": "string",
      "description": "A full PRD in Markdown format. Include sections like Introduction, User Personas, Features, User Stories, and Technical Considerations."
    },
    "json": {
      "type": "object",
      "description": "A structured JSON representation of the PRD. Use nested objects for clarity.",
      "properties": {
        "title": { "type": "string" },
        "introduction": { "type": "string" },
        "userPersonas": { 
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "features": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "userStories": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "story": { "type": "string" },
              "relatesToFeature": { "type": "string" }
            }
          }
        }
      }
    },
    "graph": {
      "type": "object",
      "description": "Data for a graph visualization.",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "label": { "type": "string" },
              "type": { "type": "string", "enum": ["FEATURE", "USER_STORY", "USER_PERSONA"] }
            }
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "source": { "type": "string" },
              "target": { "type": "string" },
              "label": { "type": "string", "enum": ["HAS_STORY", "DESCRIBES_PERSONA"] }
            }
          }
        }
      }
    }
  }
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `**Product Idea:**\n${prompt}` }
            ],
            response_format: { type: 'json_object' },
        });

        const jsonContent = response.choices[0].message.content;
        if (!jsonContent) {
            throw new Error('API returned empty content.');
        }

        return JSON.parse(jsonContent) as PrdOutput;

    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);
        throw new Error(`API Error: ${error.message}`);
    }
}

function getWebviewContent(scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PRD Generator</title>
    </head>
    <body>
        <h1>AI-Powered PRD Generator</h1>
        <textarea id="prompt-input" rows="10" cols="50" placeholder="Enter your product idea..."></textarea>
        <br>
        <button id="generate-button">Generate PRD</button>
        <div id="loader" style="display: none; margin-top: 10px;">Generating...</div>
        <hr>
        <h2>Status</h2>
        <pre id="response-output"></pre>

        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getJsonViewerWebviewContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSON PRD Viewer</title>
        <link href="${styleUri}" rel="stylesheet" />
        <script src="${scriptUri}"></script>
    </head>
    <body>
        <div id="loader">Loading...</div>
        <div id="json-container" style="display: none;"></div>
        <script>
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('json-container');
            const loader = document.getElementById('loader');

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'renderJson') {
                    const viewer = new JsonViewer({
                        container: container,
                        data: message.data,
                        theme: 'dark',
                        expand: true
                    });
                    loader.style.display = 'none';
                    container.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>`;
}

function getGraphViewerWebviewContent(scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graph PRD Viewer</title>
        <script src="${scriptUri}"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
            #cy { width: 100%; height: 100%; display: block; }
            #loader { padding: 20px; }
            #properties-panel {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 300px;
                background: rgba(40, 40, 40, 0.9);
                color: white;
                border: 1px solid #555;
                border-radius: 8px;
                padding: 15px;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            #properties-panel h3 {
                margin-top: 0;
                border-bottom: 1px solid #666;
                padding-bottom: 10px;
            }
            #properties-content ul { list-style: none; padding: 0; margin: 0; }
            #properties-content li { margin-bottom: 8px; }
            #properties-content strong { color: #00aaff; }
            #close-panel-btn {
                background: #555;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
                width: 100%;
            }
            #close-panel-btn:hover { background: #777; }
        </style>
    </head>
    <body>
        <div id="loader">Loading Graph...</div>
        <div id="cy" style="display: none;"></div>
        <div id="properties-panel" style="display: none;">
            <h3>Node Properties</h3>
            <div id="properties-content"></div>
            <button id="close-panel-btn">Close</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const cyContainer = document.getElementById('cy');
            const loader = document.getElementById('loader');
            const propertiesPanel = document.getElementById('properties-panel');
            const propertiesContent = document.getElementById('properties-content');
            const closePanelBtn = document.getElementById('close-panel-btn');

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'renderGraph') {
                    loader.style.display = 'none';
                    cyContainer.style.display = 'block';

                    const cy = cytoscape({
                        container: cyContainer,
                        elements: message.data,
                        style: [
                            {
                                selector: 'node',
                                style: {
                                    'background-color': '#00aaff',
                                    'label': 'data(label)',
                                    'color': '#fff',
                                    'text-outline-color': '#000',
                                    'text-outline-width': 2
                                }
                            },
                            {
                                selector: 'edge',
                                style: {
                                    'width': 2,
                                    'line-color': '#666',
                                    'target-arrow-color': '#666',
                                    'target-arrow-shape': 'triangle',
                                    'curve-style': 'bezier'
                                }
                            },
                            {
                                selector: 'node:selected',
                                style: {
                                    'border-width': 3,
                                    'border-color': '#ffff00'
                                }
                            }
                        ],
                        layout: {
                            name: 'cose',
                            idealEdgeLength: 120,
                            nodeOverlap: 20,
                            refresh: 20,
                            fit: true,
                            padding: 30,
                            randomize: false,
                            componentSpacing: 100,
                            nodeRepulsion: 400000,
                            edgeElasticity: 100,
                            nestingFactor: 5,
                            gravity: 80,
                            numIter: 1000,
                            initialTemp: 200,
                            coolingFactor: 0.95,
                            minTemp: 1.0
                        }
                    });

                    cy.on('tap', 'node', function(evt){
                        const nodeData = evt.target.data();
                        let contentHtml = '<ul>';
                        for (const [key, value] of Object.entries(nodeData)) {
                            contentHtml += '<li><strong>' + key + ':</strong> ' + JSON.stringify(value, null, 2) + '</li>';
                        }
                        contentHtml += '</ul>';
                        
                        propertiesContent.innerHTML = contentHtml;
                        propertiesPanel.style.display = 'block';
                    });

                    cy.on('tap', function(evt){
                        if (evt.target === cy) {
                            propertiesPanel.style.display = 'none';
                        }
                    });

                    closePanelBtn.addEventListener('click', () => {
                        propertiesPanel.style.display = 'none';
                    });
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}
