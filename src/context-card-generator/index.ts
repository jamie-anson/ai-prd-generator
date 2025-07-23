import * as vscode from 'vscode';
import * as path from 'path';
import { CodeAnalyzer } from './analyzer';
import { CodeEnricher } from './enricher';
import { formatAsMarkdown } from './formatAsMarkdown';

export class ContextCardGenerator {
    private analyzer: CodeAnalyzer;

    constructor(private workspaceUri: vscode.Uri, private context: vscode.ExtensionContext) {
        this.analyzer = new CodeAnalyzer();
    }

    public async generateAndSaveContextCards(): Promise<void> {
        const apiKey = await this.context.secrets.get('openAiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key not set. Please set it using the command palette.');
            return;
        }

        const enricher = new CodeEnricher(apiKey);
        const outputDir = vscode.Uri.joinPath(this.workspaceUri, 'mise-en-place-output', 'context-cards');
        await vscode.workspace.fs.createDirectory(outputDir);

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
                    analysisResult = await enricher.enrich(analysisResult);

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
