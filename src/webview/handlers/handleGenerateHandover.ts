// /src/webview/handlers/handleGenerateHandover.ts
/**
 * @file handleGenerateHandover.ts
 * @description Handles the generation of a project handover.md file.
 * @license MIT
 * @author Your Name
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CodebaseAnalysisService } from '../../services/codebaseAnalysisService';
import { CCSPromptTemplate } from '../../templates/ccsPromptTemplate';
import { withErrorHandling } from '../../utils/errorHandler';
import { OpenAiService } from '../../utils/openai';
import { ProjectStateDetector } from '../../utils/projectStateDetector';
import { getHandoverOutputPath } from '../../utils/configManager';

const HANDOVER_FILENAME = 'handover.md';

/**
 * @function updateProjectState
 * @description Detects the current project state and sends an update to the webview.
 * This ensures the UI reflects the latest changes in the workspace.
 * @param {vscode.Webview} webview The webview instance to post messages to.
 */
async function updateProjectState(webview: vscode.Webview) {
  try {
    const projectState = await ProjectStateDetector.detectProjectState();
    webview.postMessage({ 
      command: 'project-state-update', 
      projectState
    });
  } catch (error) {
    console.error('Error detecting project state:', error);
    webview.postMessage({ 
      command: 'project-state-update', 
      projectState: { /* fallback state */ }
    });
  }
}

/**
 * @function getHandoverSystemPrompt
 * @description Generates the system prompt for the OpenAI API to create the handover document.
 * It combines the standard codebase analysis prompt with specific instructions for generating the handover.md file.
 * @param {any} analysisResult The result from the CodebaseAnalysisService.
 * @returns {string} The complete system prompt.
 */
function getHandoverSystemPrompt(analysisResult: any): string {
  const prompt = CCSPromptTemplate.generatePrompt(analysisResult);

  return `
    ${prompt}

    **New Task: Generate Handover Document**

    You are now tasked with creating a "handover.md" file. This document will be read by another AI agent (Windsurf) to get up to speed on the current project.

    The handover document should contain the following sections:

    1.  **Project Summary**: A brief, one-paragraph overview of the project's purpose and current state.
    2.  **Architecture Overview**: A high-level description of the project's architecture. Mention the key directories (src, test, docs, etc.) and their roles.
    3.  **Key Technologies & Patterns**: List the main technologies, frameworks, and important design patterns used (e.g., VS Code Extension API, TypeScript, Mocha, Singleton Pattern for PanelManager, etc.).
    4.  **Getting Started for an AI Agent**: Provide a clear, step-by-step guide for an AI agent to get started. This should include:
        *   Initial setup commands (e.g., \`npm install\`).
        *   How to run tests (\`npm test\`).
        *   Key files to read first (e.g., \`package.json\`, \`README.md\`, \`CODEBASE_MAP.md\`).
        *   The main entry point of the application (\`src/extension.ts\`).
    5.  **Current Project Goal**: Based on your analysis of the codebase, infer and state the next logical major objective for the project.
    6.  **Next Steps**: Based on the inferred project goal, suggest a short, actionable list of the very first tasks an agent should perform to start working towards that goal.

    Generate the content for the handover.md file based on these instructions and the provided codebase analysis.
  `;
}

/**
 * @function handleGenerateHandover
 * @description Main handler for generating the handover.md file. This function orchestrates the entire process:
 * 1. Analyzes the codebase.
 * 2. Generates a system prompt.
 * 3. Calls the OpenAI API to generate the document content.
 * 4. Cleans the AI-generated output.
 * 5. Saves the content to 'handover/handover.md'.
 * 6. Updates the webview with progress and completion status.
 * @param {any} message The message object from the webview.
 * @param {vscode.ExtensionContext} context The extension context for accessing secrets.
 * @param {vscode.Webview} webview The webview instance for posting messages.
 */
export async function handleGenerateHandover(message: any, context: vscode.ExtensionContext, webview: vscode.Webview): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Generating Handover Document',
    cancellable: false
  }, async (progress) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!workspaceRoot) {
        throw new Error('No workspace root found.');
      }

      const apiKey = await context.secrets.get('openAiApiKey');
      if (!apiKey) {
        throw new Error('OpenAI API key not set. Please set it in the settings.');
      }
      const openAiService = new OpenAiService(apiKey);

      progress.report({ message: 'Analyzing codebase...' });
      const analysisService = new CodebaseAnalysisService();
      const analysisResult = await analysisService.analyzeWorkspace(workspaceRoot);

      progress.report({ message: 'Generating content with AI...' });
      const systemPrompt = getHandoverSystemPrompt(analysisResult);
      const userPrompt = 'Generate the handover.md content.';
      const handoverContent = await openAiService.generateText(userPrompt, systemPrompt);

      if (!handoverContent) {
        throw new Error('Failed to generate handover document content.');
      }

      progress.report({ message: 'Saving document...' });
      const startIndex = handoverContent.indexOf('# Handover Document');
      const cleanedContent = startIndex !== -1 ? handoverContent.substring(startIndex) : handoverContent;

      const handoverDirUri = getHandoverOutputPath(workspaceRoot);
      if (!handoverDirUri) {
        throw new Error('Could not determine handover output path. Is a workspace open?');
      }
      const handoverFileUri = vscode.Uri.joinPath(handoverDirUri, HANDOVER_FILENAME);

      try {
        await vscode.workspace.fs.createDirectory(handoverDirUri);
      } catch (error: any) {
        if (error.code !== 'EEXIST' && error.code !== 'FileExists') {
          throw error;
        }
      }
      
      await vscode.workspace.fs.writeFile(handoverFileUri, Buffer.from(cleanedContent, 'utf8'));
      
      vscode.window.showInformationMessage('Handover document generated successfully!');
      
      await updateProjectState(webview);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to generate handover document: ${error.message}`);
    }
  });
}
