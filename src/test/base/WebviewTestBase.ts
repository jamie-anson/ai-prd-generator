/**
 * @ts-nocheck
 * Webview Test Base Class
 * 
 * Logic: Provides a base class for webview-related tests with common
 * setup, teardown, and utility methods for DOM manipulation and CSP testing.
 */

import { describe, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { WebviewTestManager, CSPValidationUtils, WebviewMessageUtils } from '../utils/webviewTestUtils';
import { DOMFixtureFactory, DOM_SELECTORS, CSS_CLASSES } from '../fixtures/domFixtures';
import { DOMAssertions } from '../utils/assertionHelpers';
import { ProjectState } from '../../webview/types';

/**
 * Base class for webview testing with common patterns and utilities
 */
export abstract class WebviewTestBase {
    protected webviewManager!: WebviewTestManager;
    protected document!: Document;
    protected sandbox!: sinon.SinonSandbox;

    /**
     * Logic Step: Initialize webview test environment
     * Override this method to provide custom setup
     */
    protected setup(options: any = {}): void {
        this.sandbox = sinon.createSandbox();
        this.webviewManager = new WebviewTestManager();
        this.webviewManager.setup(options);
        this.document = this.webviewManager.getDocument();
    }

    /**
     * Logic Step: Clean up test environment
     */
    protected teardown(): void {
        if (this.webviewManager) {
            this.webviewManager.teardown();
        }
        if (this.sandbox) {
            this.sandbox.restore();
        }
    }

    /**
     * Logic Step: Get element by selector with assertion
     * @param selector CSS selector
     * @param shouldExist Whether element should exist
     * @returns Element or null
     */
    protected getElement(selector: string, shouldExist: boolean = true): Element | null {
        const element = this.document.querySelector(selector);
        
        if (shouldExist && !element) {
            throw new Error(`Element not found: ${selector}`);
        }
        
        return element;
    }

    /**
     * Logic Step: Get element by ID with assertion
     * @param id Element ID
     * @param shouldExist Whether element should exist
     * @returns Element or null
     */
    protected getElementById(id: string, shouldExist: boolean = true): Element | null {
        const element = this.document.getElementById(id);
        
        if (shouldExist && !element) {
            throw new Error(`Element not found with ID: ${id}`);
        }
        
        return element;
    }

    /**
     * Logic Step: Assert element visibility state
     * @param selector Element selector
     * @param shouldBeVisible Expected visibility state
     * @param message Optional assertion message
     */
    protected assertElementVisibility(
        selector: string, 
        shouldBeVisible: boolean, 
        message?: string
    ): void {
        const element = this.getElement(selector, false);
        
        if (shouldBeVisible) {
            DOMAssertions.assertElementVisible(element, message);
        } else {
            DOMAssertions.assertElementHidden(element, message);
        }
    }

    /**
     * Logic Step: Assert element text content
     * @param selector Element selector
     * @param expectedText Expected text content
     * @param message Optional assertion message
     */
    protected assertElementText(
        selector: string, 
        expectedText: string, 
        message?: string
    ): void {
        const element = this.getElement(selector);
        DOMAssertions.assertElementText(element, expectedText, message);
    }

    /**
     * Logic Step: Simulate API key being set
     */
    protected simulateAPIKeySet(): void {
        this.webviewManager.simulateAPIKeySet();
    }

    /**
     * Logic Step: Simulate API key not being set
     */
    protected simulateAPIKeyNotSet(): void {
        this.webviewManager.simulateAPIKeyNotSet();
    }

    /**
     * Logic Step: Simulate PRD generation complete
     */
    protected simulatePRDGenerated(): void {
        this.webviewManager.simulatePRDGenerated();
    }

    /**
     * Logic Step: Simulate no PRD in project
     */
    protected simulateNoPRD(): void {
        this.webviewManager.simulateNoPRD();
    }

    /**
     * Logic Step: Simulate error state
     * @param errorMessage Error message to display
     */
    protected simulateError(errorMessage: string): void {
        this.webviewManager.simulateError(errorMessage);
    }

    /**
     * Logic Step: Simulate success state
     * @param successMessage Success message to display
     */
    protected simulateSuccess(successMessage: string): void {
        this.webviewManager.simulateSuccess(successMessage);
    }

    /**
     * Logic Step: Simulate progress state
     * @param progressMessage Progress message
     * @param percentage Progress percentage (0-100)
     */
    protected simulateProgress(progressMessage: string, percentage: number): void {
        this.webviewManager.simulateProgress(progressMessage, percentage);
    }

    /**
     * Logic Step: Test new user UI scenario
     */
    protected testNewUserScenario(): void {
        this.simulateAPIKeyNotSet();
        this.simulateNoPRD();

        // Verify API key input is visible
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_INPUT_CONTAINER, true, 'API key input should be visible for new user');
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_DISPLAY, false, 'API key display should be hidden for new user');

        // Verify PRD generation controls are visible
        this.assertElementVisibility(DOM_SELECTORS.GENERATION_CONTROLS, true, 'Generation controls should be visible for new user');
        this.assertElementVisibility(DOM_SELECTORS.POST_GENERATION_CONTROLS, false, 'Post-generation controls should be hidden for new user');

        // Verify context sections are hidden
        this.assertElementVisibility(DOM_SELECTORS.CONTEXT_CARDS_SECTION, false, 'Context cards should be hidden for new user');
        this.assertElementVisibility(DOM_SELECTORS.CONTEXT_TEMPLATES_SECTION, false, 'Context templates should be hidden for new user');
    }

    /**
     * Logic Step: Test experienced user UI scenario
     */
    protected testExperiencedUserScenario(): void {
        this.simulateAPIKeySet();
        this.simulatePRDGenerated();

        // Verify API key display is visible
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_INPUT_CONTAINER, false, 'API key input should be hidden for experienced user');
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_DISPLAY, true, 'API key display should be visible for experienced user');

        // Verify post-generation controls are visible
        this.assertElementVisibility(DOM_SELECTORS.GENERATION_CONTROLS, false, 'Generation controls should be hidden for experienced user');
        this.assertElementVisibility(DOM_SELECTORS.POST_GENERATION_CONTROLS, true, 'Post-generation controls should be visible for experienced user');

        // Verify context sections are visible
        this.assertElementVisibility(DOM_SELECTORS.CONTEXT_CARDS_SECTION, true, 'Context cards should be visible for experienced user');
        this.assertElementVisibility(DOM_SELECTORS.CONTEXT_TEMPLATES_SECTION, true, 'Context templates should be visible for experienced user');
    }

    /**
     * Logic Step: Test error display scenario
     * @param errorMessage Error message to test
     */
    protected testErrorScenario(errorMessage: string): void {
        this.simulateError(errorMessage);

        this.assertElementVisibility(DOM_SELECTORS.ERROR_CONTAINER, true, 'Error container should be visible');
        this.assertElementText(DOM_SELECTORS.ERROR_MESSAGE, errorMessage, 'Error message should match');
    }

    /**
     * Logic Step: Test progress display scenario
     * @param progressMessage Progress message to test
     * @param percentage Progress percentage to test
     */
    protected testProgressScenario(progressMessage: string, percentage: number): void {
        this.simulateProgress(progressMessage, percentage);

        this.assertElementVisibility(DOM_SELECTORS.PROGRESS_CONTAINER, true, 'Progress container should be visible');
        this.assertElementText(DOM_SELECTORS.PROGRESS_MESSAGE, progressMessage, 'Progress message should match');
        
        const progressFill = this.getElementById('progress-fill');
        if (progressFill) {
            const style = (progressFill as HTMLElement).style;
            if (style.width !== `${percentage}%`) {
                throw new Error(`Progress fill width should be ${percentage}%, but was ${style.width}`);
            }
        }
    }

    /**
     * Logic Step: Validate CSP configuration in HTML
     * @param html HTML content to validate
     * @param expectedNonce Expected nonce value
     */
    protected validateCSP(html: string, expectedNonce?: string): void {
        const cspContent = CSPValidationUtils.extractCSPContent(html);
        if (!cspContent) {
            throw new Error('CSP meta tag not found in HTML');
        }

        // Validate CSP directives
        if (!CSPValidationUtils.validateWebviewScriptsAllowed(cspContent)) {
            throw new Error('CSP does not allow webview scripts');
        }

        if (!CSPValidationUtils.validateWebviewStylesAllowed(cspContent)) {
            throw new Error('CSP does not allow webview styles');
        }

        if (!CSPValidationUtils.validateDefaultSrcRestricted(cspContent)) {
            throw new Error('CSP does not restrict default-src');
        }

        // Validate nonce usage if provided
        if (expectedNonce) {
            const actualNonce = CSPValidationUtils.extractNonce(html);
            if (actualNonce !== expectedNonce) {
                throw new Error(`Expected nonce ${expectedNonce}, but found ${actualNonce}`);
            }

            if (!CSPValidationUtils.validateScriptNonces(html, expectedNonce)) {
                throw new Error('Not all script tags have proper nonce');
            }

            if (!CSPValidationUtils.validateStyleNonces(html, expectedNonce)) {
                throw new Error('Not all style tags have proper nonce');
            }
        }

        // Check for CSP violations
        const violations = CSPValidationUtils.validateNoCSPViolations(html);
        if (violations.length > 0) {
            throw new Error(`CSP violations found: ${violations.join(', ')}`);
        }
    }

    /**
     * Logic Step: Create webview message for testing
     * @param command Message command
     * @param data Additional message data
     * @returns Mock webview message
     */
    protected createMessage(command: string, data: any = {}): any {
        return WebviewMessageUtils.createMessage(command, data);
    }

    /**
     * Logic Step: Create API key status message
     * @param hasApiKey Whether API key is set
     * @returns API key status message
     */
    protected createAPIKeyStatusMessage(hasApiKey: boolean): any {
        return WebviewMessageUtils.createAPIKeyStatusMessage(hasApiKey);
    }

    /**
     * Logic Step: Create project state update message
     * @param projectState Project state data
     * @returns Project state update message
     */
    protected createProjectStateMessage(projectState: ProjectState): any {
        return WebviewMessageUtils.createProjectStateMessage(projectState);
    }

    /**
     * Logic Step: Measure DOM operation performance
     * @param operation Function that performs DOM operations
     * @returns Execution time in milliseconds
     */
    protected measureDOMPerformance(operation: () => void): number {
        const startTime = performance.now();
        operation();
        const endTime = performance.now();
        return endTime - startTime;
    }

    /**
     * Logic Step: Assert DOM operation performance is within limits
     * @param operation Function that performs DOM operations
     * @param maxTimeMs Maximum acceptable time in milliseconds
     * @param operationName Name of the operation for error messages
     */
    protected assertDOMPerformance(
        operation: () => void, 
        maxTimeMs: number, 
        operationName: string
    ): void {
        const executionTime = this.measureDOMPerformance(operation);
        if (executionTime > maxTimeMs) {
            throw new Error(`${operationName} should complete within ${maxTimeMs}ms, but took ${executionTime.toFixed(2)}ms`);
        }
    }

    /**
     * Logic Step: Assert no HTML comments are visible as text
     */
    protected assertNoVisibleHTMLComments(): void {
        DOMAssertions.assertNoVisibleHTMLComments(this.document, 'HTML comments should not be visible');
    }

    /**
     * Logic Step: Assert API key is properly obfuscated
     * @param selector Selector for API key element
     */
    protected assertAPIKeyObfuscated(selector: string): void {
        const element = this.getElement(selector);
        DOMAssertions.assertAPIKeyObfuscated(element, 'API key should be properly obfuscated');
    }

    /**
     * Logic Step: Setup method to be called in beforeEach
     * Override this method in subclasses for custom setup
     */
    protected abstract setupTest(): void;

    /**
     * Logic Step: Teardown method to be called in afterEach
     * Override this method in subclasses for custom teardown
     */
    protected cleanupTest(): void {
        // Default implementation - can be overridden
    }

    /**
     * Logic Step: Create test suite with common setup/teardown
     * @param suiteName Name of the test suite
     * @param testDefinition Function that defines the tests
     */
    public static createTestSuite(
        suiteName: string, 
        testDefinition: (testInstance: any) => void
    ): void {
        describe(suiteName, function() {
            let testInstance: any;

            beforeEach(function() {
                testInstance = new (this.constructor as any)();
                testInstance.setupTest();
            });

            afterEach(function() {
                if (testInstance) {
                    testInstance.cleanupTest();
                    testInstance.teardown();
                }
            });

            testDefinition(testInstance);
        });
    }
}

/**
 * Specialized base class for CSP testing
 */
export abstract class CSPTestBase extends WebviewTestBase {
    protected nonce!: string;

    /**
     * Logic Step: Setup CSP test environment
     */
    protected setup(options: {
        nonce?: string;
        scriptUri?: string;
    } = {}): void {
        this.sandbox = sinon.createSandbox();
        this.nonce = options.nonce || CSPValidationUtils.generateTestNonce();
        
        const { dom, document } = DOMFixtureFactory.createCSPTestDOM(
            this.nonce, 
            options.scriptUri || 'main.js'
        );
        
        this.webviewManager = new WebviewTestManager();
        // Override the DOM with CSP-specific one
        (this.webviewManager as any).dom = dom;
        (this.webviewManager as any).document = document;
        this.document = document;
    }

    /**
     * Logic Step: Test CSP meta tag configuration
     */
    protected testCSPMetaTag(): void {
        const html = this.document.documentElement.outerHTML;
        this.validateCSP(html, this.nonce);
    }

    /**
     * Logic Step: Test nonce generation uniqueness
     */
    protected testNonceUniqueness(): void {
        const nonces = new Set<string>();
        const iterations = 10;

        for (let i = 0; i < iterations; i++) {
            const nonce = CSPValidationUtils.generateTestNonce();
            nonces.add(nonce);
        }

        if (nonces.size !== iterations) {
            throw new Error(`Generated ${nonces.size} unique nonces out of ${iterations} attempts`);
        }

        // Test nonce length and format
        const firstNonce = Array.from(nonces)[0];
        if (firstNonce.length < 16) {
            throw new Error(`Nonce should be at least 16 characters, but was ${firstNonce.length}`);
        }

        if (!/^[a-zA-Z0-9]+$/.test(firstNonce)) {
            throw new Error('Nonce should only contain alphanumeric characters');
        }
    }

    /**
     * Logic Step: Test script tag nonce application
     */
    protected testScriptNonces(): void {
        const html = this.document.documentElement.outerHTML;
        
        if (!CSPValidationUtils.validateScriptNonces(html, this.nonce)) {
            throw new Error('Script tags do not have proper nonce attributes');
        }
    }

    /**
     * Logic Step: Test style tag nonce application
     */
    protected testStyleNonces(): void {
        const html = this.document.documentElement.outerHTML;
        
        if (!CSPValidationUtils.validateStyleNonces(html, this.nonce)) {
            throw new Error('Style tags do not have proper nonce attributes');
        }
    }
}

/**
 * Specialized base class for UI state testing
 */
export abstract class UIStateTestBase extends WebviewTestBase {
    /**
     * Logic Step: Setup UI state test environment
     */
    protected setup(projectState?: {
        hasApiKey?: boolean;
        hasPRD?: boolean;
        hasContextCards?: boolean;
        hasContextTemplates?: boolean;
        hasCCS?: boolean;
    }): void {
        super.setup({ projectState });
    }

    /**
     * Logic Step: Test all standard UI state scenarios
     */
    protected testAllUIScenarios(): void {
        // Test new user scenario
        this.testNewUserScenario();

        // Reset and test experienced user scenario
        this.setup({
            hasApiKey: true,
            hasPRD: true,
            hasContextCards: true,
            hasContextTemplates: true
        });
        this.testExperiencedUserScenario();

        // Test error scenarios
        this.testErrorScenario('Test error message');

        // Test progress scenarios
        this.testProgressScenario('Processing...', 75);
    }

    /**
     * Logic Step: Test UI state transitions
     */
    protected testUIStateTransitions(): void {
        // Start with new user state
        this.simulateAPIKeyNotSet();
        this.simulateNoPRD();

        // Transition to API key set
        this.simulateAPIKeySet();
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_DISPLAY, true, 'API key display should appear after setting key');
        this.assertElementVisibility(DOM_SELECTORS.API_KEY_INPUT_CONTAINER, false, 'API key input should hide after setting key');

        // Transition to PRD generated
        this.simulatePRDGenerated();
        this.assertElementVisibility(DOM_SELECTORS.POST_GENERATION_CONTROLS, true, 'Post-generation controls should appear after PRD generation');
        this.assertElementVisibility(DOM_SELECTORS.GENERATION_CONTROLS, false, 'Generation controls should hide after PRD generation');
        this.assertElementVisibility(DOM_SELECTORS.CONTEXT_CARDS_SECTION, true, 'Context sections should appear after PRD generation');
    }

    /**
     * Logic Step: Test UI performance during state changes
     */
    protected testUIPerformance(): void {
        const maxUpdateTime = 50; // 50ms maximum for UI updates

        this.assertDOMPerformance(() => {
            this.simulateAPIKeySet();
        }, maxUpdateTime, 'API key state change');

        this.assertDOMPerformance(() => {
            this.simulatePRDGenerated();
        }, maxUpdateTime, 'PRD generation state change');

        this.assertDOMPerformance(() => {
            this.simulateProgress('Testing...', 50);
        }, maxUpdateTime, 'Progress update');

        this.assertDOMPerformance(() => {
            this.simulateError('Test error');
        }, maxUpdateTime, 'Error display');
    }
}
