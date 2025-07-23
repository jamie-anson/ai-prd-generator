import * as vscode from 'vscode';

/**
 * Handles all view-related messages from the webview.
 * @param message The message object from the webview.
 * @param lastGeneratedPaths An object containing the URIs of the last generated PRD and graph files.
 */
export function handleViewCommands(message: any, lastGeneratedPaths: { md?: vscode.Uri, graph?: vscode.Uri } | undefined) {
    if (message.command === 'viewPrd') {
        if (lastGeneratedPaths?.md) {
            vscode.commands.executeCommand('ai-prd-generator.viewPrd', lastGeneratedPaths.md.fsPath, 'markdown');
        }
        return true; // Command was handled
    }

    if (message.command === 'viewGraph') {
        if (lastGeneratedPaths?.graph) {
            vscode.commands.executeCommand('ai-prd-generator.viewPrd', lastGeneratedPaths.graph.fsPath, 'graph');
        }
        return true; // Command was handled
    }

    return false; // Command was not a view command
}
