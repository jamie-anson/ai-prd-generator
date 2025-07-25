// @ts-nocheck
/**
 * @file projectStateDetector.ts
 * @description Detects existing artifacts in the project to enable context-aware UI behavior.
 * 
 * The logic of this file is to:
 * 1. Scan the workspace for existing PRD files, Context Cards, and Context Templates.
 * 2. Provide a comprehensive project state object that indicates which artifacts exist.
 * 3. Enable the webview UI to show only relevant sections based on detected artifacts.
 * 4. Support user-configured paths and common file patterns for artifact detection.
 */

import * as vscode from 'vscode';
import { getPrdOutputPath, getContextCardOutputPath, getContextTemplateOutputPath, getDiagramOutputPath } from './configManager';

/**
 * Interface representing the current state of generated artifacts in the project.
 * Used by the webview UI to determine which sections to show or hide.
 */
export interface ProjectState {
    /** Whether any PRD files exist in the project */
    hasPRD: boolean;
    /** Whether any Context Card files exist in the project */
    hasContextCards: boolean;
    /** Whether any Context Template files exist in the project */
    hasContextTemplates: boolean;
    /** Whether data flow diagram exists */
    hasDataFlowDiagram: boolean;
    /** Whether component hierarchy diagram exists */
    hasComponentHierarchy: boolean;
    /** Array of URIs pointing to detected PRD files */
    prdFiles: vscode.Uri[];
    /** Array of URIs pointing to detected Context Card files */
    contextCardFiles: vscode.Uri[];
    /** Array of URIs pointing to detected Context Template files */
    contextTemplateFiles: vscode.Uri[];
}

/**
 * Logic Step: Main class for detecting project artifacts and determining UI state.
 * This class provides static methods to scan the workspace and identify existing
 * PRD files, Context Cards, and Context Templates.
 */
export class ProjectStateDetector {
    /**
     * Logic Step: Detect the current state of generated artifacts in the workspace.
     * This is the main entry point that orchestrates the detection of all artifact types.
     * @returns ProjectState object containing detection results and file counts
     */
    public static async detectProjectState(): Promise<ProjectState> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return {
                hasPRD: false,
                hasContextCards: false,
                hasContextTemplates: false,
                hasDataFlowDiagram: false,
                hasComponentHierarchy: false,
                prdFiles: [],
                contextCardFiles: [],
                contextTemplateFiles: []
            };
        }

        const workspaceUri = workspaceFolders[0].uri;
        
        // Detect PRD files
        const prdFiles = await this.findPRDFiles(workspaceUri);
        
        // Detect Context Cards
        const contextCardFiles = await this.findContextCardFiles(workspaceUri);
        
        // Detect Context Templates
        const contextTemplateFiles = await this.findContextTemplateFiles(workspaceUri);

        // Detect diagram files
        // Logic Step: Detect diagram files in the context templates directory
        const hasDataFlowDiagram = await this.checkDiagramExists(workspaceUri, 'data_flow_diagram.md');
        const hasComponentHierarchy = await this.checkDiagramExists(workspaceUri, 'component_hierarchy.md');
        
        /**
         * Logic Step: Log diagram detection results for debugging.
         * These debug logs help diagnose UI state issues where diagram files exist
         * but buttons don't switch from "Generate" to "View" mode. Can be removed
         * in production once diagram detection is stable.
         */
        console.log(`[ProjectStateDetector] Detection results:`);
        console.log(`[ProjectStateDetector] - hasDataFlowDiagram: ${hasDataFlowDiagram}`);
        console.log(`[ProjectStateDetector] - hasComponentHierarchy: ${hasComponentHierarchy}`);

        return {
            hasPRD: prdFiles.length > 0,
            hasContextCards: contextCardFiles.length > 0,
            hasContextTemplates: contextTemplateFiles.length > 0,
            hasDataFlowDiagram,
            hasComponentHierarchy,
            prdFiles,
            contextCardFiles,
            contextTemplateFiles
        };
    }

    /**
     * Logic Step: Find PRD files in the workspace by scanning common locations and patterns.
     * Searches both the mise-en-place-output directory and root directory for PRD-like files.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected PRD files
     */
    private static async findPRDFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const prdFiles: vscode.Uri[] = [];

        try {
            // Check configured PRD output directory and its subdirectories
            const outputDir = getPrdOutputPath(workspaceUri);
            const outputFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(outputDir, '**/*.md'),  // Search recursively
                null,
                100
            );
            
            // Filter for PRD-like files
            for (const file of outputFiles) {
                const fileName = file.fsPath.toLowerCase();
                if (fileName.includes('prd') || fileName.includes('product-requirements')) {
                    prdFiles.push(file);
                }
            }

            // Also check root directory for common PRD file names
            const rootPrdFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceUri, '{PRD.md,prd.md,product-requirements.md,ProductRequirements.md}'),
                '**/node_modules/**',
                10
            );
            prdFiles.push(...rootPrdFiles);

        } catch (error) {
            console.log('Error finding PRD files:', error);
        }

        return prdFiles;
    }

    /**
     * Logic Step: Find Context Card files in the user-configured or default directory.
     * Uses the VS Code configuration to determine the correct path for context cards.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected Context Card files
     */
    private static async findContextCardFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        try {
            // Get user-configured path using configuration manager
            
            const contextCardDir = getContextCardOutputPath(workspaceUri);
            const contextCardFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(contextCardDir, '*.md'),
                null,
                1000
            );

            return contextCardFiles;
        } catch (error) {
            console.log('Error finding context card files:', error);
            return [];
        }
    }

    /**
     * Logic Step: Find Context Template files in the user-configured or default directory.
     * Uses the VS Code configuration to determine the correct path for context templates.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected Context Template files
     */
    private static async findContextTemplateFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        try {
            // Get user-configured path using configuration manager
            
            const contextTemplateDir = getContextTemplateOutputPath(workspaceUri);
            const contextTemplateFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(contextTemplateDir, '*.md'),
                null,
                1000
            );

            return contextTemplateFiles;
        } catch (error) {
            console.log('Error finding context template files:', error);
            return [];
        }
    }

    /**
     * Logic Step: Check if a specific diagram file exists in the context templates directory.
     * @param workspaceUri The root URI of the current workspace
     * @param fileName The name of the diagram file to check for
     * @returns Boolean indicating whether the diagram file exists
     */
    private static async checkDiagramExists(workspaceUri: vscode.Uri, fileName: string): Promise<boolean> {
        try {
            // Get user-configured path using configuration manager
            
            const diagramDir = getDiagramOutputPath(workspaceUri);
            const diagramPath = vscode.Uri.joinPath(diagramDir, fileName);
            
            /**
             * Logic Step: Debug logging for diagram file detection.
             * These logs help diagnose path resolution and file existence issues
             * when diagram files exist but aren't being detected by the UI.
             */
            console.log(`[ProjectStateDetector] Checking diagram: ${fileName}`);
            console.log(`[ProjectStateDetector] Full path: ${diagramPath.fsPath}`);
            
            // Check if file exists
            await vscode.workspace.fs.stat(diagramPath);
            console.log(`[ProjectStateDetector] ✅ Found diagram: ${fileName}`);
            return true;
        } catch (error) {
            console.log(`[ProjectStateDetector] ❌ Diagram not found: ${fileName} - ${error}`);
            return false;
        }
    }
}
