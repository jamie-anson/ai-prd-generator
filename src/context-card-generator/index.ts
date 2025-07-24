import * as vscode from 'vscode';
import * as path from 'path';
import { CodeAnalyzer } from './analyzer';
import { CodeEnricher } from './enricher';
import { OpenAiService } from '../utils/openai';
import { formatAsMarkdown } from './formatAsMarkdown';

/**
 * Orchestrates the entire process of generating context cards for a workspace.
 * This class coordinates the CodeAnalyzer, CodeEnricher, and markdown formatting
 * to produce comprehensive, AI-enhanced documentation for TypeScript files.
 */
export class ContextCardGenerator {
    private analyzer: CodeAnalyzer;

        /**
     * Initializes a new instance of the ContextCardGenerator.
     * @param workspaceUri The URI of the current workspace, used to resolve file paths.
     * @param context The extension context, used for accessing secrets and configuration.
     */
    constructor(private workspaceUri: vscode.Uri, private context: vscode.ExtensionContext) {
        this.analyzer = new CodeAnalyzer();
    }

        /**
     * The main method to generate and save context cards for all TypeScript files in the workspace.
     * It performs the following steps:
     * 1. Retrieves the OpenAI API key from secret storage.
     * 2. Initializes the necessary services (OpenAiService, CodeEnricher).
     * 3. Reads user-defined output paths from the VS Code configuration.
     * 4. Gathers additional context from existing context template files.
     * 5. Finds all TypeScript files in the workspace.
     * 6. Shows a progress notification to the user.
     * 7. For each file, it analyzes the code, enriches the analysis with AI summaries, formats the result as markdown, and saves it to a file.
     * 8. Provides a summary notification upon completion.
     */
    public async generateAndSaveContextCards(): Promise<void> {
        const apiKey = await this.context.secrets.get('openAiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
            return;
        }

                const openAiService = new OpenAiService(apiKey);
        const enricher = new CodeEnricher(openAiService);
                const contextCardConfig = vscode.workspace.getConfiguration('aiPrdGenerator.contextCardOutput');
        const contextCardPath = contextCardConfig.get<string>('contextCardPath') || 'mise-en-place-output/context-cards';
        const outputDir = vscode.Uri.joinPath(this.workspaceUri, contextCardPath);
        await vscode.workspace.fs.createDirectory(outputDir);

                const contextTemplateConfig = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
        const contextTemplatePath = contextTemplateConfig.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
        const contextTemplateDir = vscode.Uri.joinPath(this.workspaceUri, contextTemplatePath);
        let featureContext = '';
        try {
            const contextFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(contextTemplateDir, '*.md'));
            for (const file of contextFiles) {
                const content = Buffer.from(await vscode.workspace.fs.readFile(file)).toString('utf-8');
                featureContext += content + '\n\n---\n\n';
            }
        } catch (error) {
            // It's okay if the directory doesn't exist, we'll just proceed without the extra context.
            console.log('No context templates found, proceeding without them.');
        }

        const files = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');

        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating Context Cards...", cancellable: true }, async (progress, token) => {
            let filesProcessed = 0;
            for (const file of files) {
                if (token.isCancellationRequested) {
                    break;
                }
                const fileName = path.basename(file.fsPath);
                progress.report({ message: `Analyzing ${fileName}`, increment: (1 / files.length) * 100 });

                try {
                    const sourceCode = Buffer.from(await vscode.workspace.fs.readFile(file)).toString('utf-8');
                    let analysisResult = this.analyzer.analyze(sourceCode);
                    analysisResult = await enricher.enrich(analysisResult, featureContext);

                    const markdownContent = formatAsMarkdown(analysisResult, file.fsPath);
                    const outputFileName = `${fileName.replace(/\.ts$/, '')}.md`;
                    const outputPath = vscode.Uri.joinPath(outputDir, outputFileName);
                    await vscode.workspace.fs.writeFile(outputPath, Buffer.from(markdownContent, 'utf-8'));

                    filesProcessed++;
                } catch (error: any) {
                    console.error(`Failed to process ${fileName}:`, error);
                    vscode.window.showErrorMessage(`Failed to process ${fileName}: ${error.message}`);
                }
            }
            vscode.window.showInformationMessage(`${filesProcessed} context cards generated successfully.`);
        });
    }
}
