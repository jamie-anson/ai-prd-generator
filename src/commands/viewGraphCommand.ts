import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getGraphViewerWebviewContent } from '../utils/webviews/graphView';

let graphPanel: vscode.WebviewPanel | undefined;

/**
 * Registers the command to view a generated PRD graph.
 * @param context The extension context.
 */
export function registerViewGraphCommand(context: vscode.ExtensionContext) {
    const command = 'ai-prd-generator.viewGraph';

    const commandHandler = (fileUri: vscode.Uri) => {
        const filePath = fileUri.fsPath;

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const graphData = JSON.parse(fileContent);

            const onDiskPath = (p: string) => vscode.Uri.file(path.join(context.extensionPath, p));

            const getWebviewUri = (p: string) => {
                if (graphPanel) {
                    return graphPanel.webview.asWebviewUri(onDiskPath(p));
                }
                return vscode.Uri.file(''); // Should not happen
            };

            if (graphPanel) {
                graphPanel.reveal(vscode.ViewColumn.Beside);
            } else {
                graphPanel = vscode.window.createWebviewPanel(
                    'graphView',
                    `Graph: ${path.basename(filePath)}`,
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'node_modules')]
                    }
                );

                graphPanel.onDidDispose(() => {
                    graphPanel = undefined;
                }, null, context.subscriptions);
            }

            const cytoscapeUri = getWebviewUri('node_modules/cytoscape/dist/cytoscape.min.js');
            const dagreUri = getWebviewUri('node_modules/dagre/dist/dagre.min.js');
            const cyDagreUri = getWebviewUri('node_modules/cytoscape-dagre/cytoscape-dagre.js');

            graphPanel.webview.html = getGraphViewerWebviewContent(graphData, cytoscapeUri, dagreUri, cyDagreUri);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to read or render graph: ${error.message}`);
        }
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}
