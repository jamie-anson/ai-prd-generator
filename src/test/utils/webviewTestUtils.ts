/**
 * @ts-nocheck
 * Webview Test Utilities
 * 
 * Logic: Provides specialized utilities for webview testing including
 * JSDOM setup, CSP validation, and webview-specific assertion helpers.
 */

import { JSDOM } from 'jsdom';
import * as assert from 'assert';
import { DOMFixtureFactory, DOM_SELECTORS, CSS_CLASSES } from '../fixtures/domFixtures';
import { DOMAssertions } from './assertionHelpers';

/**
 * Webview DOM Test Manager
 */
export class WebviewTestManager {
    private dom: JSDOM | null = null;
    private document: Document | null = null;

    /**
     * Logic Step: Initialize webview test environment
     * @param options Configuration options for DOM setup
     */
    public setup(options: {
        customHTML?: string;
        projectState?: {
            hasApiKey?: boolean;
            hasPRD?: boolean;
            hasContextCards?: boolean;
            hasContextTemplates?: boolean;
            hasCCS?: boolean;
        };
    } = {}): void {
        if (options.projectState) {
            const { dom, document } = DOMFixtureFactory.createProjectStateDOM(options.projectState);
            this.dom = dom;
            this.document = document;
        } else {
            const { dom, document } = DOMFixtureFactory.createWebviewDOM({
                customHTML: options.customHTML
            });
            this.dom = dom;
            this.document = document;
        }
    }

    /**
     * Logic Step: Clean up test environment
     */
    public teardown(): void {
        if (this.dom) {
            this.dom.window.close();
            this.dom = null;
            this.document = null;
        }
    }

    /**
     * Logic Step: Get document for testing
     * @returns Document instance
     */
    public getDocument(): Document {
        if (!this.document) {
            throw new Error('WebviewTestManager not initialized. Call setup() first.');
        }
        return this.document;
    }

    /**
     * Logic Step: Get element by selector with null safety
     * @param selector CSS selector
     * @returns Element or null
     */
    public getElement(selector: string): Element | null {
        return this.getDocument().querySelector(selector);
    }

    /**
     * Logic Step: Get element by ID with null safety
     * @param id Element ID
     * @returns Element or null
     */
    public getElementById(id: string): Element | null {
        return this.getDocument().getElementById(id);
    }

    /**
     * Logic Step: Simulate API key being set in UI
     */
    public simulateAPIKeySet(): void {
        const display = this.getElementById('api-key-display');
        const input = this.getElementById('api-key-input-container');
        
        display?.classList.remove(CSS_CLASSES.HIDDEN);
        input?.classList.add(CSS_CLASSES.HIDDEN);
    }

    /**
     * Logic Step: Simulate API key not set in UI
     */
    public simulateAPIKeyNotSet(): void {
        const display = this.getElementById('api-key-display');
        const input = this.getElementById('api-key-input-container');
        
        display?.classList.add(CSS_CLASSES.HIDDEN);
        input?.classList.remove(CSS_CLASSES.HIDDEN);
    }

    /**
     * Logic Step: Simulate PRD generation complete in UI
     */
    public simulatePRDGenerated(): void {
        const generation = this.getElementById('generation-controls');
        const postGeneration = this.getElementById('post-generation-controls');
        const contextCards = this.getElementById('context-cards-section');
        const contextTemplates = this.getElementById('context-templates-section');
        
        generation?.classList.add(CSS_CLASSES.HIDDEN);
        postGeneration?.classList.remove(CSS_CLASSES.HIDDEN);
        contextCards?.classList.remove(CSS_CLASSES.HIDDEN);
        contextTemplates?.classList.remove(CSS_CLASSES.HIDDEN);
    }

    /**
     * Logic Step: Simulate no PRD in project in UI
     */
    public simulateNoPRD(): void {
        const generation = this.getElementById('generation-controls');
        const postGeneration = this.getElementById('post-generation-controls');
        const contextCards = this.getElementById('context-cards-section');
        const contextTemplates = this.getElementById('context-templates-section');
        
        generation?.classList.remove(CSS_CLASSES.HIDDEN);
        postGeneration?.classList.add(CSS_CLASSES.HIDDEN);
        contextCards?.classList.add(CSS_CLASSES.HIDDEN);
        contextTemplates?.classList.add(CSS_CLASSES.HIDDEN);
    }

    /**
     * Logic Step: Simulate error state in UI
     * @param errorMessage Error message to display
     */
    public simulateError(errorMessage: string): void {
        const errorContainer = this.getElementById('error-container');
        const errorMessageEl = this.getElementById('error-message');
        
        if (errorContainer && errorMessageEl) {
            errorContainer.classList.remove(CSS_CLASSES.HIDDEN);
            errorMessageEl.textContent = errorMessage;
        }
    }

    /**
     * Logic Step: Simulate success state in UI
     * @param successMessage Success message to display
     */
    public simulateSuccess(successMessage: string): void {
        const successContainer = this.getElementById('success-container');
        const successMessageEl = this.getElementById('success-message');
        
        if (successContainer && successMessageEl) {
            successContainer.classList.remove(CSS_CLASSES.HIDDEN);
            successMessageEl.textContent = successMessage;
        }
    }

    /**
     * Logic Step: Simulate progress state in UI
     * @param progressMessage Progress message
     * @param percentage Progress percentage (0-100)
     */
    public simulateProgress(progressMessage: string, percentage: number): void {
        const progressContainer = this.getElementById('progress-container');
        const progressMessageEl = this.getElementById('progress-message');
        const progressFill = this.getElementById('progress-fill');
        
        if (progressContainer && progressMessageEl && progressFill) {
            progressContainer.classList.remove(CSS_CLASSES.HIDDEN);
            progressMessageEl.textContent = progressMessage;
            (progressFill as HTMLElement).style.width = `${percentage}%`;
        }
    }
}

/**
 * CSP Validation Utilities
 */
export class CSPValidationUtils {
    /**
     * Logic Step: Extract CSP content from HTML
     * @param html HTML content to parse
     * @returns CSP content string or null
     */
    public static extractCSPContent(html: string): string | null {
        const cspMatch = html.match(/Content-Security-Policy.*?content="([^"]+)"/);
        return cspMatch ? cspMatch[1] : null;
    }

    /**
     * Logic Step: Extract nonce from HTML
     * @param html HTML content to parse
     * @returns Nonce value or null
     */
    public static extractNonce(html: string): string | null {
        const nonceMatch = html.match(/nonce="([^"]+)"/);
        return nonceMatch ? nonceMatch[1] : null;
    }

    /**
     * Logic Step: Validate CSP allows webview scripts
     * @param cspContent CSP content string
     * @returns True if webview scripts are allowed
     */
    public static validateWebviewScriptsAllowed(cspContent: string): boolean {
        return cspContent.includes('script-src') && 
               (cspContent.includes('webview.cspSource') || cspContent.includes('unsafe-inline'));
    }

    /**
     * Logic Step: Validate CSP allows webview styles
     * @param cspContent CSP content string
     * @returns True if webview styles are allowed
     */
    public static validateWebviewStylesAllowed(cspContent: string): boolean {
        return cspContent.includes('style-src') && 
               (cspContent.includes('webview.cspSource') || cspContent.includes('unsafe-inline'));
    }

    /**
     * Logic Step: Validate CSP restricts default-src
     * @param cspContent CSP content string
     * @returns True if default-src is properly restricted
     */
    public static validateDefaultSrcRestricted(cspContent: string): boolean {
        return cspContent.includes("default-src 'none'");
    }

    /**
     * Logic Step: Validate nonce is applied to all script tags
     * @param html HTML content to check
     * @param nonce Expected nonce value
     * @returns True if all script tags have the nonce
     */
    public static validateScriptNonces(html: string, nonce: string): boolean {
        const scriptTags = html.match(/<script[^>]*>/g) || [];
        
        for (const scriptTag of scriptTags) {
            // Skip external scripts without nonce (they should be allowed by CSP)
            if (scriptTag.includes('src=') && !scriptTag.includes('nonce=')) {
                continue;
            }
            
            // Inline scripts must have nonce
            if (!scriptTag.includes('src=') && !scriptTag.includes(`nonce="${nonce}"`)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Logic Step: Validate nonce is applied to all style tags
     * @param html HTML content to check
     * @param nonce Expected nonce value
     * @returns True if all style tags have the nonce
     */
    public static validateStyleNonces(html: string, nonce: string): boolean {
        const styleTags = html.match(/<style[^>]*>/g) || [];
        
        for (const styleTag of styleTags) {
            if (!styleTag.includes(`nonce="${nonce}"`)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Logic Step: Validate HTML contains no CSP violations
     * @param html HTML content to check
     * @returns Array of violation descriptions (empty if no violations)
     */
    public static validateNoCSPViolations(html: string): string[] {
        const violations: string[] = [];

        // Check for javascript: URLs
        if (html.includes('javascript:')) {
            violations.push('Contains javascript: URLs');
        }

        // Check for eval() calls
        if (html.includes('eval(')) {
            violations.push('Contains eval() calls');
        }

        // Check for innerHTML assignments
        if (html.includes('innerHTML =')) {
            violations.push('Contains innerHTML assignments');
        }

        // Check for inline event handlers (except onerror which is allowed for script loading)
        const eventHandlers = ['onclick', 'onload', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'];
        for (const handler of eventHandlers) {
            if (html.includes(handler + '=')) {
                violations.push(`Contains ${handler} event handler`);
            }
        }

        return violations;
    }

    /**
     * Logic Step: Generate unique nonce for testing
     * @returns Random nonce string
     */
    public static generateTestNonce(): string {
        return Math.random().toString(36).substring(2, 18);
    }
}

/**
 * Webview Message Testing Utilities
 */
export class WebviewMessageUtils {
    /**
     * Logic Step: Create mock webview message
     * @param command Message command
     * @param data Additional message data
     * @returns Mock webview message
     */
    public static createMessage(command: string, data: any = {}): any {
        return {
            command,
            ...data
        };
    }

    /**
     * Logic Step: Create API key status message
     * @param hasApiKey Whether API key is set
     * @returns API key status message
     */
    public static createAPIKeyStatusMessage(hasApiKey: boolean): any {
        return this.createMessage('apiKeyStatus', { hasApiKey });
    }

    /**
     * Logic Step: Create project state update message
     * @param projectState Project state data
     * @returns Project state update message
     */
    public static createProjectStateMessage(projectState: any): any {
        return this.createMessage('project-state-update', { projectState });
    }

    /**
     * Logic Step: Create generation complete message
     * @param type Generation type (prd, context-cards, etc.)
     * @param success Whether generation was successful
     * @param filePath Path to generated file (if successful)
     * @returns Generation complete message
     */
    public static createGenerationCompleteMessage(
        type: string, 
        success: boolean, 
        filePath?: string
    ): any {
        return this.createMessage('generation-complete', {
            type,
            success,
            filePath
        });
    }

    /**
     * Logic Step: Create error message
     * @param error Error message or object
     * @returns Error message
     */
    public static createErrorMessage(error: string | Error): any {
        const errorMessage = error instanceof Error ? error.message : error;
        return this.createMessage('error', { error: errorMessage });
    }

    /**
     * Logic Step: Create progress update message
     * @param message Progress message
     * @param percentage Progress percentage (0-100)
     * @returns Progress update message
     */
    public static createProgressMessage(message: string, percentage: number): any {
        return this.createMessage('progress', { message, percentage });
    }
}

/**
 * Webview UI State Testing Utilities
 */
export class UIStateTestUtils {
    /**
     * Logic Step: Test complete new user scenario
     * @param testManager WebviewTestManager instance
     */
    public static testNewUserScenario(testManager: WebviewTestManager): void {
        // Simulate new user state
        testManager.simulateAPIKeyNotSet();
        testManager.simulateNoPRD();

        const document = testManager.getDocument();

        // Verify API key input is visible
        const apiKeyInput = document.getElementById('api-key-input-container');
        const apiKeyDisplay = document.getElementById('api-key-display');
        DOMAssertions.assertElementVisible(apiKeyInput, 'API key input should be visible for new user');
        DOMAssertions.assertElementHidden(apiKeyDisplay, 'API key display should be hidden for new user');

        // Verify PRD generation controls are visible
        const generationControls = document.getElementById('generation-controls');
        const postGenerationControls = document.getElementById('post-generation-controls');
        DOMAssertions.assertElementVisible(generationControls, 'Generation controls should be visible for new user');
        DOMAssertions.assertElementHidden(postGenerationControls, 'Post-generation controls should be hidden for new user');

        // Verify context sections are hidden
        const contextCards = document.getElementById('context-cards-section');
        const contextTemplates = document.getElementById('context-templates-section');
        DOMAssertions.assertElementHidden(contextCards, 'Context cards should be hidden for new user');
        DOMAssertions.assertElementHidden(contextTemplates, 'Context templates should be hidden for new user');
    }

    /**
     * Logic Step: Test complete experienced user scenario
     * @param testManager WebviewTestManager instance
     */
    public static testExperiencedUserScenario(testManager: WebviewTestManager): void {
        // Simulate experienced user state
        testManager.simulateAPIKeySet();
        testManager.simulatePRDGenerated();

        const document = testManager.getDocument();

        // Verify API key display is visible
        const apiKeyInput = document.getElementById('api-key-input-container');
        const apiKeyDisplay = document.getElementById('api-key-display');
        DOMAssertions.assertElementHidden(apiKeyInput, 'API key input should be hidden for experienced user');
        DOMAssertions.assertElementVisible(apiKeyDisplay, 'API key display should be visible for experienced user');

        // Verify post-generation controls are visible
        const generationControls = document.getElementById('generation-controls');
        const postGenerationControls = document.getElementById('post-generation-controls');
        DOMAssertions.assertElementHidden(generationControls, 'Generation controls should be hidden for experienced user');
        DOMAssertions.assertElementVisible(postGenerationControls, 'Post-generation controls should be visible for experienced user');

        // Verify context sections are visible
        const contextCards = document.getElementById('context-cards-section');
        const contextTemplates = document.getElementById('context-templates-section');
        DOMAssertions.assertElementVisible(contextCards, 'Context cards should be visible for experienced user');
        DOMAssertions.assertElementVisible(contextTemplates, 'Context templates should be visible for experienced user');
    }

    /**
     * Logic Step: Test error state scenario
     * @param testManager WebviewTestManager instance
     * @param errorMessage Error message to test
     */
    public static testErrorScenario(testManager: WebviewTestManager, errorMessage: string): void {
        testManager.simulateError(errorMessage);

        const document = testManager.getDocument();
        const errorContainer = document.getElementById('error-container');
        const errorMessageEl = document.getElementById('error-message');

        DOMAssertions.assertElementVisible(errorContainer, 'Error container should be visible');
        DOMAssertions.assertElementText(errorMessageEl, errorMessage, 'Error message should match');
    }

    /**
     * Logic Step: Test progress state scenario
     * @param testManager WebviewTestManager instance
     * @param progressMessage Progress message to test
     * @param percentage Progress percentage to test
     */
    public static testProgressScenario(
        testManager: WebviewTestManager, 
        progressMessage: string, 
        percentage: number
    ): void {
        testManager.simulateProgress(progressMessage, percentage);

        const document = testManager.getDocument();
        const progressContainer = document.getElementById('progress-container');
        const progressMessageEl = document.getElementById('progress-message');
        const progressFill = document.getElementById('progress-fill');

        DOMAssertions.assertElementVisible(progressContainer, 'Progress container should be visible');
        DOMAssertions.assertElementText(progressMessageEl, progressMessage, 'Progress message should match');
        
        if (progressFill) {
            const style = (progressFill as HTMLElement).style;
            assert.strictEqual(style.width, `${percentage}%`, 'Progress fill width should match percentage');
        }
    }
}

/**
 * Webview Performance Testing Utilities
 */
export class WebviewPerformanceUtils {
    /**
     * Logic Step: Measure DOM manipulation performance
     * @param operation Function that performs DOM operations
     * @returns Execution time in milliseconds
     */
    public static measureDOMOperation(operation: () => void): number {
        const startTime = performance.now();
        operation();
        const endTime = performance.now();
        return endTime - startTime;
    }

    /**
     * Logic Step: Test DOM operation performance is within acceptable limits
     * @param operation Function that performs DOM operations
     * @param maxTimeMs Maximum acceptable time in milliseconds
     * @param operationName Name of the operation for error messages
     */
    public static assertDOMPerformance(
        operation: () => void, 
        maxTimeMs: number, 
        operationName: string
    ): void {
        const executionTime = this.measureDOMOperation(operation);
        assert.ok(
            executionTime <= maxTimeMs, 
            `${operationName} should complete within ${maxTimeMs}ms, but took ${executionTime.toFixed(2)}ms`
        );
    }

    /**
     * Logic Step: Test multiple DOM operations for performance consistency
     * @param operation Function that performs DOM operations
     * @param iterations Number of iterations to test
     * @param maxAverageTimeMs Maximum acceptable average time
     * @param operationName Name of the operation for error messages
     */
    public static assertConsistentDOMPerformance(
        operation: () => void,
        iterations: number,
        maxAverageTimeMs: number,
        operationName: string
    ): void {
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            times.push(this.measureDOMOperation(operation));
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        assert.ok(
            averageTime <= maxAverageTimeMs,
            `${operationName} average time should be <= ${maxAverageTimeMs}ms, but was ${averageTime.toFixed(2)}ms`
        );
        
        // Log performance statistics for debugging
        console.log(`${operationName} Performance Stats:`, {
            average: averageTime.toFixed(2) + 'ms',
            min: minTime.toFixed(2) + 'ms',
            max: maxTime.toFixed(2) + 'ms',
            iterations
        });
    }
}
