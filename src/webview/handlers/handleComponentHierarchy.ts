import * as vscode from 'vscode';
import { ComponentHierarchyHandler } from './baseDiagramHandler';

/**
 * Handles the generation of component hierarchy diagrams based on a PRD.
 * @param context The extension context.
 * @param lastGeneratedPaths Paths to the previously generated PRD files (legacy parameter - unused).
 * @param webview The webview instance to send updates to.
 */
export async function handleGenerateComponentHierarchy(context: vscode.ExtensionContext, lastGeneratedPaths: { md?: vscode.Uri } | undefined, webview?: any) {
    const handler = new ComponentHierarchyHandler();
    await handler.generateDiagram(context, webview);
}


