// @ts-nocheck
/**
 * @file baseCcsDocumentationHandler.ts
 * @description Base class for CCS documentation generation handlers to eliminate code duplication.
 * 
 * The logic of this file is to:
 * 1. Provide common functionality for all CCS documentation handlers
 * 2. Eliminate duplicate code patterns across handlers
 * 3. Standardize error handling, progress reporting, and file operations
 * 4. Create extensible base for future CCS documentation types
 * 5. Follow established patterns from baseDiagramHandler.ts
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { handleGenerationError, handleApiError, withErrorHandling } from '../../utils/errorHandler';
import { CodebaseAnalysisService } from '../../services/codebaseAnalysisService';

/**
 * Configuration for CCS documentation generation
 */
export interface CcsDocumentationConfig {
    /** The command to validate against */
    command: string;
    /** Progress notification title */
    progressTitle: string;
    /** Success message text */
    successMessage: string;
    /** File name to generate */
    fileName: string;
    /** Whether to create directory structure */
    createDirectory?: boolean;
    /** Directory name if creating directory */
    directoryName?: string;
    /** Analysis phase message */
    analysisMessage?: string;
    /** Generation phase message */
    generationMessage?: string;
    /** Save phase message */
    saveMessage?: string;
}

/**
 * Result of CCS documentation generation
 */
export interface CcsDocumentationResult {
    /** URI of the generated file or directory */
    uri: vscode.Uri;
    /** Generated content */
    content?: string;
    /** Additional files created */
    additionalFiles?: vscode.Uri[];
}

/**
 * Base class for CCS documentation generation handlers.
 * Provides common functionality and eliminates code duplication.
 */
export abstract class BaseCcsDocumentationHandler {
    protected openAiService: OpenAiService;
    protected analysisService: CodebaseAnalysisService;
    protected workspaceFolder: vscode.WorkspaceFolder;

    constructor(
        protected context: vscode.ExtensionContext,
        protected webview: vscode.Webview
    ) {
        this.openAiService = new OpenAiService(context);
        this.analysisService = new CodebaseAnalysisService();
    }

    /**
     * Logic Step: Main entry point for CCS documentation generation.
     * Handles common validation, setup, and orchestrates the generation process.
     * 
     * @param message - The message object from the webview
     * @param config - Configuration for this specific documentation type
     * @returns Promise<vscode.Uri | undefined> - URI of generated documentation
     */
    public async generateDocumentation(
        message: any,
        config: CcsDocumentationConfig
    ): Promise<vscode.Uri | undefined> {
        // Logic Step: Validate command matches expected type
        if (message.command !== config.command) {
            return undefined;
        }

        // Logic Step: Validate and setup prerequisites
        const setupResult = await this.setupPrerequisites();
        if (!setupResult) {
            return undefined;
        }

        // Logic Step: Execute generation with error handling and progress tracking
        return await withErrorHandling(async () => {
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: config.progressTitle,
                cancellable: false
            }, async (progress) => {
                // Phase 1: Analyze codebase
                progress.report({ 
                    message: config.analysisMessage || 'Analyzing codebase...', 
                    increment: 20 
                });
                const codebaseAnalysis = await this.analysisService.analyzeWorkspace(
                    this.workspaceFolder.uri.fsPath
                );

                // Phase 2: Generate content with AI
                progress.report({ 
                    message: config.generationMessage || 'Generating content with AI...', 
                    increment: 40 
                });
                const content = await this.generateContent(codebaseAnalysis, config);

                // Phase 3: Save files
                progress.report({ 
                    message: config.saveMessage || 'Saving files...', 
                    increment: 80 
                });
                const result = await this.saveDocumentation(content, config);

                // Phase 4: Complete and show success
                progress.report({ 
                    message: 'Generation completed successfully!', 
                    increment: 100 
                });

                await this.showSuccessMessage(result, config);
                return result.uri;
            });
        }, `${config.fileName} generation`, this.webview);
    }

    /**
     * Logic Step: Setup and validate all prerequisites for generation.
     * Handles API key validation, workspace setup, and service initialization.
     * 
     * @returns Promise<boolean> - True if setup successful, false otherwise
     */
    private async setupPrerequisites(): Promise<boolean> {
        // Logic Step: Validate API key
        const apiKey = await this.context.secrets.get('openAiApiKey');
        if (!apiKey) {
            handleApiError(
                new Error('OpenAI API Key not set'),
                'OpenAI',
                'authentication',
                this.webview
            );
            return false;
        }

        // Logic Step: OpenAI service already initialized in constructor

        // Logic Step: Validate workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            handleGenerationError(
                new Error('No workspace folder found'),
                'workspace validation',
                this.webview
            );
            return false;
        }

        this.workspaceFolder = workspaceFolder;
        return true;
    }

    /**
     * Logic Step: Save generated documentation to appropriate location.
     * Handles both single files and directory structures.
     * 
     * @param content - Generated content to save
     * @param config - Configuration specifying save location and structure
     * @returns Promise<CcsDocumentationResult> - Result with URIs of saved files
     */
    private async saveDocumentation(
        content: string,
        config: CcsDocumentationConfig
    ): Promise<CcsDocumentationResult> {
        if (config.createDirectory && config.directoryName) {
            // Logic Step: Create directory structure for complex documentation
            const dirPath = vscode.Uri.file(
                path.join(this.workspaceFolder.uri.fsPath, config.directoryName)
            );
            await vscode.workspace.fs.createDirectory(dirPath);

            // Save main documentation file
            const filePath = vscode.Uri.file(path.join(dirPath.fsPath, config.fileName));
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf-8'));

            // Allow subclasses to create additional files
            const additionalFiles = await this.createAdditionalFiles(dirPath, content);

            return {
                uri: dirPath,
                content,
                additionalFiles
            };
        } else {
            // Logic Step: Save single file to workspace root
            const filePath = vscode.Uri.file(
                path.join(this.workspaceFolder.uri.fsPath, config.fileName)
            );
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf-8'));

            return {
                uri: filePath,
                content
            };
        }
    }

    /**
     * Logic Step: Show success message with appropriate action options.
     * Provides consistent user experience across all documentation types.
     * 
     * @param result - Generation result with file URIs
     * @param config - Configuration with success message details
     */
    private async showSuccessMessage(
        result: CcsDocumentationResult,
        config: CcsDocumentationConfig
    ): Promise<void> {
        const isDirectory = config.createDirectory;
        const openLabel = isDirectory ? `Open ${config.directoryName}` : `Open ${config.fileName}`;
        const exploreLabel = 'View in Explorer';

        const action = await vscode.window.showInformationMessage(
            config.successMessage,
            openLabel,
            exploreLabel
        );

        if (action === openLabel) {
            if (isDirectory) {
                await vscode.commands.executeCommand('revealInExplorer', result.uri);
            } else {
                await vscode.window.showTextDocument(result.uri);
            }
        } else if (action === exploreLabel) {
            await vscode.commands.executeCommand('revealInExplorer', result.uri);
        }
    }

    /**
     * Logic Step: Generate AI prompt with codebase analysis data.
     * Creates standardized prompt format with project-specific information.
     * 
     * @param codebaseAnalysis - Analysis results from CodebaseAnalysisService
     * @returns string - Formatted codebase analysis for AI prompts
     */
    protected formatCodebaseAnalysisForPrompt(codebaseAnalysis: any): string {
        return `Project Analysis:
- Total Files: ${codebaseAnalysis.totalFiles}
- Code Files: ${codebaseAnalysis.codeFiles}
- Languages: ${codebaseAnalysis.languages.join(', ')}
- Directory Structure Depth: ${codebaseAnalysis.maxDepth}
- Has Tests: ${codebaseAnalysis.hasTests}
- Has Documentation: ${codebaseAnalysis.hasDocumentation}
- Has TypeScript: ${codebaseAnalysis.hasTypeScript}

Sample Files:
${codebaseAnalysis.sampleFiles.map(file => `- ${file.relativePath} (${file.language}) - ${file.lines} lines`).join('\n')}`;
    }

    // Abstract methods that subclasses must implement

    /**
     * Logic Step: Generate content using AI based on codebase analysis.
     * Each documentation type implements its own content generation logic.
     * 
     * @param codebaseAnalysis - Results from codebase analysis
     * @param config - Configuration for this documentation type
     * @returns Promise<string> - Generated documentation content
     */
    protected abstract generateContent(
        codebaseAnalysis: any,
        config: CcsDocumentationConfig
    ): Promise<string>;

    /**
     * Logic Step: Create additional files for complex documentation types.
     * Optional method for handlers that need to create multiple files.
     * 
     * @param baseDir - Base directory for additional files
     * @param mainContent - Main documentation content
     * @returns Promise<vscode.Uri[]> - URIs of additional files created
     */
    protected async createAdditionalFiles(
        baseDir: vscode.Uri,
        mainContent: string
    ): Promise<vscode.Uri[]> {
        return [];
    }
}
