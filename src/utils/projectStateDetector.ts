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
import * as configManager from './configManager';

// Dependencies, with defaults that can be overridden for testing
let deps = {
    getWorkspaceUri: configManager.getWorkspaceUri,
};

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
    /** Whether CCS (Code Comprehension Score) analysis exists */
    hasCCS: boolean;
    /** Array of URIs pointing to detected PRD files */
    prdFiles: vscode.Uri[];
    /** Array of URIs pointing to detected Context Card files */
    contextCardFiles: vscode.Uri[];
    /** Array of URIs pointing to detected Context Template files */
    contextTemplateFiles: vscode.Uri[];
    /** Array of URIs pointing to detected CCS analysis files */
    ccsFiles: vscode.Uri[];
    /** Number of PRD files found */
    prdCount: number;
    /** Number of context card files found */
    contextCardCount: number;
    /** Number of context template files found */
    contextTemplateCount: number;
    /** Array of URIs pointing to detected data flow diagram files */
    dataFlowDiagramFiles: Array<{ fsPath: string }>;
    /** Array of URIs pointing to detected component hierarchy files */
    componentHierarchyFiles: Array<{ fsPath: string }>;
    /** Number of CCS analysis files found */
    ccsCount: number;
    /** Whether a handover document exists */
    hasHandover: boolean;
    /** Array of URIs pointing to detected handover documents */
    handoverFiles: vscode.Uri[];
    /** Number of handover documents found */
        handoverCount: number;
    /** The workspace URI that this state was detected in. */
    workspaceUri: vscode.Uri | null;
}

/**
 * Logic Step: Main class for detecting project artifacts and determining UI state.
 * This class provides static methods to scan the workspace and identify existing
 * PRD files, Context Cards, and Context Templates.
 */
export class ProjectStateDetector {
    private static _instance: ProjectStateDetector;
    private _panel: vscode.WebviewPanel | undefined;
    private _disposables: vscode.Disposable[] = [];

    private constructor() {
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                console.log('[ProjectStateDetector] Active editor changed, re-detecting project state.');
                this.detectAndNotify();
            }
        }, null, this._disposables);
    }

    public static getInstance(): ProjectStateDetector {
        if (!ProjectStateDetector._instance) {
            ProjectStateDetector._instance = new ProjectStateDetector();
        }
        return ProjectStateDetector._instance;
    }

    public registerPanelAndDetectState(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this.detectAndNotify();
        panel.onDidDispose(() => {
            this.dispose();
        });
    }

    private async detectAndNotify() {
        if (!this._panel) {
            return;
        }

        const projectState = await this.detectProjectState();
        // CRITICAL FIX: Use 'projectState' field name to match webview expectations
        this._panel.webview.postMessage({ 
            command: 'updateState', 
            projectState: projectState,
            timestamp: Date.now(),
            source: 'project-state-detector'
        });
    }

    public dispose() {
        ProjectStateDetector._instance = undefined;
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
    /**
     * Overrides the default dependencies with mock versions for testing.
     * @param newDependencies The mock dependencies to use.
     */
        public setDependencies(newDependencies: Partial<typeof deps>) {
        deps = { ...deps, ...newDependencies };
    }

    /**
     * Logic Step: Detect the current state of generated artifacts in the workspace.
     * This is the main entry point that orchestrates the detection of all artifact types.
     * @returns ProjectState object containing detection results and file counts
     */
        public async detectProjectState(): Promise<ProjectState> {
        console.log('[ProjectStateDetector] Starting project state detection.');
        // Logic Step: Get workspace URI with multiple fallback strategies for different VS Code variants
        const workspaceUri = await deps.getWorkspaceUri();
        if (!workspaceUri) {
            console.error('[ProjectStateDetector] CRITICAL: No workspace detected. Returning empty state.');
            return this.getEmptyProjectState();
        }

        console.log(`[ProjectStateDetector] Workspace URI detected: ${workspaceUri.fsPath}`);

        console.log(`[ProjectStateDetector] Workspace URI: ${workspaceUri.fsPath}`);
        console.log(`[ProjectStateDetector] Workspace scheme: ${workspaceUri.scheme}`);
        console.log(`[ProjectStateDetector] VS Code variant: ${vscode.env.appName}`);
        console.log(`[ProjectStateDetector] VS Code version: ${vscode.version}`);

        try {
            console.log('[ProjectStateDetector] Searching for PRD files...');
            const prdFiles = await this.findPRDFiles(workspaceUri);
            console.log(`[ProjectStateDetector] Found ${prdFiles.length} PRD files.`);

            console.log('[ProjectStateDetector] Searching for Context Card files...');
            const contextCardFiles = await this.findContextCardFiles(workspaceUri);
            console.log(`[ProjectStateDetector] Found ${contextCardFiles.length} Context Card files.`);

            console.log('[ProjectStateDetector] Searching for Context Template files...');
            const contextTemplateFiles = await this.findContextTemplateFiles(workspaceUri);
            console.log(`[ProjectStateDetector] Found ${contextTemplateFiles.length} Context Template files.`);

            console.log('[ProjectStateDetector] Searching for CCS files...');
            const ccsFiles = await this.findCCSFiles(workspaceUri);
            console.log(`[ProjectStateDetector] Found ${ccsFiles.length} CCS files.`);

            console.log('[ProjectStateDetector] Searching for Handover files...');
            const handoverFiles = await this.findHandoverFiles(workspaceUri);
            console.log(`[ProjectStateDetector] Found ${handoverFiles.length} Handover files.`);

            console.log('[ProjectStateDetector] Checking for diagram files...');
            const hasDataFlowDiagram = await this.checkDiagramExists(workspaceUri, 'data-flow-diagram.json');
            const hasComponentHierarchy = await this.checkDiagramExists(workspaceUri, 'component-hierarchy-diagram.json');
            console.log(`[ProjectStateDetector] Diagram check complete. DFD: ${hasDataFlowDiagram}, CH: ${hasComponentHierarchy}`);

            const finalState = {
                hasPRD: prdFiles.length > 0,
                prdFiles,
                prdCount: prdFiles.length,
                hasContextCards: contextCardFiles.length > 0,
                contextCardFiles,
                contextCardCount: contextCardFiles.length,
                hasContextTemplates: contextTemplateFiles.length > 0,
                contextTemplateFiles,
                contextTemplateCount: contextTemplateFiles.length,
                hasDataFlowDiagram,
                hasComponentHierarchy,
                hasCCS: ccsFiles.length > 0,
                ccsFiles,
                ccsCount: ccsFiles.length,
                hasHandover: handoverFiles.length > 0,
                handoverFiles,
                            handoverCount: handoverFiles.length,
            workspaceUri,
                dataFlowDiagramFiles: hasDataFlowDiagram ? [{ fsPath: vscode.Uri.joinPath(configManager.getDiagramOutputPath(workspaceUri), 'data-flow-diagram.json').fsPath }] : [],
                componentHierarchyFiles: hasComponentHierarchy ? [{ fsPath: vscode.Uri.joinPath(configManager.getDiagramOutputPath(workspaceUri), 'component-hierarchy-diagram.json').fsPath }] : [],
            };
            console.log('[ProjectStateDetector] Final state computed:', JSON.stringify(finalState, null, 2));
            return finalState;
        } catch (error) {
            console.error('Error detecting project state:', error);
            // Return a default empty state in case of unexpected errors
            return this.getEmptyProjectState();
        }
    }

    /**
     * Logic Step: Get workspace URI with multiple fallback strategies for VS Code variants.
     * Handles different workspace configurations and VS Code variants (VS Code, Cursor, Windsurf, etc.)
     * @returns Workspace URI or null if no workspace is available
     */
        private async getWorkspaceUri(): Promise<vscode.Uri | null> {
        try {
            // Strategy 1: Standard workspace folders (works in most VS Code variants)
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                return workspaceFolders[0].uri;
            }

            // Strategy 2: Check if there's an active text editor with a file
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.scheme === 'file') {
                // Get the directory containing the active file (cross-platform)
                const activeFileUri = activeEditor.document.uri;
                const workspaceUri = vscode.Uri.joinPath(activeFileUri, '..');
                console.log('[ProjectStateDetector] Using active editor workspace fallback');
                return workspaceUri;
            }

            // Strategy 3: Try to get workspace from configuration
            const workspaceFile = vscode.workspace.workspaceFile;
            if (workspaceFile) {
                const workspaceDir = vscode.Uri.joinPath(workspaceFile, '..');
                console.log('[ProjectStateDetector] Using workspace file fallback');
                return workspaceDir;
            }

            console.log('[ProjectStateDetector] No workspace detection strategy succeeded');
            return null;
        } catch (error) {
            console.error('[ProjectStateDetector] Error in workspace detection:', error);
            return null;
        }
    }

    /**
     * Logic Step: Create a standardized empty project state.
     * Provides consistent empty state structure across all detection scenarios.
     * @returns Empty ProjectState object with all flags set to false
     */
    public static getEmptyProjectState(): ProjectState {
        return {
            hasPRD: false,
            hasContextCards: false,
            hasContextTemplates: false,
            hasDataFlowDiagram: false,
            hasComponentHierarchy: false,
            hasCCS: false,
            hasHandover: false,
            prdFiles: [],
            contextCardFiles: [],
            contextTemplateFiles: [],
            ccsFiles: [],
            handoverFiles: [],
            prdCount: 0,
            contextCardCount: 0,
            contextTemplateCount: 0,
            ccsCount: 0,
                    handoverCount: 0,
        workspaceUri: null,
            dataFlowDiagramFiles: [],
            componentHierarchyFiles: []
        };
    }

    /**
     * Logic Step: Find PRD files in the workspace by scanning common locations and patterns.
     * Searches both the mise-en-place-output directory and root directory for PRD-like files.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected PRD files
     */
        private async findPRDFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const searchPromises: Promise<vscode.Uri[]>[] = [];

        // Logic Step 1: Search in the officially configured PRD output path.
        const prdOutputPath = configManager.getPrdOutputPath(workspaceUri);
        if (prdOutputPath) {
            searchPromises.push(this.findFiles(prdOutputPath, '**/*.md'));
        }

        // Logic Step 2: For backward compatibility, explicitly check the legacy 'prd' folder at the root.
        const legacyPrdPath = vscode.Uri.joinPath(workspaceUri, 'prd');
        searchPromises.push(this.findFiles(legacyPrdPath, '**/*.md'));

        // Logic Step 3: Search in the workspace root for common PRD filenames.
        searchPromises.push(this.findFiles(workspaceUri, '{PRD.md,prd.md,product-requirements.md,ProductRequirements.md}'));

        // Logic Step 4: Execute all searches and flatten the results.
        const results = await Promise.all(searchPromises);
        const allUris = results.flat();

        // Logic Step 5: Filter for unique URIs to avoid duplicates.
        const uniqueUris = allUris.filter((uri, index, self) => 
            index === self.findIndex(u => u.fsPath === uri.fsPath)
        );

        return uniqueUris;
    }

    /**
     * Logic Step: Find Context Card files in all possible (new and legacy) directories.
     * Uses the VS Code configuration to determine the correct paths for context cards.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected Context Card files
     */
        private async findContextCardFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const pathConfig = configManager.getAllPossibleOutputPaths(workspaceUri);
        if (!pathConfig || !pathConfig.contextCards) {return [];}
        const searchPromises = pathConfig.contextCards.map(uri => this.findFiles(uri, '**/*.md'));
        return (await Promise.all(searchPromises)).flat();
    }

    /**
     * Logic Step: Find Context Template files in all possible (new and legacy) directories.
     * Uses the VS Code configuration to determine the correct paths for context templates.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected Context Template files
     */
        private async findContextTemplateFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const pathConfig = configManager.getAllPossibleOutputPaths(workspaceUri);
        if (!pathConfig || !pathConfig.contextTemplates) {return [];}
        const searchPromises = pathConfig.contextTemplates.map(uri => this.findFiles(uri, '**/*.md'));
        return (await Promise.all(searchPromises)).flat();
    }

    /**
     * Logic Step: Find CCS (Code Comprehension Score) analysis files in all possible (new and legacy) directories.
     * Uses the VS Code configuration to determine the correct path for CCS files.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected CCS analysis files
     */
        private async findCCSFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const pathConfig = configManager.getAllPossibleOutputPaths(workspaceUri);
        if (!pathConfig || !pathConfig.ccs) {return [];}
        const searchPromises = pathConfig.ccs.map(uri => this.findFiles(uri, '**/*.md'));
        return (await Promise.all(searchPromises)).flat();
    }

    /**
     * Logic Step: Find Handover files in all possible (new and legacy) directories.
     * @param workspaceUri The root URI of the current workspace
     * @returns Array of URIs pointing to detected Handover files
     */
        private async findHandoverFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const pathConfig = configManager.getAllPossibleOutputPaths(workspaceUri);
        if (!pathConfig || !pathConfig.handover) {return [];}
        const searchPromises = pathConfig.handover.map(uri => this.findFiles(uri, '**/*.md'));
        return (await Promise.all(searchPromises)).flat();
    }

    /**
     * Logic Step: Find files using a URI and pattern, with error handling.
     * @param uri The base URI to search within. If null, returns an empty array.
     * @param pattern The glob pattern to match.
     * @returns An array of found file URIs.
     */
        private async findFiles(uri: vscode.Uri | null, pattern: string): Promise<vscode.Uri[]> {
        if (!uri) {
            return [];
        }
        try {
            return await vscode.workspace.findFiles(new vscode.RelativePattern(uri, pattern), '**/node_modules/**', 1000);
        } catch (error) {
            console.error(`[ProjectStateDetector] Error finding files in ${uri.fsPath}:`, error);
            return [];
        }
    }

    /**
     * Logic Step: Check if a specific diagram file exists.
     * @param workspaceUri The root URI of the current workspace.
     * @param fileName The name of the diagram file.
     * @returns A boolean indicating if the file exists.
     */
        private async checkDiagramExists(workspaceUri: vscode.Uri, fileName: string): Promise<boolean> {
        const diagramDir = configManager.getDiagramOutputPath(workspaceUri);
        if (!diagramDir) {
            return false; // If the base directory path is null, the file can't exist.
        }

        const diagramPath = vscode.Uri.joinPath(diagramDir, fileName);
        try {
            await vscode.workspace.fs.stat(diagramPath);
            return true;
        } catch (error) {
            // File does not exist or other error, return false.
            return false;
        }
    }
}

