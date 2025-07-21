// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';
import MarkdownIt = require('markdown-it');

/**
 * Defines the structure for the complete PRD output from the AI service.
 */
interface PrdJson {
    title: string;
    purpose: string;
    goals: string[];
    userRoles: string[];
    features: Array<{ id: string; title: string; requirements: string[]; }>;
    technicalRequirements: {
        frontend: { stack: string; notes: string; };
        backend: { stack: string; notes: string; };
        database: { stack: string; notes: string; };
    };
    nonFunctionalRequirements: {
        security: string;
        scalability: string;
        performance: string;
    };
    userJourneys: Record<string, string[]>;
    successMetrics: string[];
    futureEnhancements: string[];
}

interface PrdOutput {
    markdown: string;
    json: PrdJson;
    graph: any;
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
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'media')]
        });
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'main.js'));
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
                            const workspaceUri = workspaceFolders[0].uri;
                            const planningDir = vscode.Uri.joinPath(workspaceUri, 'planning');
                            await vscode.workspace.fs.createDirectory(planningDir);

                            // Sanitize title for filename
                            const prdData = prdOutput.json as { title?: string };
                            const title = prdData.title || `PRD-${new Date().toISOString().replace(/:/g, '-')}`;
                            const safeFilename = title.replace(/[\\/\?%\*:\|"<>\.]/g, '_');

                            const mdFilePath = vscode.Uri.joinPath(planningDir, `${safeFilename}.md`);
                            const jsonFilePath = vscode.Uri.joinPath(planningDir, `${safeFilename}.json`);
                            const graphFilePath = vscode.Uri.joinPath(planningDir, `${safeFilename}.graph.json`);

                            await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown));
                            await vscode.workspace.fs.writeFile(jsonFilePath, Buffer.from(JSON.stringify(prdOutput.json, null, 4)));
                            await vscode.workspace.fs.writeFile(graphFilePath, Buffer.from(JSON.stringify({ graph: prdOutput.graph }, null, 4)));

                            // Update the AI manifest
                            await updateAiManifest(context, {
                                type: 'ProductRequirementsDocument',
                                title: title,
                                formats: {
                                    markdown: vscode.workspace.asRelativePath(mdFilePath),
                                    json: vscode.workspace.asRelativePath(jsonFilePath),
                                    graph: vscode.workspace.asRelativePath(graphFilePath)
                                }
                            });

                            vscode.window.showInformationMessage(`PRD '${title}' generated successfully!`);
                            await vscode.window.showTextDocument(mdFilePath);
                            panel.webview.postMessage({ command: 'generationComplete', files: [mdFilePath.fsPath, jsonFilePath.fsPath, graphFilePath.fsPath] });

                        } else {
                            throw new Error("Received no data from API.");
                        }
                    } catch (error: any) {
                        console.error('Error generating PRD:', error);
                        const errorMessage = error.message || 'An unknown error occurred.';
                        vscode.window.showErrorMessage(`Failed to generate PRD: ${errorMessage}`);
                        panel.webview.postMessage({ command: 'error', text: `Error: ${errorMessage}` });
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
        if (!uri) {
            vscode.window.showErrorMessage('No file selected. Please right-click on a PRD file to view it.');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'prdViewer',
            'PRD Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'media')]
            }
        );

        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            if (uri.fsPath.endsWith('.graph.json')) {
                vscode.window.showInformationMessage('Opening graph viewer...');
                panel.title = 'Graph PRD';
                const fileData = JSON.parse(Buffer.from(fileContent).toString('utf8'));
                const cytoscapeUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape.min.js'));
                const dagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'dagre.min.js'));
                const cyDagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape-dagre.js'));
                panel.webview.html = getGraphViewerWebviewContent(fileData, cytoscapeUri, dagreUri, cyDagreUri);
            } else if (uri.fsPath.endsWith('.json')) {
                vscode.window.showInformationMessage('Opening styled PRD viewer...');
                panel.title = 'Styled PRD';
                const fileData = JSON.parse(Buffer.from(fileContent).toString('utf8'));
                panel.webview.html = getStyledPrdWebviewContent(fileData);
            } else if (uri.fsPath.endsWith('.md')) {
                vscode.window.showInformationMessage('Opening Markdown PRD viewer...');
                panel.title = 'Markdown PRD';
                const markdownContent = Buffer.from(fileContent).toString('utf8');
                panel.webview.html = getStyledMdViewerWebviewContent(markdownContent);
            }
        } catch (error: any) {
            console.error('Error reading or parsing PRD file:', error);
            vscode.window.showErrorMessage(`Failed to open PRD viewer: ${error.message}`);
        }
    });

    context.subscriptions.push(generatePrdCommand, setApiKeyCommand, viewPrdCommand);
}

async function callOpenAiAPI(prompt: string, apiKey: string): Promise<PrdOutput | null> {
    const openai = new OpenAI({ apiKey });
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert product manager. Based on the user's prompt, generate a comprehensive Product Requirements Document (PRD). The output must be a single, valid JSON object. Do not include any text, markdown, or explanations outside of the JSON object. The JSON object must have three top-level keys: 'markdown', 'json', and 'graph'.

1.  **'markdown'**: A string containing the full PRD in well-structured Markdown format. It must include the following sections: 1. Purpose, 2. Goals and Objectives, 3. Features and Requirements (including User Roles and Core Features), 4. Technical Requirements (Frontend, Backend, Database), 5. Non-Functional Requirements (Security, Scalability, Performance), 6. User Journey Summary (for each key role), 7. Success Metrics, 8. Future Enhancements.

2.  **'json'**: A JSON object containing the structured data of the PRD. The schema must be as follows:
    {
        "title": "String",
        "purpose": "String",
        "goals": ["String"],
        "userRoles": ["String"],
        "features": [{"id": "String", "title": "String", "requirements": ["String"]}],
        "technicalRequirements": {
            "frontend": {"stack": "String", "notes": "String"},
            "backend": {"stack": "String", "notes": "String"},
            "database": {"stack": "String", "notes": "String"}
        },
        "nonFunctionalRequirements": {
            "security": "String",
            "scalability": "String",
            "performance": "String"
        },
        "userJourneys": {"role_name": ["String"]},
        "successMetrics": ["String"],
        "futureEnhancements": ["String"]
    }

3.  **'graph'**: A JSON object with two keys, 'nodes' and 'edges', formatted for a graph visualization library like Cytoscape.js.
    *   'nodes': An array of objects. Create nodes for each User Role and each Core Feature. Each node's 'data' object must have 'id', 'label', and 'type' ('role' or 'feature').
    *   'edges': An array of objects. Connect roles to the features they interact with. Each edge's 'data' object must have 'id', 'source' (role ID), 'target' (feature ID), and a 'label' (a short verb like 'manages', 'uses', 'views').`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" },
        });

        if (response.choices && response.choices[0] && response.choices[0].message.content) {
            const content = response.choices[0].message.content;
            // The response is expected to be a stringified JSON object.
            const parsedContent: PrdOutput = JSON.parse(content);
            return parsedContent;
        }
        return null;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

function getWebviewContent(scriptUri: vscode.Uri) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PRD Generator</title>
    </head>
    <body>
        <h1>AI PRD Generator</h1>
        <textarea id="prompt-input" rows="10" cols="50" placeholder="Enter your product idea..."></textarea>
        <br>
        <button id="generate-btn">Generate PRD</button>
        <div id="status"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getJsonViewerWebviewContent(scriptUri: vscode.Uri, styleUri: vscode.Uri) {
    // This function is currently not used as the styled PRD viewer is preferred.
    // It can be implemented to show a raw JSON tree if needed.
    return `<!DOCTYPE html><html><head><link rel="stylesheet" href="${styleUri}"></head><body>JSON Viewer Here</body></html>`;
}

function getGraphViewerWebviewContent(graphData: any, cytoscapeUri: vscode.Uri, dagreUri: vscode.Uri, cyDagreUri: vscode.Uri): string {
    const nodes = JSON.stringify(graphData.graph.nodes);
    const edges = JSON.stringify(graphData.graph.edges);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Graph PRD</title>
            <script src="${cytoscapeUri}"></script>
            <script src="${dagreUri}"></script>
            <script src="${cyDagreUri}"></script>
            <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
                #cy { width: 100%; height: 100%; display: block; }
                .properties-panel { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); border: 1px solid #ccc; padding: 10px; border-radius: 5px; max-width: 300px; font-family: sans-serif; font-size: 14px; }
            </style>
        </head>
        <body>
            <div id="cy"></div>
            <div id="properties-panel" class="properties-panel" style="display:none;"></div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    try {
                        const nodes = ${nodes};
                        const edges = ${edges};
                        const propertiesPanel = document.getElementById('properties-panel');

                        const cy = cytoscape({
                            container: document.getElementById('cy'),
                            elements: {
                                nodes: nodes,
                                edges: edges
                            },
                            style: [
                                {
                                    selector: 'node',
                                    style: { 'background-color': '#666', 'label': 'data(label)', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'font-size': '12px' }
                                },
                                {
                                    selector: 'node[type = "role"]',
                                    style: { 'background-color': '#007acc' }
                                },
                                {
                                    selector: 'node[type = "feature"]',
                                    style: { 'background-color': '#5bc0de' }
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
                                        'color': '#fff',
                                        'font-size': '10px',
                                        'text-background-color': '#555',
                                        'text-background-opacity': 1,
                                        'text-background-padding': '2px',
                                        'text-margin-y': -10
                                    }
                                }
                            ],
                            layout: {
                                name: 'dagre',
                                rankDir: 'TB',
                                spacingFactor: 1.2
                            }
                        });

                        cy.on('tap', 'node', function(evt){
                            const node = evt.target;
                            const data = node.data();
                            let content = '<h3>' + data.label + '</h3>';
                            for (const key in data) {
                                if (data.hasOwnProperty(key)) {
                                    content += '<p><strong>' + key + ':</strong> ' + data[key] + '</p>';
                                }
                            }
                            propertiesPanel.innerHTML = content;
                            propertiesPanel.style.display = 'block';
                        });

                        cy.on('tap', function(evt){
                            if(evt.target === cy){
                                propertiesPanel.style.display = 'none';
                            }
                        });

                    } catch (e) {
                        console.error('Error initializing Cytoscape:', e);
                        document.body.innerHTML = '<pre>Error initializing graph. Please check the console for details. Error: ' + e.message + '</pre>';
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function getStyledPrdWebviewContent(prdData: PrdJson): string {
    const { title, purpose, goals, userRoles, features, technicalRequirements, nonFunctionalRequirements, userJourneys, successMetrics, futureEnhancements } = prdData;

    const goalsHtml = goals.map(g => `<li>${g}</li>`).join('');
    const rolesHtml = userRoles.map(r => `<li>${r}</li>`).join('');
    const featuresHtml = features.map(f => `
        <div class="feature-section">
            <h4>${f.title}</h4>
            <ul>${f.requirements.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
    `).join('');
    const journeysHtml = Object.entries(userJourneys).map(([role, steps]) => `
        <div class="feature-section">
            <h4>${role.replace(/_/g, ' ')}</h4>
            <ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
    `).join('');
    const metricsHtml = successMetrics.map(m => `<li>${m}</li>`).join('');
    const enhancementsHtml = futureEnhancements.map(e => `<li>${e}</li>`).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; line-height: 1.6; background-color: #1e1e1e; color: #d4d4d4; }
                h1, h2, h3, h4 { color: #569cd6; }
                h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                h2 { border-bottom: 1px solid #333; padding-bottom: 5px; }
                .container { max-width: 800px; margin: 0 auto; }
                .section { background-color: #252526; border: 1px solid #333; border-radius: 5px; padding: 20px; margin-bottom: 20px; }
                .feature-section { margin-bottom: 15px; }
                ul, ol { padding-left: 20px; }
                li { margin-bottom: 5px; }
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
                    <h2>Goals and Objectives</h2>
                    <ul>${goalsHtml}</ul>
                </div>

                <div class="section">
                    <h2>Features and Requirements</h2>
                    <h3>User Roles</h3>
                    <ul>${rolesHtml}</ul>
                    <h3>Core Features</h3>
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

function getStyledMdViewerWebviewContent(markdownContent: string): string {
    const md = new MarkdownIt();
    const htmlContent = md.render(markdownContent);

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
        ${htmlContent}
    </body>
    </html>`;
}

/**
 * Creates or updates an AI manifest file in the workspace to track generated artifacts.
 * @param context The extension context.
 * @param newArtifact The artifact metadata to add to the manifest.
 */
async function updateAiManifest(context: vscode.ExtensionContext, newArtifact: any) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const workspaceUri = workspaceFolders[0].uri;
    const aiDir = vscode.Uri.joinPath(workspaceUri, '.ai');
    const manifestFile = vscode.Uri.joinPath(aiDir, 'manifest.json');

    let manifest: { artifacts: any[] } = { artifacts: [] };

    try {
        await vscode.workspace.fs.createDirectory(aiDir);
        const fileContent = await vscode.workspace.fs.readFile(manifestFile);
        manifest = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
    } catch (error) {
        // Manifest doesn't exist or is invalid, start with a fresh one.
    }

    manifest.artifacts.push({
        agent: 'ai-prd-generator',
        timestamp: new Date().toISOString(),
        ...newArtifact
    });

    await vscode.workspace.fs.writeFile(manifestFile, Buffer.from(JSON.stringify(manifest, null, 4)));
}

export function deactivate() {}
