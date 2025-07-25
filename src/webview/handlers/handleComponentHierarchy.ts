import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { ProjectStateDetector } from '../../utils/projectStateDetector';

/**
 * Handles the generation of component hierarchy diagrams based on a PRD.
 * @param context The extension context.
 * @param lastGeneratedPaths Paths to the previously generated PRD files (legacy parameter).
 * @param webview The webview instance to send updates to.
 */
export async function handleGenerateComponentHierarchy(context: vscode.ExtensionContext, lastGeneratedPaths: { md?: vscode.Uri } | undefined, webview?: any) {
    // Use ProjectStateDetector to find existing PRDs instead of relying on lastGeneratedPaths
    const projectState = await ProjectStateDetector.detectProjectState();
    
    if (!projectState.hasPRD || projectState.prdFiles.length === 0) {
        vscode.window.showErrorMessage('Please generate a PRD first.');
        return;
    }
    
    // Use the first available PRD file
    const prdFile = projectState.prdFiles[0];

    const apiKey = await context.secrets.get('openAiApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('API key not set. Please set it using the command palette.');
        return;
    }

    const openAiService = new OpenAiService(apiKey);

    try {
        await vscode.window.withProgress({ 
            location: vscode.ProgressLocation.Notification, 
            title: 'Generating Component Hierarchy...', 
            cancellable: false 
        }, async (progress) => {
            const prdContent = Buffer.from(await vscode.workspace.fs.readFile(prdFile)).toString('utf-8');

            progress.report({ message: 'Analyzing system components from PRD...', increment: 30 });
            
            const hierarchyContent = await generateComponentHierarchy(prdContent, openAiService);

            progress.report({ message: 'Saving component hierarchy...', increment: 70 });

            const config = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
            const outputPath = config.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return;
            }
            
            const outputDir = vscode.Uri.joinPath(workspaceFolders[0].uri, outputPath);
            await vscode.workspace.fs.createDirectory(outputDir);
            
            const fileName = 'component_hierarchy.md';
            const filePath = vscode.Uri.joinPath(outputDir, fileName);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(hierarchyContent, 'utf-8'));

            progress.report({ message: 'Complete!', increment: 100 });
        });

        vscode.window.showInformationMessage('Component hierarchy generated successfully!');

        // Send updated project state to webview to refresh UI
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

    } catch (error: any) {
        console.error('Error generating component hierarchy:', error);
        vscode.window.showErrorMessage(`Failed to generate component hierarchy: ${error.message}`);
    }
}

async function generateComponentHierarchy(prdContent: string, openAiService: OpenAiService): Promise<string> {
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
