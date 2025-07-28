import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { handleGenerationError, handleApiError, handleFileError, withErrorHandling } from '../../utils/errorHandler';
import { getContextTemplateOutputPath, ensureOutputDirectory } from '../../utils/configManager';
import { ProjectStateDetector } from '../../utils/projectStateDetector';

/**
 * Handles the generation of context templates based on a PRD.
 * @param context The extension context.
 * @param webview Optional webview instance for error communication.
 */
export async function handleGenerateContextTemplates(context: vscode.ExtensionContext, webview?: vscode.Webview) {
    // Logic Step: Use ProjectStateDetector to find existing PRDs
    const projectState = await ProjectStateDetector.detectProjectState();
    
    if (!projectState.hasPRD || projectState.prdFiles.length === 0) {
        handleGenerationError(
            new Error('No PRD available for context template generation'),
            'context template generation',
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
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Generating Code Templates...', cancellable: false }, async (progress) => {
            const prdContent = Buffer.from(await vscode.workspace.fs.readFile(prdFile)).toString('utf-8');

            progress.report({ message: 'Extracting features from PRD...', increment: 20 });
            const features = await extractFeaturesFromPrd(prdContent, openAiService);

            if (!features.length) {
                throw new Error('No features found in the PRD');
            }

            // Logic Step: Use configuration manager for output path
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder found');
            }
            
            const outputDir = getContextTemplateOutputPath(workspaceFolders[0].uri);
            await ensureOutputDirectory(outputDir);

            const increment = 80 / features.length;
            for (const feature of features) {
                progress.report({ message: `Generating template for: ${feature}`, increment });
                const templateContent = await generateTemplateForFeature(feature, prdContent, openAiService);
                const fileName = `${(feature || 'feature').replace(/\s+/g, '_').toLowerCase()}_context.md`;
                const filePath = vscode.Uri.joinPath(outputDir, fileName);
                await vscode.workspace.fs.writeFile(filePath, Buffer.from(templateContent, 'utf-8'));
            }
        });

        vscode.window.showInformationMessage('Context templates generated successfully!');
        return true;
    }, {
        operation: 'generate context templates',
        component: 'ContextTemplateGenerator'
    }, webview);

    // Logic Step: Return early if generation failed
    if (!result) {
        return;
    }
}

async function extractFeaturesFromPrd(prdContent: string, openAiService: OpenAiService): Promise<string[]> {
    const prompt = `Based on the following PRD, identify the main features. Return a JSON array of strings. For example: ["User Authentication", "Dashboard Widgets"].\n\nPRD:\n${prdContent}`;
        const response = await openAiService.generateText(prompt);
    try {
        // The response might be in a code block, so we need to extract it.
        const jsonResponse = response.includes('```json') ? response.split('```json')[1].split('```')[0].trim() : response;
        return JSON.parse(jsonResponse);
    } catch (error) {
        console.error('Failed to parse features from LLM response:', error);
        return [];
    }
}

async function generateTemplateForFeature(feature: string, prdContent: string, openAiService: OpenAiService): Promise<string> {
    const prompt = `You are a technical project manager writing context documentation for a developer team and an AI agent.\n\nBased on the provided PRD, please generate a 'context.md' file for the following feature: "${feature}".\n\nInclude the following sections in Markdown format:\n\n1. **Purpose** – What this module or file is for\n2. **Key Files** – Main files with short descriptions\n3. **Backend** – Databases, APIs, or external systems used\n4. **Related Features** – Other flows or modules this interacts with\n5. **Design Constraints** – Requirements, patterns, or tech limitations\n6. **Open Questions** – Unresolved decisions, edge cases, or TODOs\n7. **Owner** – Who is responsible for maintaining this module\n\nBe concise but informative. Assume the reader is a new developer or an LLM agent trying to understand the feature in isolation.\n\nFull PRD for context:\n${prdContent}`;

        return openAiService.generateText(prompt);
}
