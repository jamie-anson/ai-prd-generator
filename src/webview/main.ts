// @ts-nocheck
/**
 * @file main.ts
 * @description Main entry point for the webview using community-proven IIFE pattern.
 * 
 * This file follows VS Code official documentation recommendations:
 * 1. Uses IIFE (Immediately Invoked Function Expression) for API acquisition
 * 2. Implements script execution guard to prevent duplicate initialization
 * 3. Uses message-based initialization pattern (webview signals readiness)
 * 4. Maintains proper VS Code API security constraints
 * 
 * Community research sources:
 * - VS Code Official Docs: https://code.visualstudio.com/api/extension-guides/webview
 * - GitHub Issues: https://github.com/microsoft/vscode/issues/122961
 * - StackOverflow: Multiple discussions on acquireVsCodeApi best practices
 */

import { elements, updateApiKeyDisplay, updateUIBasedOnProjectState, displayErrorMessage, displayInfoMessage, displaySuccessMessage, displayCCSResults } from './ui';
import { MessageRouter } from './router';
import { initializeEventHandlers } from './eventHandlers';
import { ExtensionToWebviewMessage, ProjectState, isValidProjectState } from './types';
import { isValidProjectState as validateProjectState } from './uiUtils';

// Type definitions for VS Code API
declare global {
    interface VscodeState {
        [key: string]: any;
    }

    interface Window {
        __webviewInitialized?: boolean;
        acquireVsCodeApi?: () => {
            postMessage(message: any): void;
            getState(): VscodeState | undefined;
            setState(state: VscodeState): void;
        };
    }
}

// PHASE 1: Script execution guard - prevent duplicate initialization
if (window.__webviewInitialized) {
    console.log('[Webview] Already initialized, preventing duplicate execution');
} else {
    window.__webviewInitialized = true;
    console.log('[Webview] Initializing for the first time using IIFE pattern');
    
    // PHASE 1: IIFE Pattern - Community-proven approach for VS Code API acquisition
    (function() {
        console.log('[Webview] 🚀 Starting IIFE initialization');
        
        // PHASE 4: Track webview startup time for debugging
        (window as any).__webviewStartTime = Date.now();
        
        // Acquire VS Code API - can only be called once per session
        let vscode: any;
        try {
            if (typeof window.acquireVsCodeApi === 'function') {
                vscode = window.acquireVsCodeApi();
                console.log('[Webview] ✅ VS Code API acquired successfully');
                
                // PHASE 4: Verify API functionality
                if (typeof vscode.postMessage === 'function' && 
                    typeof vscode.getState === 'function' && 
                    typeof vscode.setState === 'function') {
                    console.log('[Webview] 🔍 VS Code API validation passed');
                } else {
                    console.warn('[Webview] ⚠️ VS Code API missing expected methods');
                }
            } else {
                throw new Error('acquireVsCodeApi function not available');
            }
        } catch (error) {
            console.error('[Webview] ❌ Failed to acquire VS Code API:', {
                error: error,
                windowKeys: Object.keys(window).filter(key => key.includes('vscode') || key.includes('acquire')),
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            });
            // PHASE 4: Enhanced error reporting
            displayErrorMessage('Failed to initialize VS Code API. Please reload the webview.', 'api');
            return;
        }
        
        // PHASE 2: State persistence using VS Code's built-in state management
        function restoreWebviewState() {
            try {
                const savedState = vscode.getState();
                if (savedState) {
                    console.log('[Webview] Restored previous state:', savedState);
                    return savedState;
                }
            } catch (error) {
                console.warn('[Webview] Could not restore state:', error);
            }
            return null;
        }
        
        function saveWebviewState(state: any) {
            try {
                vscode.setState(state);
                console.log('[Webview] State saved:', state);
            } catch (error) {
                console.warn('[Webview] Could not save state:', error);
            }
        }
        
        // PHASE 2: Message-based initialization - webview signals readiness
        function initializeWebview() {
            console.log('[Webview] Initializing webview components...');
            
            // Restore any previous state
            const previousState = restoreWebviewState();
            
            // Initialize event handlers for UI interactions
            initializeEventHandlers();
            
            // PHASE 2: Send webview-ready signal instead of uiReady
            console.log('[Webview] Sending webview-ready signal to extension...');
            vscode.postMessage({ 
                type: 'webview-ready',
                timestamp: Date.now(),
                previousState: previousState 
            });
            
            // Set up message listener with improved error handling
            setupMessageListener();
        }
        
        // PHASE 4: Robust message handling with timeout and validation
        function setupMessageListener() {
            console.log('[Webview] 🔧 Setting up enhanced message listener with timeout handling...');
            
            // PHASE 4: Communication metrics for debugging
            let messageCount = 0;
            let lastMessageTime = Date.now();
            
            window.addEventListener('message', async (event: MessageEvent<ExtensionToWebviewMessage>) => {
                const message = event.data;
                messageCount++;
                const currentTime = Date.now();
                const timeSinceLastMessage = currentTime - lastMessageTime;
                lastMessageTime = currentTime;
                
                console.log(`[Webview] 📨 Message #${messageCount} received:`, {
                    command: message.command,
                    timeSinceLastMessage: `${timeSinceLastMessage}ms`,
                    timestamp: currentTime,
                    messageSize: JSON.stringify(message).length
                });
                
                // PHASE 4: Message processing with timeout
                const messageTimeout = setTimeout(() => {
                    console.warn(`[Webview] ⏰ Message processing timeout for: ${message.command}`);
                    displayErrorMessage(`Message processing timeout: ${message.command}`, 'validation');
                }, 5000); // 5-second timeout
                
                try {
                    await processMessage(message);
                    clearTimeout(messageTimeout);
                    console.log(`[Webview] ✅ Message processed successfully: ${message.command}`);
                } catch (error) {
                    clearTimeout(messageTimeout);
                    console.error(`[Webview] ❌ Error processing message #${messageCount}:`, {
                        command: message.command,
                        error: error,
                        message: message,
                        stack: error instanceof Error ? error.stack : 'No stack trace'
                    });
                    await displayErrorMessage(`Error processing ${message.command}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'validation');
                }
            });
            
            // PHASE 4: Communication health monitoring
            setInterval(() => {
                const healthMetrics = {
                    messagesReceived: messageCount,
                    lastMessageAge: Date.now() - lastMessageTime,
                    webviewUptime: Date.now() - (window as any).__webviewStartTime
                };
                console.log('[Webview] 📊 Communication health:', healthMetrics);
                
                // Update webview state with metrics
                const currentState = {
                    lastMessage: 'health-check',
                    timestamp: Date.now(),
                    communicationMetrics: {
                        messagesReceived: messageCount,
                        lastSuccessfulUpdate: lastMessageTime,
                        errorCount: 0 // Could be tracked separately
                    }
                };
                saveWebviewState(currentState);
            }, 30000); // Every 30 seconds
        }
        
        // PHASE 4: Centralized message processing with validation
        async function processMessage(message: ExtensionToWebviewMessage) {
            // Save current state before processing
            const currentState = { lastMessage: message.command, timestamp: Date.now() };
            saveWebviewState(currentState);
            
            switch (message.command) {
                case 'apiKeyStatus':
                    console.log('[Webview] 🔑 API key status received:', message.hasApiKey);
                    if (typeof message.hasApiKey === 'boolean') {
                        await updateApiKeyDisplay(message.hasApiKey);
                        console.log('[Webview] ✅ Updated API key display');
                    } else {
                        console.error('[Webview] ❌ Invalid api-key-status format:', message);
                        await displayErrorMessage('Invalid API key status received', 'validation');
                    }
                    break;
                    
                case 'updateState':
                    console.log('[Webview] 🔄 Project state update received');
                    if (validateProjectState(message.projectState)) {
                        await updateUIBasedOnProjectState(message.projectState as ProjectState);
                        console.log('[Webview] ✅ UI updated with project state');
                    } else {
                        console.error('[Webview] ❌ Invalid project state format:', message);
                        await displayErrorMessage('Invalid project state data received', 'validation');
                    }
                    break;
                    
                case 'ccsGenerated':
                    console.log('[Webview] 📊 CCS analysis received');
                    if (message.analysis && typeof message.analysis === 'string') {
                        await displayCCSResults(message.analysis);
                        console.log('[Webview] ✅ CCS results displayed');
                    } else {
                        console.error('[Webview] ❌ Invalid CCS format:', message);
                        await displayErrorMessage('Invalid CCS analysis data received', 'validation');
                    }
                    break;
                    
                case 'info':
                    if (message.text && typeof message.text === 'string') {
                        console.log('[Webview] ℹ️ Info:', message.text);
                        await displayInfoMessage(message.text);
                    } else {
                        console.error('[Webview] ❌ Invalid info format:', message);
                    }
                    break;
                    
                case 'success':
                    if (message.text && typeof message.text === 'string') {
                        console.log('[Webview] ✅ Success:', message.text);
                        await displaySuccessMessage(message.text);
                    } else {
                        console.error('[Webview] ❌ Invalid success format:', message);
                    }
                    break;
                    
                case 'error':
                    if (message.text && typeof message.text === 'string') {
                        console.error('[Webview] ❌ Error:', message.text);
                        await displayErrorMessage(message.text, 'generation');
                    } else {
                        console.error('[Webview] ❌ Invalid error format:', message);
                        await displayErrorMessage('Unknown error occurred', 'generation');
                    }
                    break;
                    
                default:
                    console.log('[Webview] ❓ Unknown message command:', message.command);
            }
        }
        
        // PHASE 1: DOM readiness check with improved logging
        if (document.readyState === 'loading') {
            console.log('[Webview] DOM loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', initializeWebview);
        } else {
            console.log('[Webview] DOM ready, initializing immediately');
            initializeWebview();
        }
        
    })(); // End of IIFE
    
} // End of duplicate execution prevention block
