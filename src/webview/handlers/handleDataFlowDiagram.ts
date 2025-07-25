import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { ProjectStateDetector } from '../../utils/projectStateDetector';

/**
 * Handles the generation of data flow diagrams based on a PRD.
 * @param context The extension context.
 * @param lastGeneratedPaths Paths to the previously generated PRD files (legacy parameter).
 * @param webview The webview instance to send updates to.
 */
export async function handleGenerateDataFlowDiagram(context: vscode.ExtensionContext, lastGeneratedPaths: { md?: vscode.Uri } | undefined, webview?: any) {
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
            title: 'Generating Data Flow Diagram...', 
            cancellable: false 
        }, async (progress) => {
            const prdContent = Buffer.from(await vscode.workspace.fs.readFile(prdFile)).toString('utf-8');

            progress.report({ message: 'Analyzing data flows from PRD...', increment: 30 });
            
            const diagramContent = await generateDataFlowDiagram(prdContent, openAiService);

            progress.report({ message: 'Saving data flow diagram...', increment: 70 });

            const config = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
            const outputPath = config.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return;
            }
            
            const outputDir = vscode.Uri.joinPath(workspaceFolders[0].uri, outputPath);
            await vscode.workspace.fs.createDirectory(outputDir);
            
            const fileName = 'data_flow_diagram.md';
            const filePath = vscode.Uri.joinPath(outputDir, fileName);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(diagramContent, 'utf-8'));

            progress.report({ message: 'Complete!', increment: 100 });
        });

        vscode.window.showInformationMessage('Data flow diagram generated successfully!');

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
        console.error('Error generating data flow diagram:', error);
        vscode.window.showErrorMessage(`Failed to generate data flow diagram: ${error.message}`);
    }
}

async function generateDataFlowDiagram(prdContent: string, openAiService: OpenAiService): Promise<string> {
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
