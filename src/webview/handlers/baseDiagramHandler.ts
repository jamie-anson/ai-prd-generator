// @ts-nocheck
/**
 * @file baseDiagramHandler.ts
 * @description Base class for diagram generation handlers to eliminate code duplication.
 * 
 * The logic of this file is to:
 * 1. Provide a common base class for all diagram generation handlers
 * 2. Centralize shared logic for PRD detection, API key validation, and file operations
 * 3. Define abstract methods for diagram-specific generation logic
 * 4. Standardize error handling and progress reporting across diagram handlers
 * 5. Reduce code duplication between data flow and component hierarchy handlers
 */

import * as vscode from 'vscode';
import { OpenAiService } from '../../utils/openai';
import { ProjectStateDetector } from '../../utils/projectStateDetector';
import { handleGenerationError, handleApiError, withErrorHandling } from '../../utils/errorHandler';
import { getDiagramOutputPath, ensureOutputDirectory } from '../../utils/configManager';

/**
 * Interface defining the configuration for diagram generation
 */
export interface DiagramConfig {
    /** The type of diagram being generated (for display purposes) */
    diagramType: string;
    /** The filename to save the diagram as */
    fileName: string;
    /** The progress notification title */
    progressTitle: string;
    /** The success message to display */
    successMessage: string;
}

/**
 * Logic Step: Abstract base class for diagram generation handlers.
 * This class provides common functionality for all diagram generators,
 * including PRD detection, API validation, file operations, and error handling.
 * Concrete implementations only need to provide diagram-specific generation logic.
 */
export abstract class BaseDiagramHandler {
    /**
     * Logic Step: Generate a diagram based on a PRD.
     * This is the main entry point that orchestrates the entire diagram generation process.
     * @param context The extension context for API key access
     * @param webview Optional webview instance for error communication and state updates
     * @param config Configuration object specifying diagram type and file details
     */
    public async generateDiagram(
        context: vscode.ExtensionContext, 
        webview?: vscode.Webview,
        config?: DiagramConfig
    ): Promise<void> {
        // Logic Step: Use default configuration if none provided
        const diagramConfig = config || this.getDefaultConfig();
        
        // Logic Step: Use ProjectStateDetector to find existing PRDs
        const projectState = await ProjectStateDetector.detectProjectState();
        
        if (!projectState.hasPRD || projectState.prdFiles.length === 0) {
            handleGenerationError(
                new Error(`No PRD available for ${diagramConfig.diagramType} generation`),
                `${diagramConfig.diagramType} generation`,
                webview
            );
            return;
        }
        
        // Use the first available PRD file
        const prdFile = projectState.prdFiles[0];

        const apiKey = await context.secrets.get('openAiApiKey');
        if (!apiKey) {
            handleApiError(
                new Error('OpenAI API Key not set'),
                'OpenAI',
                'authentication',
                webview
            );
            return;
        }

        const openAiService = new OpenAiService(apiKey);

        // Logic Step: Use error handling wrapper for the entire generation process
        const result = await withErrorHandling(async () => {
            await vscode.window.withProgress({ 
                location: vscode.ProgressLocation.Notification, 
                title: diagramConfig.progressTitle, 
                cancellable: false 
            }, async (progress) => {
                const prdContent = Buffer.from(await vscode.workspace.fs.readFile(prdFile)).toString('utf-8');

                progress.report({ message: `Analyzing ${diagramConfig.diagramType.toLowerCase()} from PRD...`, increment: 30 });
                
                // Logic Step: Call abstract method for diagram-specific generation
                const diagramContent = await this.generateDiagramContent(prdContent, openAiService);

                progress.report({ message: `Saving ${diagramConfig.diagramType.toLowerCase()}...`, increment: 70 });

                // Logic Step: Use configuration manager for output path
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    throw new Error('No workspace folder found');
                }
                
                const outputDir = getDiagramOutputPath(workspaceFolders[0].uri);
                await ensureOutputDirectory(outputDir);
                
                const filePath = vscode.Uri.joinPath(outputDir, diagramConfig.fileName);
                await vscode.workspace.fs.writeFile(filePath, Buffer.from(diagramContent, 'utf-8'));

                progress.report({ message: 'Complete!', increment: 100 });
            });

            vscode.window.showInformationMessage(diagramConfig.successMessage);

            // Logic Step: Send updated project state to webview to refresh UI
            if (webview) {
                try {
                    const updatedProjectState = await ProjectStateDetector.detectProjectState();
                    webview.postMessage({
                        command: 'project-state-update',
                        projectState: updatedProjectState
                    });
                } catch (stateError) {
                    console.error('Error updating project state after diagram generation:', stateError);
                }
            }
            
            return true;
        }, {
            operation: `generate ${diagramConfig.diagramType.toLowerCase()}`,
            component: `${diagramConfig.diagramType}Generator`
        }, webview);

        // Logic Step: Return early if generation failed
        if (!result) {
            return;
        }
    }

    /**
     * Logic Step: Abstract method for generating diagram-specific content.
     * Concrete implementations must provide this method to generate their specific diagram type.
     * @param prdContent The content of the PRD file
     * @param openAiService The OpenAI service instance for content generation
     * @returns Promise resolving to the generated diagram content
     */
    protected abstract generateDiagramContent(prdContent: string, openAiService: OpenAiService): Promise<string>;

    /**
     * Logic Step: Abstract method for providing default configuration.
     * Concrete implementations must provide default configuration for their diagram type.
     * @returns Default configuration object for the diagram type
     */
    protected abstract getDefaultConfig(): DiagramConfig;
}

/**
 * Logic Step: Data Flow Diagram Handler implementation.
 * Extends the base handler to provide data flow diagram specific generation logic.
 */
export class DataFlowDiagramHandler extends BaseDiagramHandler {
    protected getDefaultConfig(): DiagramConfig {
        return {
            diagramType: 'Data Flow Diagram',
            fileName: 'data_flow_diagram.md',
            progressTitle: 'Generating Data Flow Diagram...',
            successMessage: 'Data flow diagram generated successfully!'
        };
    }

    protected async generateDiagramContent(prdContent: string, openAiService: OpenAiService): Promise<string> {
        const prompt = `You are a technical architect creating a data flow diagram for a development team.

Based on the provided PRD, generate a comprehensive data flow diagram in Markdown format.

Include the following sections:

1. **Overview** - Brief description of the system's data architecture
2. **Data Sources** - External APIs, databases, user inputs, etc.
3. **Data Processing** - How data moves through the system
4. **Data Storage** - Where and how data is persisted
5. **Data Outputs** - APIs, UI displays, reports, etc.
6. **Mermaid Diagram** - A visual representation using Mermaid syntax

For the Mermaid diagram, use flowchart syntax to show:
- Data sources (rectangles)
- Processing steps (rounded rectangles)
- Storage (cylinders)
- Decision points (diamonds)
- Outputs (parallelograms)

Example Mermaid syntax:
\`\`\`mermaid
flowchart TD
    A[User Input] --> B{Validation}
    B -->|Valid| C[(Database)]
    B -->|Invalid| D[Error Response]
    C --> E[API Response]
\`\`\`

Be specific about data types, formats, and transformation steps mentioned in the PRD.

PRD Content:
${prdContent}`;

        return openAiService.generateText(prompt);
    }
}

/**
 * Logic Step: Component Hierarchy Handler implementation.
 * Extends the base handler to provide component hierarchy diagram specific generation logic.
 */
export class ComponentHierarchyHandler extends BaseDiagramHandler {
    protected getDefaultConfig(): DiagramConfig {
        return {
            diagramType: 'Component Hierarchy',
            fileName: 'component_hierarchy.md',
            progressTitle: 'Generating Component Hierarchy...',
            successMessage: 'Component hierarchy generated successfully!'
        };
    }

    protected async generateDiagramContent(prdContent: string, openAiService: OpenAiService): Promise<string> {
        const prompt = `You are a software architect creating a component hierarchy diagram for a development team.

Based on the provided PRD, generate a comprehensive component hierarchy in Markdown format.

Include the following sections:

1. **System Overview** - High-level description of the system architecture
2. **Component Layers** - Break down by architectural layers (UI, Business Logic, Data, etc.)
3. **Component Dependencies** - How components interact and depend on each other
4. **Component Responsibilities** - What each major component is responsible for
5. **Mermaid Diagram** - A visual hierarchy using Mermaid syntax

For the Mermaid diagram, use a graph or flowchart to show:
- Parent-child relationships between components
- Dependencies between components
- Clear separation of concerns

Example Mermaid syntax:
\`\`\`mermaid
graph TD
    A[Frontend App] --> B[Authentication Module]
    A --> C[Dashboard Module]
    A --> D[API Client]
    D --> E[Backend API]
    E --> F[Business Logic Layer]
    E --> G[Data Access Layer]
    G --> H[(Database)]
\`\`\`

Focus on:
- Clear component boundaries
- Logical grouping of related functionality
- Separation of concerns
- Reusable components
- Dependencies and interfaces

Be specific about the components mentioned or implied in the PRD.

PRD Content:
${prdContent}`;

        return openAiService.generateText(prompt);
    }
}
