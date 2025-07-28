// @ts-nocheck
/**
 * @file ccsDocumentationRegistry.ts
 * @description Configuration-driven handler registry for CCS documentation generation.
 * 
 * The logic of this file is to:
 * 1. Provide centralized configuration for all CCS documentation types
 * 2. Eliminate repetitive handler registration code
 * 3. Enable easy addition of new documentation types through configuration
 * 4. Support metadata-driven handler creation and management
 * 5. Create a scalable architecture for documentation generation
 */

import * as vscode from 'vscode';
import { MessageRouter, MessageHandler } from '../router';
import { COMMANDS } from '../commands';
import { CcsDocumentationPromptService, CodebaseAnalysisData } from '../../templates/ccsDocumentationPrompts';
import { BaseCcsDocumentationHandler, CcsDocumentationConfig } from './baseCcsDocumentationHandler';

/**
 * Metadata for a CCS documentation type
 */
export interface CcsDocumentationTypeMetadata {
    /** Unique identifier for this documentation type */
    id: string;
    /** Command string from COMMANDS object */
    command: string;
    /** Display name for progress notifications */
    displayName: string;
    /** File name to generate */
    fileName: string;
    /** Whether to create a directory structure */
    createDirectory?: boolean;
    /** Directory name if creating directory */
    directoryName?: string;
    /** Progress messages */
    progressMessages: {
        analysis: string;
        generation: string;
        save: string;
    };
    /** Success message template */
    successMessage: string;
    /** Prompt type for CcsDocumentationPromptService */
    promptType: string;
}

/**
 * Registry of all CCS documentation types with their configurations.
 * This centralized configuration eliminates the need for separate handler functions.
 */
export const CCS_DOCUMENTATION_TYPES: Record<string, CcsDocumentationTypeMetadata> = {
    readme: {
        id: 'readme',
        command: COMMANDS.GENERATE_COMPREHENSIVE_README,
        displayName: 'Comprehensive README',
        fileName: 'README.md',
        progressMessages: {
            analysis: 'Analyzing codebase structure...',
            generation: 'Generating README content with AI...',
            save: 'Saving README.md file...'
        },
        successMessage: 'Comprehensive README.md generated successfully!',
        promptType: 'readme'
    },
    codebaseMap: {
        id: 'codebase-map',
        command: COMMANDS.GENERATE_CODEBASE_MAP,
        displayName: 'Codebase Map',
        fileName: 'CODEBASE_MAP.md',
        progressMessages: {
            analysis: 'Analyzing codebase architecture...',
            generation: 'Generating codebase map with AI...',
            save: 'Saving CODEBASE_MAP.md file...'
        },
        successMessage: 'Comprehensive CODEBASE_MAP.md generated successfully!',
        promptType: 'codebase-map'
    },
    testingFramework: {
        id: 'testing-framework',
        command: COMMANDS.GENERATE_TESTING_FRAMEWORK,
        displayName: 'Testing Framework',
        fileName: 'README.md',
        createDirectory: true,
        directoryName: 'tests',
        progressMessages: {
            analysis: 'Analyzing codebase for testing needs...',
            generation: 'Generating testing framework with AI...',
            save: 'Creating testing framework structure...'
        },
        successMessage: 'Comprehensive testing framework generated successfully!',
        promptType: 'testing-framework'
    },
    aiPromptingGuide: {
        id: 'ai-prompting-guide',
        command: COMMANDS.GENERATE_AI_PROMPTING_GUIDE,
        displayName: 'AI Prompting Guide',
        fileName: 'AI_AGENT_PROMPTING_STRATEGY.md',
        progressMessages: {
            analysis: 'Analyzing codebase patterns...',
            generation: 'Generating AI prompting strategies...',
            save: 'Saving AI prompting guide...'
        },
        successMessage: 'AI Agent Prompting Guide generated successfully!',
        promptType: 'ai-prompting-guide'
    }
};

/**
 * Generic CCS documentation handler that works with any documentation type.
 * Uses configuration-driven approach to eliminate code duplication.
 */
class ConfigurableCcsDocumentationHandler extends BaseCcsDocumentationHandler {
    private promptService: CcsDocumentationPromptService;

    constructor(
        context: vscode.ExtensionContext,
        webview: vscode.Webview,
        private metadata: CcsDocumentationTypeMetadata
    ) {
        super(context, webview);
        this.promptService = new CcsDocumentationPromptService();
    }

    protected async generateContent(codebaseAnalysis: CodebaseAnalysisData): Promise<string> {
        return await this.openAiService.generateText(
            this.promptService.generatePrompt(this.metadata.promptType, codebaseAnalysis)
        );
    }

    protected async createAdditionalFiles(baseDir: vscode.Uri, mainContent: string): Promise<vscode.Uri[]> {
        // Special handling for testing framework
        if (this.metadata.id === 'testing-framework') {
            const additionalFiles: vscode.Uri[] = [];
            const subdirs = ['unit', 'integration', 'e2e', 'utils'];
            
            for (const subdir of subdirs) {
                const subdirPath = vscode.Uri.file(require('path').join(baseDir.fsPath, subdir));
                await vscode.workspace.fs.createDirectory(subdirPath);
                
                const placeholderPath = vscode.Uri.file(require('path').join(subdirPath.fsPath, '.gitkeep'));
                await vscode.workspace.fs.writeFile(placeholderPath, Buffer.from('', 'utf-8'));
                additionalFiles.push(placeholderPath);
            }
            
            return additionalFiles;
        }
        
        return [];
    }
}

/**
 * Factory function to create a handler for a specific documentation type.
 * Uses the registry configuration to create consistent handlers.
 * 
 * @param typeId - ID of the documentation type from CCS_DOCUMENTATION_TYPES
 * @returns MessageHandler function for the specified type
 */
function createCcsDocumentationHandler(typeId: string): MessageHandler {
    const metadata = CCS_DOCUMENTATION_TYPES[typeId];
    if (!metadata) {
        throw new Error(`Unknown CCS documentation type: ${typeId}`);
    }

    return async (message: any, context: vscode.ExtensionContext, webview: vscode.Webview) => {
        const handler = new ConfigurableCcsDocumentationHandler(context, webview, metadata);
        
        const config: CcsDocumentationConfig = {
            command: metadata.command,
            progressTitle: `Generating ${metadata.displayName}...`,
            successMessage: metadata.successMessage,
            fileName: metadata.fileName,
            createDirectory: metadata.createDirectory,
            directoryName: metadata.directoryName,
            analysisMessage: metadata.progressMessages.analysis,
            generationMessage: metadata.progressMessages.generation,
            saveMessage: metadata.progressMessages.save
        };

        return await handler.generateDocumentation(message, config);
    };
}

/**
 * Registry service for managing CCS documentation handlers.
 * Provides centralized registration and management of all documentation types.
 */
export class CcsDocumentationHandlerRegistry {
    private handlers: Map<string, MessageHandler> = new Map();

    constructor() {
        this.initializeHandlers();
    }

    /**
     * Logic Step: Initialize all handlers from the registry configuration.
     * Creates handlers for all documentation types defined in CCS_DOCUMENTATION_TYPES.
     */
    private initializeHandlers(): void {
        for (const [typeId, metadata] of Object.entries(CCS_DOCUMENTATION_TYPES)) {
            const handler = createCcsDocumentationHandler(typeId);
            this.handlers.set(metadata.command, handler);
        }
    }

    /**
     * Logic Step: Register all CCS documentation handlers with the message router.
     * Eliminates the need for manual handler registration in messageHandlers.ts.
     * 
     * @param router - MessageRouter instance to register handlers with
     */
    public registerAllHandlers(router: MessageRouter): void {
        for (const [command, handler] of this.handlers.entries()) {
            router.register(command, handler);
        }
    }

    /**
     * Logic Step: Get handler for a specific command.
     * Provides access to individual handlers if needed.
     * 
     * @param command - Command string to get handler for
     * @returns MessageHandler for the command, or undefined if not found
     */
    public getHandler(command: string): MessageHandler | undefined {
        return this.handlers.get(command);
    }

    /**
     * Logic Step: Get all registered documentation types.
     * Provides access to metadata for UI generation or other purposes.
     * 
     * @returns Array of all documentation type metadata
     */
    public getAllDocumentationTypes(): CcsDocumentationTypeMetadata[] {
        return Object.values(CCS_DOCUMENTATION_TYPES);
    }

    /**
     * Logic Step: Add a new documentation type to the registry.
     * Enables dynamic addition of new documentation types.
     * 
     * @param metadata - Metadata for the new documentation type
     */
    public addDocumentationType(metadata: CcsDocumentationTypeMetadata): void {
        CCS_DOCUMENTATION_TYPES[metadata.id] = metadata;
        const handler = createCcsDocumentationHandler(metadata.id);
        this.handlers.set(metadata.command, handler);
    }
}

/**
 * Handler for generating all CCS documentation at once.
 * Uses the registry to orchestrate generation of all documentation types.
 */
export async function handleGenerateAllCcsDocs(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri[] | undefined> {
    if (message.command !== COMMANDS.GENERATE_ALL_CCS_DOCS) {
        return undefined;
    }

    const registry = new CcsDocumentationHandlerRegistry();
    const documentationTypes = registry.getAllDocumentationTypes();

    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating All CCS Documentation...',
        cancellable: false
    }, async (progress) => {
        const generatedFiles: vscode.Uri[] = [];
        const increment = 80 / documentationTypes.length; // Reserve 20% for completion

        for (let i = 0; i < documentationTypes.length; i++) {
            const docType = documentationTypes[i];
            const progressPercent = 20 + (i * increment);
            
            progress.report({ 
                message: `Generating ${docType.displayName}...`, 
                increment: progressPercent 
            });

            const handler = registry.getHandler(docType.command);
            if (handler) {
                const result = await handler(
                    { command: docType.command }, 
                    context, 
                    webview
                );
                if (result) {
                    generatedFiles.push(result);
                }
            }
        }

        progress.report({ message: 'All CCS documentation generated successfully!', increment: 100 });

        const action = await vscode.window.showInformationMessage(
            `Successfully generated ${generatedFiles.length} CCS documentation files! Your Code Comprehension Score should be significantly improved.`,
            'Open Workspace',
            'View Files'
        );

        if (action === 'Open Workspace') {
            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        } else if (action === 'View Files' && generatedFiles.length > 0) {
            await vscode.window.showTextDocument(generatedFiles[0]);
        }

        return generatedFiles;
    });
}

// Export individual handler functions for backward compatibility
export const handleGenerateComprehensiveReadme = createCcsDocumentationHandler('readme');
export const handleGenerateCodebaseMap = createCcsDocumentationHandler('codebaseMap');
export const handleGenerateTestingFramework = createCcsDocumentationHandler('testingFramework');
export const handleGenerateAiPromptingGuide = createCcsDocumentationHandler('aiPromptingGuide');
