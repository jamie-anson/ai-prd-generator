// @ts-nocheck
/**
 * @file errorHandler.ts
 * @description Centralized error handling utility for the AI PRD Generator extension.
 * 
 * The logic of this file is to:
 * 1. Provide standardized error handling patterns across all handlers
 * 2. Centralize error logging and user notification logic
 * 3. Reduce code duplication by providing reusable error handling functions
 * 4. Support different error types (generation, file operations, API errors)
 * 5. Enable consistent error messaging and debugging information
 */

import * as vscode from 'vscode';

/**
 * Interface defining the structure of error context information
 */
export interface ErrorContext {
    operation: string;
    component?: string;
    filePath?: string;
    additionalInfo?: Record<string, any>;
}

/**
 * Enum defining different types of errors that can occur in the extension
 */
export enum ErrorType {
    GENERATION = 'generation',
    FILE_OPERATION = 'file_operation',
    API_ERROR = 'api_error',
    VALIDATION = 'validation',
    CONFIGURATION = 'configuration'
}

/**
 * Logic Step: Handle errors with standardized logging and user notification.
 * This is the main error handling function that provides consistent error processing
 * across all extension components. It logs detailed error information for debugging
 * and shows appropriate user-friendly messages.
 * @param error The error object that was thrown
 * @param context Context information about where and what operation failed
 * @param webview Optional webview instance to send error messages to
 */
export function handleError(
    error: any, 
    context: ErrorContext, 
    webview?: vscode.Webview
): void {
    // Logic Step: Generate detailed error message for logging
    const errorMessage = formatErrorMessage(error, context);
    
    // Logic Step: Log error details to console for debugging
    console.error(`[${context.component || 'Extension'}] ${errorMessage}`, {
        error: error,
        context: context,
        stack: error?.stack
    });

    // Logic Step: Show user-friendly error message
    const userMessage = formatUserMessage(error, context);
    vscode.window.showErrorMessage(userMessage);

    // Logic Step: Send error to webview if available
    if (webview) {
        webview.postMessage({ 
            command: 'error', 
            text: userMessage 
        });
    }
}

/**
 * Logic Step: Handle generation-specific errors with context-aware messaging.
 * Specialized error handler for content generation operations (PRD, context cards, etc.)
 * @param error The error that occurred during generation
 * @param operation The type of generation operation that failed
 * @param webview Optional webview instance for error communication
 */
export function handleGenerationError(
    error: any, 
    operation: string, 
    webview?: vscode.Webview
): void {
    const context: ErrorContext = {
        operation: operation,
        component: 'Generator',
        additionalInfo: { type: ErrorType.GENERATION }
    };
    
    handleError(error, context, webview);
}

/**
 * Logic Step: Handle file operation errors with path information.
 * Specialized error handler for file system operations with enhanced context
 * @param error The error that occurred during file operation
 * @param operation The type of file operation that failed
 * @param filePath The path of the file that caused the error
 * @param webview Optional webview instance for error communication
 */
export function handleFileError(
    error: any, 
    operation: string, 
    filePath: string, 
    webview?: vscode.Webview
): void {
    const context: ErrorContext = {
        operation: operation,
        component: 'FileSystem',
        filePath: filePath,
        additionalInfo: { type: ErrorType.FILE_OPERATION }
    };
    
    handleError(error, context, webview);
}

/**
 * Logic Step: Handle API-related errors with service context.
 * Specialized error handler for external API calls (OpenAI, etc.)
 * @param error The error that occurred during API call
 * @param service The name of the service that failed
 * @param operation The specific API operation that failed
 * @param webview Optional webview instance for error communication
 */
export function handleApiError(
    error: any, 
    service: string, 
    operation: string, 
    webview?: vscode.Webview
): void {
    const context: ErrorContext = {
        operation: `${service} ${operation}`,
        component: 'API',
        additionalInfo: { 
            type: ErrorType.API_ERROR,
            service: service
        }
    };
    
    handleError(error, context, webview);
}

/**
 * Logic Step: Format detailed error message for logging purposes.
 * Creates comprehensive error information for debugging and troubleshooting
 * @param error The error object
 * @param context The error context information
 * @returns Formatted error message string
 */
function formatErrorMessage(error: any, context: ErrorContext): string {
    const parts = [
        `Error in ${context.operation}`,
        context.filePath ? `File: ${context.filePath}` : null,
        `Message: ${error?.message || 'Unknown error'}`,
        context.additionalInfo ? `Context: ${JSON.stringify(context.additionalInfo)}` : null
    ].filter(Boolean);
    
    return parts.join(' | ');
}

/**
 * Logic Step: Format user-friendly error message for display.
 * Creates concise, actionable error messages for end users
 * @param error The error object
 * @param context The error context information
 * @returns User-friendly error message string
 */
function formatUserMessage(error: any, context: ErrorContext): string {
    const operation = (context.operation || 'operation').toLowerCase();
    const baseMessage = `Failed to ${operation}`;
    
    // Logic Step: Provide specific guidance based on error type
    if (error?.message?.includes('API key')) {
        return `${baseMessage}: Please check your OpenAI API key configuration.`;
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        return `${baseMessage}: Network error. Please check your internet connection.`;
    }
    
    if (error?.message?.includes('permission') || error?.message?.includes('access')) {
        return `${baseMessage}: Permission denied. Please check file permissions.`;
    }
    
    // Logic Step: Return generic message with error details
    return `${baseMessage}: ${error?.message || 'Unknown error occurred'}`;
}

/**
 * Logic Step: Create error wrapper for async operations.
 * Utility function to wrap async operations with standardized error handling
 * @param operation The async operation to execute
 * @param context Error context information
 * @param webview Optional webview for error communication
 * @returns Promise that resolves with operation result or handles errors
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    webview?: vscode.Webview
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        handleError(error, context, webview);
        return undefined;
    }
}
