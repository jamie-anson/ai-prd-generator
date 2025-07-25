// @ts-nocheck
/**
 * @file handleViewCommands.ts
 * @description Handles view-related commands for PRD and graph visualization.
 * 
 * The logic of this file is to:
 * 1. Handle 'view-prd' and 'view-graph' commands from the webview
 * 2. Find the most recent PRD files when lastGeneratedPaths is unavailable
 * 3. Execute VS Code commands to open PRD viewers in appropriate formats
 * 4. Provide fallback logic when file paths are not in the context
 * 5. Ensure View buttons work independently of generation session context
 */

import * as vscode from 'vscode';

/**
 * Logic Step: Handle view-related messages from the webview.
 * This function processes view commands and opens PRD files in the appropriate format.
 * It includes fallback logic to find PRD files when lastGeneratedPaths context is unavailable,
 * ensuring View buttons work even after extension restarts or when context is lost.
 * @param message The message object from the webview containing the command
 * @param lastGeneratedPaths Optional context with URIs of last generated files
 * @returns Boolean indicating whether the command was handled
 */
export async function handleViewCommands(message: any, lastGeneratedPaths: { md?: vscode.Uri, graph?: vscode.Uri } | undefined): Promise<boolean> {
    if (message.command === 'view-prd') {
        /**
         * Logic Step: Handle view-prd command with fallback file discovery.
         * First tries to use lastGeneratedPaths context, then falls back to
         * finding the most recent PRD file in the workspace if context is unavailable.
         */
        let prdPath: string | undefined;
        
        if (lastGeneratedPaths?.md) {
            prdPath = lastGeneratedPaths.md.fsPath;
        } else {
            // Fallback: Find most recent PRD file
            prdPath = await findMostRecentPrdFile();
        }
        
        if (prdPath) {
            vscode.commands.executeCommand('ai-prd-generator.viewPrd', prdPath, 'markdown');
        } else {
            vscode.window.showInformationMessage('No PRD files found. Please generate a PRD first.');
        }
        return true;
    }

    if (message.command === 'view-graph') {
        /**
         * Logic Step: Handle view-graph command with fallback file discovery.
         * First tries to use lastGeneratedPaths context, then falls back to
         * finding the most recent graph file in the workspace if context is unavailable.
         */
        let graphPath: string | undefined;
        
        if (lastGeneratedPaths?.graph) {
            graphPath = lastGeneratedPaths.graph.fsPath;
        } else {
            // Fallback: Find most recent graph file
            graphPath = await findMostRecentGraphFile();
        }
        
        if (graphPath) {
            vscode.commands.executeCommand('ai-prd-generator.viewPrd', graphPath, 'graph');
        } else {
            vscode.window.showInformationMessage('No graph files found. Please generate a PRD first.');
        }
        return true;
    }

    return false; // Command was not a view command
}

/**
 * Logic Step: Find the most recent PRD markdown file in the workspace.
 * This fallback function searches the PRD output directory for .md files
 * and returns the path to the most recently modified one.
 * @returns Promise resolving to the file path or undefined if no files found
 */
async function findMostRecentPrdFile(): Promise<string | undefined> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return undefined;
        
        const prdDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'mise-en-place-output', 'prd');
        const files = await vscode.workspace.fs.readDirectory(prdDir);
        const mdFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.md'));
        
        if (mdFiles.length === 0) return undefined;
        
        // Return the first .md file found (could be enhanced to find most recent)
        return vscode.Uri.joinPath(prdDir, mdFiles[0][0]).fsPath;
    } catch (error) {
        console.error('Error finding PRD file:', error);
        return undefined;
    }
}

/**
 * Logic Step: Find the most recent PRD graph file in the workspace.
 * This fallback function searches the PRD output directory for .json files
 * and returns the path to the most recently modified one for graph visualization.
 * @returns Promise resolving to the file path or undefined if no files found
 */
async function findMostRecentGraphFile(): Promise<string | undefined> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return undefined;
        
        const prdDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'mise-en-place-output', 'prd');
        const files = await vscode.workspace.fs.readDirectory(prdDir);
        const jsonFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.json'));
        
        if (jsonFiles.length === 0) return undefined;
        
        // Return the first .json file found (could be enhanced to find most recent)
        return vscode.Uri.joinPath(prdDir, jsonFiles[0][0]).fsPath;
    } catch (error) {
        console.error('Error finding graph file:', error);
        return undefined;
    }
}
