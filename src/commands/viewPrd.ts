import * as vscode from 'vscode';
import { PrdJson } from '../utils/types';
import { getStyledPrdWebviewContent, getStyledMdViewerWebviewContent, getGraphViewerWebviewContent } from '../utils/webview';

export function registerViewPrdCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('ai-prd-generator.viewPrd', async (filePath: string, viewType: 'json' | 'markdown' | 'graph' | 'styled') => {
        if (!filePath) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open.');
                return;
            }
            const prdDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'mise-en-place-output', 'prd');
            try {
                const files = await vscode.workspace.fs.readDirectory(prdDir);
                const prdFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.json')).map(f => f[0]);

                if (prdFiles.length === 0) {
                    vscode.window.showInformationMessage('No PRDs found.');
                    return;
                }

                const selectedFile = await vscode.window.showQuickPick(prdFiles, { placeHolder: 'Select a PRD to view' });
                if (!selectedFile) { return; }
                filePath = vscode.Uri.joinPath(prdDir, selectedFile).fsPath;
            } catch (e) {
                vscode.window.showInformationMessage('No PRDs have been generated yet.');
                return;
            }
        }

        const panel = vscode.window.createWebviewPanel(
            `prdView-${viewType}`,
            `PRD View - ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`,
            vscode.ViewColumn.One,
            { 
                enableScripts: true, 
                localResourceRoots: [context.extensionUri]
            }
        );

        try {
            const fileUri = vscode.Uri.file(filePath);
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const contentString = Buffer.from(fileContent).toString('utf-8');

            if (viewType === 'markdown') {
                panel.webview.html = getStyledMdViewerWebviewContent(contentString);
            } else if (viewType === 'graph') {
                const graphData = JSON.parse(contentString);
                const cytoscapeUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape.min.js'));
                const dagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'dagre.min.js'));
                const cyDagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape-dagre.js'));
                panel.webview.html = getGraphViewerWebviewContent(graphData, cytoscapeUri, dagreUri, cyDagreUri);
            } else {
                // Default to showing raw content for 'json' or 'styled' if filePath is provided directly
                const prdData: PrdJson = JSON.parse(contentString);
                if (viewType === 'styled') {
                    panel.webview.html = getStyledPrdWebviewContent(prdData);
                } else {
                    panel.webview.html = `<pre>${JSON.stringify(prdData, null, 2)}</pre>`;
                }
            }
        } catch (error: any) {
            console.error('Error reading or parsing PRD file:', error);
            vscode.window.showErrorMessage(`Failed to open PRD viewer: ${error.message}`);
        }
    });

    context.subscriptions.push(command);
}
