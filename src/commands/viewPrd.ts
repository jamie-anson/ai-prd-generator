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

        const fileUri = vscode.Uri.file(filePath);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const prdData: PrdJson = JSON.parse(Buffer.from(fileContent).toString('utf-8'));

        const panel = vscode.window.createWebviewPanel(
            `prdView-${viewType}`,
            `${prdData.title} - ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`,
            vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [context.extensionUri] }
        );

        try {
            if (viewType === 'styled') {
                panel.webview.html = getStyledPrdWebviewContent(prdData);
            } else if (viewType === 'markdown') {
                const mdPath = fileUri.fsPath.replace(/\.json$/, '.md');
                const mdContent = await vscode.workspace.fs.readFile(vscode.Uri.file(mdPath));
                panel.webview.html = getStyledMdViewerWebviewContent(Buffer.from(mdContent).toString('utf-8'));
            } else if (viewType === 'graph') {
                const cytoscapeUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape.min.js'));
                const dagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'dagre.min.js'));
                const cyDagreUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'media', 'cytoscape-dagre.js'));

                const graphData = {
                    nodes: [
                        { data: { id: 'prd', label: prdData.title, type: 'prd' } },
                        ...prdData.features.map(f => ({ data: { id: f.title.replace(/\s/g, ''), label: f.title, type: 'feature' } }))
                    ],
                    edges: [
                        ...prdData.features.map(f => ({ data: { source: 'prd', target: f.title.replace(/\s/g, ''), label: 'contains' } }))
                    ]
                };

                panel.webview.html = getGraphViewerWebviewContent(graphData, cytoscapeUri, dagreUri, cyDagreUri);
            } else {
                panel.webview.html = `<pre>${JSON.stringify(prdData, null, 2)}</pre>`;
            }
        } catch (error: any) {
            console.error('Error reading or parsing PRD file:', error);
            vscode.window.showErrorMessage(`Failed to open PRD viewer: ${error.message}`);
        }
    });

    context.subscriptions.push(command);
}
