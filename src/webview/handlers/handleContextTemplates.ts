import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';

/**
 * Handles the generation of context templates based on a PRD.
 * @param context The extension context.
 * @param lastGeneratedPaths Paths to the previously generated PRD files.
 */
export async function handleGenerateContextTemplates(context: vscode.ExtensionContext, lastGeneratedPaths: { md?: vscode.Uri } | undefined) {
    if (!lastGeneratedPaths?.md) {
        vscode.window.showErrorMessage('Please generate a PRD first.');
        return;
    }

        const apiKey = await context.secrets.get('openAiApiKey');
    if (!apiKey) {
        vscode.window.showErrorMessage('API key not set. Please set it using the command palette.');
        return;
    }

    const openAiService = new OpenAiService(apiKey);

    try {
        await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Generating Context Templates...', cancellable: false }, async (progress) => {
            const prdContent = Buffer.from(await vscode.workspace.fs.readFile(lastGeneratedPaths.md!)).toString('utf-8');

            progress.report({ message: 'Extracting features from PRD...', increment: 20 });
                        const features = await extractFeaturesFromPrd(prdContent, openAiService);

            if (!features.length) {
                vscode.window.showErrorMessage('No features found in the PRD.');
                return;
            }

            const config = vscode.workspace.getConfiguration('aiPrdGenerator.contextTemplateOutput');
            const contextTemplatePath = config.get<string>('contextTemplatePath') || 'mise-en-place-output/context-templates';
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return;
            }
            const outputDir = vscode.Uri.joinPath(workspaceFolders[0].uri, contextTemplatePath);
            await vscode.workspace.fs.createDirectory(outputDir);

            const increment = 80 / features.length;
            for (const feature of features) {
                progress.report({ message: `Generating template for: ${feature}`, increment });
                const templateContent = await generateTemplateForFeature(feature, prdContent, openAiService);
                const fileName = `${feature.replace(/\s+/g, '_').toLowerCase()}_context.md`;
                                const filePath = vscode.Uri.joinPath(outputDir, fileName);
                await vscode.workspace.fs.writeFile(filePath, Buffer.from(templateContent, 'utf-8'));
            }
        });

        vscode.window.showInformationMessage('Context templates generated successfully!');

    } catch (error: any) {
        console.error('Error generating context templates:', error);
        vscode.window.showErrorMessage(`Failed to generate context templates: ${error.message}`);
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
