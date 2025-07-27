// @ts-nocheck
/**
 * @file handleWebviewReady.ts
 * @description Handles the webview ready event, including API key status and project state detection.
 * 
 * The logic of this file is to:
 * 1. Respond to the webview ready event by checking API key availability.
 * 2. Detect the current project state using ProjectStateDetector.
 * 3. Send both API key status and project state to the webview for context-aware UI.
 * 4. Handle detection errors gracefully with fallback state.
 */

import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../utils/projectStateDetector';

/**
 * Logic Step: Handle the 'webviewReady' message from the webview.
 * This function orchestrates the initialization of the webview by sending both
 * API key status and project state information for context-aware UI behavior.
 * @param message The message object from the webview (contains command type)
 * @param context The extension context for accessing secrets and configuration
 * @param webview The webview instance for posting messages back to the UI
 */
export async function handleWebviewReady(
    message: any,
    context: vscode.ExtensionContext,
    webview: vscode.Webview
): Promise<void> {
    console.log('handleWebviewReady called');
    
    // Check API key status
    const apiKey = await context.secrets.get('openAiApiKey');
    const hasApiKey = !!apiKey;
    console.log('Sending apiKeyStatus message, hasApiKey:', hasApiKey);
    webview.postMessage({ command: 'apiKeyStatus', hasApiKey });
    
    // Detect project state and send to webview
    try {
        const projectState = await ProjectStateDetector.detectProjectState();
        console.log('Detected project state:', projectState);
        /**
         * Logic Step: Send complete project state to webview including diagram detection results.
         * This message enables context-aware UI behavior by informing the webview about all
         * detected artifacts. The hasDataFlowDiagram and hasComponentHierarchy fields were
         * added to fix a bug where diagram files existed but UI buttons remained in "Generate"
         * mode instead of switching to "View" mode.
         */
        webview.postMessage({ 
            command: 'project-state-update', 
            projectState: {
                hasPRD: projectState.hasPRD,
                hasContextCards: projectState.hasContextCards,
                hasContextTemplates: projectState.hasContextTemplates,
                hasDataFlowDiagram: projectState.hasDataFlowDiagram,
                hasComponentHierarchy: projectState.hasComponentHierarchy,
                hasCCS: projectState.hasCCS,
                prdFiles: projectState.prdFiles,
                contextCardFiles: projectState.contextCardFiles,
                contextTemplateFiles: projectState.contextTemplateFiles,
                ccsFiles: projectState.ccsFiles,
                prdCount: projectState.prdCount,
                contextCardCount: projectState.contextCardCount,
                contextTemplateCount: projectState.contextTemplateCount,
                dataFlowDiagramFiles: projectState.dataFlowDiagramFiles,
                componentHierarchyFiles: projectState.componentHierarchyFiles,
                ccsCount: projectState.ccsCount
            }
        });
    } catch (error) {
        console.error('Error detecting project state:', error);
        /**
         * Logic Step: Send fallback project state when detection fails.
         * This ensures the webview always receives a valid project state object
         * even when file system errors occur. All artifact flags are set to false
         * and counts to zero, ensuring UI shows initial generation state.
         */
        webview.postMessage({ 
            command: 'project-state-update', 
            projectState: {
                hasPRD: false,
                hasContextCards: false,
                hasContextTemplates: false,
                hasDataFlowDiagram: false,
                hasComponentHierarchy: false,
                hasCCS: false,
                prdFiles: [],
                contextCardFiles: [],
                contextTemplateFiles: [],
                ccsFiles: [],
                prdCount: 0,
                contextCardCount: 0,
                contextTemplateCount: 0,
                dataFlowDiagramFiles: [],
                componentHierarchyFiles: [],
                ccsCount: 0
            }
        });
    }
}
