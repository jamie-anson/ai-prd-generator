// @ts-nocheck
/**
 * @file configManager.ts
 * @description Centralized configuration management for the AI PRD Generator extension.
 * 
 * The logic of this file is to:
 * 1. Provide a single source of truth for all extension configuration values
 * 2. Handle VS Code workspace configuration access with type safety
 * 3. Provide default values and validation for configuration options
 * 4. Support dynamic configuration updates and caching
 * 5. Eliminate hardcoded paths and values throughout the codebase
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Interface defining all configuration options for the extension
 */
export interface ExtensionConfig {
    openAiModel: string;
    prdOutputPath: string;
    contextCardOutputPath: string;
    contextTemplateOutputPath: string;
    ccsOutputPath: string;
    handoverOutputPath: string;
}

/**
 * Default configuration values used as fallbacks
 * Updated to match button names for consistency
 */
const DEFAULT_CONFIG: ExtensionConfig = {
    openAiModel: 'gpt-4o',
    prdOutputPath: 'mise-en-place-output/prd',
    contextCardOutputPath: 'mise-en-place-output/dev-guidelines',
    contextTemplateOutputPath: 'mise-en-place-output/code-templates',
    ccsOutputPath: 'mise-en-place-output/ccs-score',
    handoverOutputPath: 'mise-en-place-output/handover-document'
};

/**
 * Legacy folder names for backward compatibility
 */
const LEGACY_FOLDER_NAMES = {
    contextCards: ['context-cards', 'development-guidelines', 'dev-guidelines'],
    contextTemplates: ['context-templates', 'code-templates'],
    ccs: ['ccs', 'ccs-score'],
    handover: ['handover', 'handover-document']
};

/**
 * Configuration keys mapping to VS Code settings
 */
const CONFIG_KEYS = {
    openAiModel: 'aiPrdGenerator.openAiModel',
    prdOutputPath: 'aiPrdGenerator.prdOutput.prdPath',
    contextCardOutputPath: 'aiPrdGenerator.contextCardOutput.contextCardPath',
    contextTemplateOutputPath: 'aiPrdGenerator.contextTemplateOutput.contextTemplatePath',
    ccsOutputPath: 'aiPrdGenerator.ccsOutput.ccsPath',
    handoverOutputPath: 'aiPrdGenerator.handoverOutput.handoverPath'
} as const;

/**
 * Logic Step: Get the active workspace URI.
 * Works with any workspace - no specific folder requirements.
 * @returns The URI of the current workspace folder.
 */
export function getWorkspaceUri(): vscode.Uri | null {
    // First, check if we have any workspace folders at all
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        console.warn('[ConfigManager] No workspace folder found.');
        return null;
    }
    
    // Log all available workspaces for debugging
    console.log(`[ConfigManager] Available workspaces (${vscode.workspace.workspaceFolders.length}):`);
    vscode.workspace.workspaceFolders.forEach((folder, index) => {
        console.log(`[ConfigManager]   ${index}: ${folder.uri.fsPath}`);
    });
    
    // Priority 1: Use the active text editor to find the relevant workspace.
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        console.log(`[ConfigManager] Checking active editor: ${activeEditor.document.uri.fsPath}`);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
        if (workspaceFolder) {
            console.log(`[ConfigManager] ✅ Using active editor workspace: ${workspaceFolder.uri.fsPath}`);
            return workspaceFolder.uri;
        }
    }

    // Priority 2: Use the first workspace folder (works for any project)
    const firstWorkspace = vscode.workspace.workspaceFolders[0];
    console.log(`[ConfigManager] ✅ Using first workspace: ${firstWorkspace.uri.fsPath}`);
    return firstWorkspace.uri;
}

/**
 * Logic Step: Get the complete extension configuration with defaults.
 * This function retrieves all configuration values from VS Code settings,
 * applying defaults for any missing values to ensure consistent behavior.
 * @returns Complete extension configuration object
 */
export function getExtensionConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration();
    
    return {
        openAiModel: config.get<string>(CONFIG_KEYS.openAiModel) || DEFAULT_CONFIG.openAiModel,
        prdOutputPath: config.get<string>(CONFIG_KEYS.prdOutputPath) || DEFAULT_CONFIG.prdOutputPath,
        contextCardOutputPath: config.get<string>(CONFIG_KEYS.contextCardOutputPath) || DEFAULT_CONFIG.contextCardOutputPath,
        contextTemplateOutputPath: config.get<string>(CONFIG_KEYS.contextTemplateOutputPath) || DEFAULT_CONFIG.contextTemplateOutputPath,
        ccsOutputPath: config.get<string>(CONFIG_KEYS.ccsOutputPath) || DEFAULT_CONFIG.ccsOutputPath,
        handoverOutputPath: config.get<string>(CONFIG_KEYS.handoverOutputPath) || DEFAULT_CONFIG.handoverOutputPath
    };
}

/**
 * Logic Step: Get the OpenAI model configuration.
 * Retrieves the configured OpenAI model with fallback to default
 * @returns The OpenAI model string to use for API calls
 */
export function getOpenAiModel(): string {
    const config = vscode.workspace.getConfiguration();
    return config.get<string>(CONFIG_KEYS.openAiModel) || DEFAULT_CONFIG.openAiModel;
}

/**
 * Logic Step: Get the PRD output directory path.
 * Returns the configured path for PRD file output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for PRD output directory
 */
export function getPrdOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const config = vscode.workspace.getConfiguration();
        const prdPath = config.get<string>(CONFIG_KEYS.prdOutputPath) || DEFAULT_CONFIG.prdOutputPath;
        const baseUri = workspaceUri || getWorkspaceUri();
        return vscode.Uri.joinPath(baseUri, prdPath);
    } catch (error) {
        return null;
    }
}

/**
 * Logic Step: Get the context cards output directory path.
 * Returns the configured path for context card output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for context cards output directory
 */
export function getContextCardOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const config = vscode.workspace.getConfiguration();
        const cardPath = config.get<string>(CONFIG_KEYS.contextCardOutputPath) || DEFAULT_CONFIG.contextCardOutputPath;
        const baseUri = workspaceUri || getWorkspaceUri();
        return vscode.Uri.joinPath(baseUri, cardPath);
    } catch (error) {
        return null;
    }
}

/**
 * Logic Step: Get the context templates output directory path.
 * Returns the configured path for context template output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for context templates output directory
 */
export function getContextTemplateOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const config = vscode.workspace.getConfiguration();
        const templatePath = config.get<string>(CONFIG_KEYS.contextTemplateOutputPath) || DEFAULT_CONFIG.contextTemplateOutputPath;
        const baseUri = workspaceUri || getWorkspaceUri();
        return vscode.Uri.joinPath(baseUri, templatePath);
    } catch (error) {
        return null;
    }
}

/**
 * Logic Step: Get the CCS (Code Comprehension Score) output directory path.
 * Returns the configured path for CCS analysis output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for CCS output directory
 */
export function getHandoverOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const config = vscode.workspace.getConfiguration();
        const handoverPath = config.get<string>(CONFIG_KEYS.handoverOutputPath) || DEFAULT_CONFIG.handoverOutputPath;
        const baseUri = workspaceUri || getWorkspaceUri();
        return vscode.Uri.joinPath(baseUri, handoverPath);
    } catch (error) {
        return null;
    }
}

export function getCcsOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const config = vscode.workspace.getConfiguration();
        const ccsPath = config.get<string>(CONFIG_KEYS.ccsOutputPath) || DEFAULT_CONFIG.ccsOutputPath;
        const baseUri = workspaceUri || getWorkspaceUri();
        return vscode.Uri.joinPath(baseUri, ccsPath);
    } catch (error) {
        return null;
    }
}

/**
 * Logic Step: Get output directory for diagram files.
 * Returns the path where diagram files (data flow, component hierarchy) should be stored
 * Uses a dedicated diagrams folder for better organization
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for diagram output directory
 */
export function getDiagramOutputPath(workspaceUri?: vscode.Uri): vscode.Uri | null {
    try {
        const baseUri = workspaceUri || getWorkspaceUri();
        // Diagrams have a dedicated, non-configurable subfolder for better organization
        return vscode.Uri.joinPath(baseUri, 'mise-en-place-output', 'diagrams');
    } catch (error) {
        return null;
    }
}

/**
 * Logic Step: Get all possible folder names for a given artifact type.
 * Returns both current and legacy folder names for backward compatibility
 * @param artifactType The type of artifact (contextCards, contextTemplates, etc.)
 * @returns Array of possible folder names to check
 */
export function getPossibleFolderNames(artifactType: keyof typeof LEGACY_FOLDER_NAMES): string[] {
    return LEGACY_FOLDER_NAMES[artifactType];
}

/**
 * Logic Step: Check if a folder path matches any known patterns for an artifact type.
 * Supports both current and legacy folder naming conventions
 * @param folderPath The folder path to check
 * @param artifactType The artifact type to match against
 * @returns True if the folder path matches the artifact type
 */
export function isFolderForArtifactType(folderPath: string, artifactType: keyof typeof LEGACY_FOLDER_NAMES): boolean {
    const possibleNames = getPossibleFolderNames(artifactType);
    const folderName = path.basename(folderPath);
    return possibleNames.includes(folderName);
}

/**
 * Logic Step: Ensure output directory exists.
 * Creates the specified directory if it doesn't exist, including parent directories
 * @param outputPath The URI of the directory to create
 */
export async function ensureOutputDirectory(outputPath: vscode.Uri): Promise<void> {
    try {
        await vscode.workspace.fs.stat(outputPath);
    } catch (error) {
        // Directory doesn't exist, create it
        await vscode.workspace.fs.createDirectory(outputPath);
    }
}

/**
 * Logic Step: Get all configured output paths.
 * Returns an object containing all output directory paths for easy access
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Object containing all output directory URIs
 */
export function getAllOutputPaths(workspaceUri?: vscode.Uri): {
    prd: vscode.Uri;
    contextCards: vscode.Uri;
    contextTemplates: vscode.Uri;
    diagrams: vscode.Uri;
    ccs: vscode.Uri;
    handover: vscode.Uri;
} {
    return {
        prd: getPrdOutputPath(workspaceUri),
        contextCards: getContextCardOutputPath(workspaceUri),
        contextTemplates: getContextTemplateOutputPath(workspaceUri),
        diagrams: getDiagramOutputPath(workspaceUri),
        ccs: getCcsOutputPath(workspaceUri),
        handover: getHandoverOutputPath(workspaceUri)
    };
}

/**
 * Logic Step: Get all possible output paths including legacy locations.
 * Returns arrays of possible paths to check for backward compatibility
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Object containing arrays of possible paths for each artifact type
 */
export function getAllPossibleOutputPaths(workspaceUri?: vscode.Uri): {
    contextCards: vscode.Uri[];
    contextTemplates: vscode.Uri[];
    ccs: vscode.Uri[];
    handover: vscode.Uri[];
} {
    const baseUri = workspaceUri || getWorkspaceUri();
    
    if (!baseUri) {
        return {
            contextCards: [],
            contextTemplates: [],
            ccs: [],
            handover: []
        };
    }

    return {
        contextCards: LEGACY_FOLDER_NAMES.contextCards.map(name => 
            vscode.Uri.joinPath(baseUri, 'mise-en-place-output', name)
        ),
        contextTemplates: LEGACY_FOLDER_NAMES.contextTemplates.map(name => 
            vscode.Uri.joinPath(baseUri, 'mise-en-place-output', name)
        ),
        ccs: LEGACY_FOLDER_NAMES.ccs.map(name => 
            vscode.Uri.joinPath(baseUri, 'mise-en-place-output', name)
        ),
        handover: LEGACY_FOLDER_NAMES.handover.map(name => 
            vscode.Uri.joinPath(baseUri, 'mise-en-place-output', name)
        )
    };
}

/**
 * Logic Step: Validate configuration values.
 * Checks that all required configuration values are present and valid
 * @returns Array of validation error messages, empty if all valid
 */
export function validateConfiguration(): string[] {
    const errors: string[] = [];
    const config = getExtensionConfig();
    
    // Logic Step: Validate OpenAI model
    if (!config.openAiModel || config.openAiModel.trim() === '') {
        errors.push('OpenAI model configuration is required');
    }
    
    // Logic Step: Validate output paths
    if (!config.prdOutputPath || config.prdOutputPath.trim() === '') {
        errors.push('PRD output path configuration is required');
    }
    
    if (!config.contextCardOutputPath || config.contextCardOutputPath.trim() === '') {
        errors.push('Context card output path configuration is required');
    }
    
    if (!config.contextTemplateOutputPath || config.contextTemplateOutputPath.trim() === '') {
        errors.push('Context template output path configuration is required');
    }
    
    if (!config.ccsOutputPath || config.ccsOutputPath.trim() === '') {
        errors.push('CCS output path configuration is required');
    }

    if (!config.handoverOutputPath || config.handoverOutputPath.trim() === '') {
        errors.push('Handover output path configuration is required');
    }
    
    return errors;
}

/**
 * Logic Step: Update a specific configuration value.
 * Programmatically updates a configuration setting in VS Code
 * @param key The configuration key to update
 * @param value The new value to set
 * @param target The configuration target (user, workspace, etc.)
 */
export async function updateConfiguration(
    key: keyof typeof CONFIG_KEYS,
    value: string,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    await config.update(CONFIG_KEYS[key], value, target);
}
