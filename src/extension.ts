// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';

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
    const disposable = vscode.commands.registerCommand('ai-prd-generator.generatePrd', async () => {
        // Create and show a new webview panel for the PRD generator UI.
        const panel = vscode.window.createWebviewPanel(
            'prdGenerator', // Identifies the type of the webview. Used internally.
            'PRD Generator', // Title of the panel displayed to the user.
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            { // Webview options.
                enableScripts: true, // Enable JavaScript in the webview.
                // Restrict the webview to only loading content from our extension's `src/media` directory for security.
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'media')]
            }
        );

        // Get the URI for the webview's script and set the initial HTML content.
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'main.js'));
        panel.webview.html = getWebviewContent(scriptUri);

        // Listen for messages sent from the webview UI.
        panel.webview.onDidReceiveMessage(
            async message => {
                // If the message command is 'generate', start the PRD generation process.
                if (message.command === 'generate') {
                    // Show a progress notification to the user while generating the PRD.
                    vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Generating PRD...",
                        cancellable: false
                    }, async (progress) => {
                        progress.report({ increment: 0, message: "Calling AI..." });

                        // Retrieve the OpenAI API key from secure storage.
                        const apiKey = await context.secrets.get('openAiApiKey');

                        // Ensure the API key is set.
                        if (!apiKey) {
                            vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
                            panel.webview.postMessage({ command: 'error', text: 'API Key is not set.' });
                            return;
                        }

                        // Ensure a workspace folder is open to save the files.
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders || workspaceFolders.length === 0) {
                            vscode.window.showErrorMessage('No workspace folder found. Please open a folder to save PRD files.');
                            panel.webview.postMessage({ command: 'error', text: 'No workspace folder selected.' });
                            return;
                        }

                        try {
                            // Call the OpenAI API with the user's prompt.
                            const prdOutput = await callOpenAiAPI(message.text, apiKey);
                            progress.report({ increment: 50, message: "Saving files..." });

                            if (prdOutput) {
                                // Define file paths for the generated outputs.
                                const folderUri = workspaceFolders[0].uri;
                                const timestamp = new Date().getTime();
                                const mdPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.md`);
                                const jsonPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.json`);
                                const graphPath = vscode.Uri.joinPath(folderUri, `PRD-${timestamp}.graph.json`);

                                // Write the generated content to files.
                                await vscode.workspace.fs.writeFile(mdPath, Buffer.from(prdOutput.markdown, 'utf8'));
                                await vscode.workspace.fs.writeFile(jsonPath, Buffer.from(JSON.stringify(prdOutput.json, null, 2), 'utf8'));
                                await vscode.workspace.fs.writeFile(graphPath, Buffer.from(JSON.stringify(prdOutput.graph, null, 2), 'utf8'));

                                vscode.window.showInformationMessage(`Successfully generated PRD files!`);
                                // Notify the webview that generation is complete.
                                panel.webview.postMessage({ command: 'generationComplete', files: [mdPath.fsPath, jsonPath.fsPath, graphPath.fsPath] });
                            } else {
                                throw new Error('Received empty response from API.');
                            }
                        } catch (error: any) {
                            console.error('Error during PRD generation or file saving:', error);
                            // Display the specific error message to the user in the webview.
                            panel.webview.postMessage({ command: 'error', text: error.message });
                        }
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    });

    // Register the command to view the generated JSON PRD.
    const viewJsonPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewJsonPrd', async () => {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select PRD JSON File',
            filters: { 'JSON files': ['json'] }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
            const panel = vscode.window.createWebviewPanel(
                'jsonPrdViewer',
                'Interactive PRD Viewer',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'json-viewer.js'));
            const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'styles.css'));
            panel.webview.html = getJsonViewerWebviewContent(scriptUri, styleUri);
            panel.webview.postMessage({ command: 'renderJson', data: JSON.parse(fileContent.toString()) });
        }
    });

    // Register the command to view the generated graph PRD.
    const viewGraphPrdCommand = vscode.commands.registerCommand('ai-prd-generator.viewGraphPrd', async () => {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select PRD Graph File',
            filters: { 'Graph JSON files': ['graph.json'] }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
            const panel = vscode.window.createWebviewPanel(
                'graphPrdViewer',
                'Interactive Graph Viewer',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'media', 'cytoscape.min.js'));
            panel.webview.html = getGraphViewerWebviewContent(scriptUri);
            panel.webview.postMessage({ command: 'renderGraph', data: JSON.parse(fileContent.toString()) });
        }
    });

    // Register the command to set the OpenAI API key.
    const setOpenAiApiKeyCommand = vscode.commands.registerCommand('ai-prd-generator.setOpenAiApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API Key',
            password: true,
            ignoreFocusOut: true
        });

        if (apiKey) {
            // Store the API key securely.
            await context.secrets.store('openAiApiKey', apiKey);
            vscode.window.showInformationMessage('OpenAI API Key saved successfully!');
        } else {
            vscode.window.showWarningMessage('API Key was not entered.');
        }
    });

    // Add all command subscriptions to the context.
    context.subscriptions.push(disposable, viewJsonPrdCommand, viewGraphPrdCommand, setOpenAiApiKeyCommand);
}

/**
 * Calls the OpenAI API to generate the PRD content.
 * @param prompt The user's product idea.
 * @param apiKey The user's OpenAI API key.
 * @returns A promise that resolves to the structured PRD output, or null if an error occurs.
 */
async function callOpenAiAPI(prompt: string, apiKey: string): Promise<PrdOutput | null> {
    const openai = new OpenAI({ apiKey });

    // System prompt to guide the AI's response, including the required JSON schema.
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
        // Create the chat completion request.
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo', // Specify the model.
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `**Product Idea:**\n${prompt}` }
            ],
            response_format: { type: 'json_object' }, // Enforce JSON mode.
        });

        const jsonContent = response.choices[0].message.content;
        if (!jsonContent) {
            throw new Error('API returned empty content.');
        }

        // Parse and return the structured JSON content.
        return JSON.parse(jsonContent) as PrdOutput;

    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);
        throw new Error(`API Error: ${error.message}`);
    }
}

/**
 * Generates the HTML content for the main PRD generator webview.
 * @param scriptUri The URI of the main JavaScript file for the webview.
 * @returns The HTML content as a string.
 */
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
        <textarea id="product-idea" rows="10" cols="80" placeholder="Enter your product idea here..."></textarea>
        <br>
        <button id="generate-btn">Generate PRD</button>
        <div id="status"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

/**
 * Generates the HTML content for the interactive JSON viewer webview.
 * @param scriptUri The URI of the JavaScript file for the JSON viewer.
 * @param styleUri The URI of the CSS file for the JSON viewer.
 * @returns The HTML content as a string.
 */
function getJsonViewerWebviewContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interactive PRD Viewer</title>
        <link rel="stylesheet" href="${styleUri}">
    </head>
    <body>
        <div id="loader">Loading...</div>
        <div id="json-viewer"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

/**
 * Generates the HTML content for the interactive graph viewer webview.
 * @param scriptUri The URI of the Cytoscape.js library.
 * @returns The HTML content as a string.
 */
function getGraphViewerWebviewContent(scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interactive Graph Viewer</title>
        <script src="${scriptUri}"></script>
        <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: sans-serif; }
            #cy { width: 100%; height: 100%; display: block; }
            #loader { font-size: 2em; text-align: center; padding-top: 20%; }
            #properties-panel { position: absolute; top: 10px; right: 10px; width: 300px; max-height: 90%; overflow-y: auto; background: rgba(255, 255, 255, 0.9); border: 1px solid #ccc; border-radius: 5px; display: none; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
            #properties-header { padding: 10px; background: #f0f0f0; border-bottom: 1px solid #ccc; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
            #properties-content { padding: 10px; }
            #close-panel-btn { background: none; border: none; font-size: 1.2em; cursor: pointer; }
            ul { list-style: none; padding: 0; margin: 0; }
            li { margin-bottom: 5px; word-break: break-all; }
        </style>
    </head>
    <body>
        <div id="loader">Loading Graph...</div>
        <div id="cy" style="display: none;"></div>
        <div id="properties-panel">
            <div id="properties-header">
                <span>Node Properties</span>
                <button id="close-panel-btn">&times;</button>
            </div>
            <div id="properties-content"></div>
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

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {}
