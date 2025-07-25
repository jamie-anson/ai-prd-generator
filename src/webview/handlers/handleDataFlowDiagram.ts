import * as vscode from 'vscode';
import { DataFlowDiagramHandler } from './baseDiagramHandler';

/**
 * Handles the generation of data flow diagrams based on a PRD.
 * @param context The extension context.
 * @param lastGeneratedPaths Paths to the previously generated PRD files (legacy parameter - unused).
 * @param webview The webview instance to send updates to.
 */
export async function handleGenerateDataFlowDiagram(context: vscode.ExtensionContext, lastGeneratedPaths: { md?: vscode.Uri } | undefined, webview?: any) {
    const handler = new DataFlowDiagramHandler();
    await handler.generateDiagram(context, webview);
}


