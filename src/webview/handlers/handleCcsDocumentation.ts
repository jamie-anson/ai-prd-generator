import * as vscode from 'vscode';
import { OpenAiService } from '../../utils/openai';
import { CodebaseAnalysisService } from '../../services/codebaseAnalysisService';
import { handleGenerationError } from '../../utils/errorHandler';
import { getDocumentationSystemPrompt } from '../../prompts/documentationGeneration';

/**
 * Generates the specified documentation by orchestrating various services.
 * This function follows a strict, sequential process:
 * 1. Validate API Key
 * 2. Analyze Codebase
 * 3. Generate Content with AI
 * 4. Save File
 * Each step provides clear progress and error feedback.
 *
 * @param command The specific documentation command to execute (e.g., 'generateReadme').
 * @param context The VS Code extension context.
 */
const FILENAME_MAP: { [key: string]: string } = {
    generateComprehensiveReadme: 'README.md',
    generateCodebaseMap: 'CODEBASE_MAP.md',
    generateTestingFramework: 'TESTING.md',
    generateAiPromptingGuide: 'AI_PROMPTING_GUIDE.md',
};

const COMMAND_KEY_MAP: { [key: string]: string } = {
    'generate-comprehensive-readme': 'generateComprehensiveReadme',
    'generate-codebase-map': 'generateCodebaseMap',
    'generate-testing-framework': 'generateTestingFramework',
    'generate-ai-prompting-guide': 'generateAiPromptingGuide',
    'generate-all-ccs-docs': 'generateAllCcsDocumentation',
};

async function generateDocumentation(command: string, context: vscode.ExtensionContext, webview: vscode.Webview) {
    const apiKey = await context.secrets.get('openAiApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('OpenAI API key not found. Please set it in the extension settings.');
        return;
    }

    const openAiService = new OpenAiService(apiKey);

    // Step 1: API Key Validation (The Gatekeeper)
    const isApiKeyValid = await openAiService.validateApiKey();
    if (!isApiKeyValid) {
        vscode.window.showErrorMessage('Invalid OpenAI API key. Please check your credentials.', 'Open Settings').then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'aiPrdGenerator.openAiApiKey');
            }
        });
        return;
    }

        await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Documentation',
        cancellable: false
    }, async (progress) => {
        try {
            // Step 2: Codebase Analysis
            progress.report({ message: 'Analyzing codebase...' });
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open to analyze.');
                return;
            }
            const analysisService = new CodebaseAnalysisService();
            const analysis = await analysisService.analyzeWorkspace(workspaceFolders[0].uri);
            const topFileTypes = Object.entries(analysis.fileTypes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([ext, count]) => `${ext}: ${count}`)
                .join(', ');

            const analysisText = `Codebase Analysis Summary:\n- Total Files: ${analysis.totalFiles}\n- Total Lines: ${analysis.totalLines}\n- Top File Types: ${topFileTypes}`;

            // Step 3: AI Prompt Generation
            const systemPrompt = getDocumentationSystemPrompt(command);
            const userPrompt = `Here is the analysis of my codebase. Please generate the document as requested.\n\n${analysisText}`;

            // Step 4: AI Content Generation
            progress.report({ message: 'Generating content with AI...' });
            const generatedContent = await openAiService.generateText(userPrompt, systemPrompt);
            if (!generatedContent) {
                throw new Error('AI returned empty content.');
            }

            // Step 5: Save the Generated File
            progress.report({ message: 'Saving file...' });
            const rootPath = workspaceFolders[0].uri.fsPath;
            const fileName = FILENAME_MAP[command] || 'DOCUMENTATION.md';
            const filePath = vscode.Uri.file(`${rootPath}/${fileName}`);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(generatedContent, 'utf8'));

            // Step 6: Success Notification
            progress.report({ message: 'Done!' });
            const selection = await vscode.window.showInformationMessage(
                `Successfully generated ${fileName}`,
                'Open File',
                'Show in Explorer'
            );

            if (selection === 'Open File') {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            } else if (selection === 'Show in Explorer') {
                vscode.commands.executeCommand('revealInExplorer', filePath);
            }

        } catch (error) {
            // Centralized error handling for the entire process
            handleGenerationError(error, `Failed to generate ${FILENAME_MAP[command] || 'documentation'}`, webview);
        }
    });
}

/**
 * Handles incoming messages from the webview related to CCS documentation generation.
 * This is the single entry point for all documentation commands.
 *
 * @param message The message object from the webview.
 * @param context The VS Code extension context.
 * @param webview The webview panel instance.
 */
export async function handleCcsDocumentation(message: any, context: vscode.ExtensionContext, webview: vscode.Webview) {
    const commandKey = COMMAND_KEY_MAP[message.command];
    if (!commandKey) {
        console.error(`Unknown documentation command: ${message.command}`);
        return;
    }

    const keysToRun = commandKey === 'generateAllCcsDocumentation'
        ? Object.keys(FILENAME_MAP)
        : [commandKey];

    for (const key of keysToRun) {
        if (FILENAME_MAP[key]) {
            await generateDocumentation(key, context, webview);
        }
    }
}
