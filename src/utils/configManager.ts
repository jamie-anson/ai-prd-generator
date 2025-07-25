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
}

/**
 * Default configuration values used as fallbacks
 */
const DEFAULT_CONFIG: ExtensionConfig = {
    openAiModel: 'gpt-4o',
    prdOutputPath: 'mise-en-place-output/prd',
    contextCardOutputPath: 'mise-en-place-output/context-cards',
    contextTemplateOutputPath: 'mise-en-place-output/context-templates'
};

/**
 * Configuration keys mapping to VS Code settings
 */
const CONFIG_KEYS = {
    openAiModel: 'aiPrdGenerator.openAiModel',
    prdOutputPath: 'aiPrdGenerator.prdOutput.prdPath',
    contextCardOutputPath: 'aiPrdGenerator.contextCardOutput.contextCardPath',
    contextTemplateOutputPath: 'aiPrdGenerator.contextTemplateOutput.contextTemplatePath'
} as const;

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
        contextTemplateOutputPath: config.get<string>(CONFIG_KEYS.contextTemplateOutputPath) || DEFAULT_CONFIG.contextTemplateOutputPath
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
export function getPrdOutputPath(workspaceUri?: vscode.Uri): vscode.Uri {
    const config = vscode.workspace.getConfiguration();
    const relativePath = config.get<string>(CONFIG_KEYS.prdOutputPath) || DEFAULT_CONFIG.prdOutputPath;
    
    if (workspaceUri) {
        return vscode.Uri.joinPath(workspaceUri, relativePath);
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
    }
    
    throw new Error('No workspace folder found for PRD output path resolution');
}

/**
 * Logic Step: Get the context cards output directory path.
 * Returns the configured path for context card output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for context cards output directory
 */
export function getContextCardOutputPath(workspaceUri?: vscode.Uri): vscode.Uri {
    const config = vscode.workspace.getConfiguration();
    const relativePath = config.get<string>(CONFIG_KEYS.contextCardOutputPath) || DEFAULT_CONFIG.contextCardOutputPath;
    
    if (workspaceUri) {
        return vscode.Uri.joinPath(workspaceUri, relativePath);
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
    }
    
    throw new Error('No workspace folder found for context card output path resolution');
}

/**
 * Logic Step: Get the context templates output directory path.
 * Returns the configured path for context template output, resolved relative to workspace
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for context templates output directory
 */
export function getContextTemplateOutputPath(workspaceUri?: vscode.Uri): vscode.Uri {
    const config = vscode.workspace.getConfiguration();
    const relativePath = config.get<string>(CONFIG_KEYS.contextTemplateOutputPath) || DEFAULT_CONFIG.contextTemplateOutputPath;
    
    if (workspaceUri) {
        return vscode.Uri.joinPath(workspaceUri, relativePath);
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
    }
    
    throw new Error('No workspace folder found for context template output path resolution');
}

/**
 * Logic Step: Get output directory for diagram files.
 * Returns the path where diagram files (data flow, component hierarchy) should be stored
 * Uses the context template output path as diagrams are related to context documentation
 * @param workspaceUri Optional workspace URI for path resolution
 * @returns Absolute URI for diagram output directory
 */
export function getDiagramOutputPath(workspaceUri?: vscode.Uri): vscode.Uri {
    // Logic Step: Use context template path as diagrams are part of context documentation
    return getContextTemplateOutputPath(workspaceUri);
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
} {
    return {
        prd: getPrdOutputPath(workspaceUri),
        contextCards: getContextCardOutputPath(workspaceUri),
        contextTemplates: getContextTemplateOutputPath(workspaceUri),
        diagrams: getDiagramOutputPath(workspaceUri)
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
