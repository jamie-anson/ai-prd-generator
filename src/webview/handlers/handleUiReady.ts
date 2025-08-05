/**
 * @file handleUiReady.ts
 * @description Handles webview readiness signals using community-proven message-based initialization pattern.
 * 
 * PHASE 2: Message-Based Initialization Pattern
 * This file implements the community-recommended approach where:
 * 1. Webview signals readiness with 'webview-ready' message (new) or 'uiReady' (backward compatibility)
 * 2. Extension waits for readiness signal before sending project state
 * 3. Proper coordination prevents race conditions and "already been acquired" errors
 * 4. Enhanced logging and state management for debugging
 * 
 * Community research sources:
 * - VS Code Official Docs: Message-based communication patterns
 * - StackOverflow: Webview initialization best practices
 */

import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../utils/projectStateDetector';

/**
 * Logic Step: Handle the 'uiReady' message from the webview.
 * This function is called after the webview has confirmed its DOM elements are initialized
 * and cached, ensuring safe state updates without race conditions.
 * @param message The message object from the webview (contains command type)
 * @param context The extension context for accessing configuration
 * @param webview The webview instance for posting messages back to the UI
 */
export async function handleUiReady(
    message: any,
    context: vscode.ExtensionContext,
    webview: vscode.Webview
): Promise<void> {
    // PHASE 2: Enhanced logging for message-based initialization
    const messageType = message.type || message.command || 'unknown';
    console.log(`[Extension] 🚀 Webview readiness signal received: ${messageType}`);
    
    // PHASE 2: Handle both new and legacy message formats
    if (message.type === 'webview-ready') {
        console.log('[Extension] ✅ New webview-ready signal detected');
        if (message.previousState) {
            console.log('[Extension] 💾 Previous webview state:', message.previousState);
        }
        if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            console.log(`[Extension] ⏱️ Webview initialization latency: ${latency}ms`);
        }
    } else {
        console.log('[Extension] 🔄 Legacy uiReady signal detected (backward compatibility)');
    }
    
    // PHASE 2: Detect and send project state now that webview is confirmed ready
    try {
        console.log('[Extension] 🔍 Detecting project state...');
        const projectStateDetector = ProjectStateDetector.getInstance();
        const projectState = await projectStateDetector.detectProjectState();
        
        console.log('[Extension] 📊 Project state detected:', {
            keys: Object.keys(projectState || {}),
            hasPRD: projectState?.hasPRD,
            workspaceUri: projectState?.workspaceUri?.fsPath,
            artifactCounts: {
                prd: projectState?.prdCount || 0,
                contextCards: projectState?.contextCardCount || 0,
                ccs: projectState?.ccsCount || 0,
                handover: projectState?.handoverCount || 0
            }
        });
        
        // Ensure we have a valid project state before sending
        if (!projectState) {
            throw new Error('Project state detection returned null/undefined');
        }
        
        // PHASE 2: Create enhanced message with timing information
        const stateMessage = {
            command: 'updateState',
            projectState: projectState,
            timestamp: Date.now(),
            source: 'webview-ready-handler'
        };
        
        console.log('[Extension] 📤 Sending project state update:', {
            command: stateMessage.command,
            projectStateKeys: Object.keys(stateMessage.projectState),
            hasPRD: stateMessage.projectState.hasPRD,
            timestamp: stateMessage.timestamp
        });
        
        webview.postMessage(stateMessage);
    } catch (error) {
        console.error('[Extension] Error detecting project state:', error);
        // Send complete fallback state to prevent UI from hanging
        const fallbackState = {
            hasPRD: false,
            prdFiles: [],
            prdCount: 0,
            hasContextCards: false,
            contextCardFiles: [],
            contextCardCount: 0,
            hasContextTemplates: false,
            contextTemplateFiles: [],
            contextTemplateCount: 0,
            hasDataFlowDiagram: false,
            dataFlowDiagramFiles: [],
            hasComponentHierarchy: false,
            componentHierarchyFiles: [],
            hasCCS: false,
            ccsFiles: [],
            ccsCount: 0,
            hasHandover: false,
            handoverFiles: [],
            handoverCount: 0,
            workspaceUri: null
        };
        
        console.log('[Extension] Sending fallback project state');
        webview.postMessage({ 
            command: 'updateState', 
            projectState: fallbackState 
        });
    }
}
