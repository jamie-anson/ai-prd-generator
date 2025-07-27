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
import { ProjectStateDetector } from '../../utils/projectStateDetector';
import { getPrdOutputPath } from '../../utils/configManager';

/**
 * Logic Step: Handle view-related messages from the webview.
 * This function processes view commands and opens PRD files in the appropriate format.
 * Uses ProjectStateDetector to find available PRD files dynamically.
 * @param message The message object from the webview containing the command
 * @returns Boolean indicating whether the command was handled
 */
export async function handleViewCommands(message: any): Promise<boolean> {
    // Logic Step: Get current project state to find available files
    const projectState = await ProjectStateDetector.detectProjectState();
    if (message.command === 'view-prd') {
        /**
         * Logic Step: Handle view-prd command using ProjectStateDetector.
         * Uses the first available PRD file from the detected project state.
         */
        if (projectState.hasPRD && projectState.prdFiles.length > 0) {
            const prdPath = projectState.prdFiles[0].fsPath;
            vscode.commands.executeCommand('ai-prd-generator.viewPrd', prdPath, 'markdown');
        } else {
            vscode.window.showInformationMessage('No PRD files found. Please generate a PRD first.');
        }
        return true;
    }

    if (message.command === 'view-graph') {
        /**
         * Logic Step: Handle view-graph command using ProjectStateDetector.
         * Looks for corresponding graph files based on detected PRD files.
         */
        if (projectState.hasPRD && projectState.prdFiles.length > 0) {
            // Logic Step: Find corresponding graph file for the first PRD
            const prdFile = projectState.prdFiles[0];
            const graphPath = await findCorrespondingGraphFile(prdFile);
            
            if (graphPath) {
                vscode.commands.executeCommand('ai-prd-generator.viewPrd', graphPath, 'graph');
            } else {
                vscode.window.showInformationMessage('No graph file found for this PRD.');
            }
        } else {
            vscode.window.showInformationMessage('No PRD files found. Please generate a PRD first.');
        }
        return true;
    }

    return false; // Command was not a view command
}

/**
 * Logic Step: Find the corresponding graph file for a given PRD file.
 * Looks for a .json file with the same base name as the PRD file.
 * @param prdFile The URI of the PRD file
 * @returns Promise resolving to the graph file path or undefined if not found
 */
async function findCorrespondingGraphFile(prdFile: vscode.Uri): Promise<string | undefined> {
    try {
        const prdFileName = prdFile.path.split('/').pop();
        if (!prdFileName) {
            return undefined;
        }
        
        // Logic Step: Generate expected graph file name
        const baseName = prdFileName.replace('.md', '');
        const graphFileName = `${baseName}-graph.json`;
        
        const prdDir = vscode.Uri.joinPath(prdFile, '..');
        const graphFile = vscode.Uri.joinPath(prdDir, graphFileName);
        
        // Logic Step: Check if the graph file exists
        try {
            await vscode.workspace.fs.stat(graphFile);
            return graphFile.fsPath;
        } catch {
            return undefined;
        }
    } catch (error) {
        console.error('Error finding graph file:', error);
        return undefined;
    }
}


