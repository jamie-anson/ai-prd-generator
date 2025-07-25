import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Handles viewing the data flow diagram in a visual webview with Mermaid rendering.
 * @param context The extension context.
 */
export async function handleViewDataFlowDiagram(context: vscode.ExtensionContext) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // Get the configured path or use default
        const config = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
        const outputPath = config.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
        
        const diagramPath = vscode.Uri.joinPath(workspaceFolders[0].uri, outputPath, 'data_flow_diagram.md');
        
        // Check if file exists
        try {
            await vscode.workspace.fs.stat(diagramPath);
        } catch (error) {
            vscode.window.showErrorMessage('Data flow diagram not found. Please generate it first.');
            return;
        }

        // Open the diagram in a visual webview with Mermaid rendering
        vscode.commands.executeCommand('ai-prd-generator.viewDiagram', diagramPath.fsPath, 'data-flow');
        
    } catch (error: any) {
        console.error('Error viewing data flow diagram:', error);
        vscode.window.showErrorMessage(`Failed to open data flow diagram: ${error.message}`);
    }
}

/**
 * Handles viewing the component hierarchy diagram in a visual webview with Mermaid rendering.
 * @param context The extension context.
 */
export async function handleViewComponentHierarchy(context: vscode.ExtensionContext) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // Get the configured path or use default
        const config = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
        const outputPath = config.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
        
        const diagramPath = vscode.Uri.joinPath(workspaceFolders[0].uri, outputPath, 'component_hierarchy.md');
        
        // Check if file exists
        try {
            await vscode.workspace.fs.stat(diagramPath);
        } catch (error) {
            vscode.window.showErrorMessage('Component hierarchy diagram not found. Please generate it first.');
            return;
        }

        // Open the diagram in a visual webview with Mermaid rendering
        vscode.commands.executeCommand('ai-prd-generator.viewDiagram', diagramPath.fsPath, 'component-hierarchy');
        
    } catch (error: any) {
        console.error('Error viewing component hierarchy diagram:', error);
        vscode.window.showErrorMessage(`Failed to open component hierarchy diagram: ${error.message}`);
    }
}
