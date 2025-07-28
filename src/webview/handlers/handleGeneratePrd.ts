import * as vscode from 'vscode';
import { OpenAiService } from '../../utils/openai';
import { updateAiManifest } from '../../utils/manifest';
import { handleGenerationError, handleApiError, withErrorHandling } from '../../utils/errorHandler';
import { getPrdOutputPath, ensureOutputDirectory } from '../../utils/configManager';

/**
 * Handles the 'generate' message from the webview to generate a PRD.
 * @param message The message object from the webview.
 * @param context The extension context.
 * @param webview The webview instance to post messages back to.
 * @returns An object containing the URIs of the generated markdown and graph files, or undefined if generation fails.
 */
export async function handleGeneratePrd(message: any, context: vscode.ExtensionContext, webview: vscode.Webview): Promise<{ md?: vscode.Uri, graph?: vscode.Uri } | undefined> {
        if (message.command !== 'generate-prd') {
        return undefined;
    }

    let generatedPaths: { md?: vscode.Uri, graph?: vscode.Uri } | undefined = undefined;

    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating PRD...", cancellable: false }, async (progress) => {
        progress.report({ increment: 0, message: "Calling AI..." });

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

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            handleGenerationError(
                new Error('No workspace folder found'), 
                'PRD generation', 
                webview
            );
            return;
        }

        // Logic Step: Use error handling wrapper for the entire generation process
        const result = await withErrorHandling(async () => {
            const openAiService = new OpenAiService(apiKey);
            const prdOutput = await openAiService.generatePrd(message.text);
            progress.report({ increment: 50, message: "Saving files..." });

            if (!prdOutput) {
                throw new Error('No output from AI service');
            }

            // Logic Step: Use configuration manager for output path
            const workspaceUri = workspaceFolders[0].uri;
            const outputDir = getPrdOutputPath(workspaceUri);
            await ensureOutputDirectory(outputDir);

            const safeTitle = (prdOutput.json.title || 'untitled').replace(/[^a-z0-9_\-]+/gi, '-').toLowerCase();
            const mdFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}.md`);
            const graphFilePath = vscode.Uri.joinPath(outputDir, `${safeTitle}-graph.json`);

            await vscode.workspace.fs.writeFile(mdFilePath, Buffer.from(prdOutput.markdown, 'utf-8'));
            await vscode.workspace.fs.writeFile(graphFilePath, Buffer.from(JSON.stringify(prdOutput.graph, null, 2), 'utf-8'));

            generatedPaths = { md: mdFilePath, graph: graphFilePath };

            await webview.postMessage({ command: 'prdGenerated', prd: prdOutput.json });
            await updateAiManifest(context, { type: 'prd', ...prdOutput.json });

            vscode.window.showInformationMessage(`PRD "${prdOutput.json.title}" generated and saved.`);
            
            return prdOutput;
        }, {
            operation: 'generate PRD',
            component: 'PRDGenerator'
        }, webview);

        // Logic Step: Return early if generation failed
        if (!result) {
            return;
        }
    });

    return generatedPaths;
}
