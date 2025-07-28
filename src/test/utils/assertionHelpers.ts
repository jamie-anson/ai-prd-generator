/**
 * @ts-nocheck
 * Assertion Helpers for Testing
 * 
 * Logic: Provides reusable assertion patterns and validation helpers
 * for consistent testing across all test files.
 */

import * as assert from 'assert';
import { ProjectState } from '../../webview/types';

/**
 * Project State Assertion Helpers
 */
export class ProjectStateAssertions {
    /**
     * Logic Step: Assert project state structure is valid
     * @param state Project state to validate
     * @param message Optional assertion message
     */
    public static assertValidProjectState(state: ProjectState, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        // Assert required boolean properties
        assert.strictEqual(typeof state.hasPRD, 'boolean', `${prefix}hasPRD must be boolean`);
        assert.strictEqual(typeof state.hasContextCards, 'boolean', `${prefix}hasContextCards must be boolean`);
        assert.strictEqual(typeof state.hasContextTemplates, 'boolean', `${prefix}hasContextTemplates must be boolean`);
        assert.strictEqual(typeof state.hasDataFlowDiagram, 'boolean', `${prefix}hasDataFlowDiagram must be boolean`);
        assert.strictEqual(typeof state.hasComponentHierarchy, 'boolean', `${prefix}hasComponentHierarchy must be boolean`);
        assert.strictEqual(typeof state.hasCCS, 'boolean', `${prefix}hasCCS must be boolean`);

        // Assert required number properties
        assert.strictEqual(typeof state.prdCount, 'number', `${prefix}prdCount must be number`);
        assert.strictEqual(typeof state.contextCardCount, 'number', `${prefix}contextCardCount must be number`);
        assert.strictEqual(typeof state.contextTemplateCount, 'number', `${prefix}contextTemplateCount must be number`);
        assert.strictEqual(typeof state.ccsCount, 'number', `${prefix}ccsCount must be number`);

        // Assert required array properties
        assert.ok(Array.isArray(state.prdFiles), `${prefix}prdFiles must be array`);
        assert.ok(Array.isArray(state.contextCardFiles), `${prefix}contextCardFiles must be array`);
        assert.ok(Array.isArray(state.contextTemplateFiles), `${prefix}contextTemplateFiles must be array`);
        assert.ok(Array.isArray(state.dataFlowDiagramFiles), `${prefix}dataFlowDiagramFiles must be array`);
        assert.ok(Array.isArray(state.componentHierarchyFiles), `${prefix}componentHierarchyFiles must be array`);
        assert.ok(Array.isArray(state.ccsFiles), `${prefix}ccsFiles must be array`);

        // Assert consistency between boolean flags and counts
        if (state.hasPRD) {
            assert.ok(state.prdCount > 0, `${prefix}prdCount should be > 0 when hasPRD is true`);
            assert.ok(state.prdFiles.length > 0, `${prefix}prdFiles should not be empty when hasPRD is true`);
        } else {
            assert.strictEqual(state.prdCount, 0, `${prefix}prdCount should be 0 when hasPRD is false`);
            assert.strictEqual(state.prdFiles.length, 0, `${prefix}prdFiles should be empty when hasPRD is false`);
        }

        if (state.hasContextCards) {
            assert.ok(state.contextCardCount > 0, `${prefix}contextCardCount should be > 0 when hasContextCards is true`);
            assert.ok(state.contextCardFiles.length > 0, `${prefix}contextCardFiles should not be empty when hasContextCards is true`);
        } else {
            assert.strictEqual(state.contextCardCount, 0, `${prefix}contextCardCount should be 0 when hasContextCards is false`);
            assert.strictEqual(state.contextCardFiles.length, 0, `${prefix}contextCardFiles should be empty when hasContextCards is false`);
        }

        if (state.hasContextTemplates) {
            assert.ok(state.contextTemplateCount > 0, `${prefix}contextTemplateCount should be > 0 when hasContextTemplates is true`);
            assert.ok(state.contextTemplateFiles.length > 0, `${prefix}contextTemplateFiles should not be empty when hasContextTemplates is true`);
        } else {
            assert.strictEqual(state.contextTemplateCount, 0, `${prefix}contextTemplateCount should be 0 when hasContextTemplates is false`);
            assert.strictEqual(state.contextTemplateFiles.length, 0, `${prefix}contextTemplateFiles should be empty when hasContextTemplates is false`);
        }
    }

    /**
     * Logic Step: Assert project state matches expected values
     * @param actual Actual project state
     * @param expected Expected project state
     * @param message Optional assertion message
     */
    public static assertProjectStateEquals(actual: ProjectState, expected: ProjectState, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.strictEqual(actual.hasPRD, expected.hasPRD, `${prefix}hasPRD mismatch`);
        assert.strictEqual(actual.prdCount, expected.prdCount, `${prefix}prdCount mismatch`);
        assert.deepStrictEqual(actual.prdFiles, expected.prdFiles, `${prefix}prdFiles mismatch`);

        assert.strictEqual(actual.hasContextCards, expected.hasContextCards, `${prefix}hasContextCards mismatch`);
        assert.strictEqual(actual.contextCardCount, expected.contextCardCount, `${prefix}contextCardCount mismatch`);
        assert.deepStrictEqual(actual.contextCardFiles, expected.contextCardFiles, `${prefix}contextCardFiles mismatch`);

        assert.strictEqual(actual.hasContextTemplates, expected.hasContextTemplates, `${prefix}hasContextTemplates mismatch`);
        assert.strictEqual(actual.contextTemplateCount, expected.contextTemplateCount, `${prefix}contextTemplateCount mismatch`);
        assert.deepStrictEqual(actual.contextTemplateFiles, expected.contextTemplateFiles, `${prefix}contextTemplateFiles mismatch`);

        assert.strictEqual(actual.hasDataFlowDiagram, expected.hasDataFlowDiagram, `${prefix}hasDataFlowDiagram mismatch`);
        assert.deepStrictEqual(actual.dataFlowDiagramFiles, expected.dataFlowDiagramFiles, `${prefix}dataFlowDiagramFiles mismatch`);

        assert.strictEqual(actual.hasComponentHierarchy, expected.hasComponentHierarchy, `${prefix}hasComponentHierarchy mismatch`);
        assert.deepStrictEqual(actual.componentHierarchyFiles, expected.componentHierarchyFiles, `${prefix}componentHierarchyFiles mismatch`);

        assert.strictEqual(actual.hasCCS, expected.hasCCS, `${prefix}hasCCS mismatch`);
        assert.strictEqual(actual.ccsCount, expected.ccsCount, `${prefix}ccsCount mismatch`);
        assert.deepStrictEqual(actual.ccsFiles, expected.ccsFiles, `${prefix}ccsFiles mismatch`);
    }

    /**
     * Logic Step: Assert project state indicates empty project
     * @param state Project state to check
     * @param message Optional assertion message
     */
    public static assertEmptyProject(state: ProjectState, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.strictEqual(state.hasPRD, false, `${prefix}Empty project should not have PRD`);
        assert.strictEqual(state.hasContextCards, false, `${prefix}Empty project should not have context cards`);
        assert.strictEqual(state.hasContextTemplates, false, `${prefix}Empty project should not have context templates`);
        assert.strictEqual(state.hasDataFlowDiagram, false, `${prefix}Empty project should not have data flow diagram`);
        assert.strictEqual(state.hasComponentHierarchy, false, `${prefix}Empty project should not have component hierarchy`);
        assert.strictEqual(state.hasCCS, false, `${prefix}Empty project should not have CCS`);

        assert.strictEqual(state.prdCount, 0, `${prefix}Empty project should have 0 PRD count`);
        assert.strictEqual(state.contextCardCount, 0, `${prefix}Empty project should have 0 context card count`);
        assert.strictEqual(state.contextTemplateCount, 0, `${prefix}Empty project should have 0 context template count`);
        assert.strictEqual(state.ccsCount, 0, `${prefix}Empty project should have 0 CCS count`);
    }
}

/**
 * DOM Assertion Helpers
 */
export class DOMAssertions {
    /**
     * Logic Step: Assert element is visible (not hidden)
     * @param element DOM element to check
     * @param message Optional assertion message
     */
    public static assertElementVisible(element: Element | null, message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        assert.ok(element, `${prefix}Element should exist`);
        assert.ok(!element!.classList.contains('hidden'), `${prefix}Element should not have 'hidden' class`);
        
        // Check computed style if available
        if (element && 'getComputedStyle' in element.ownerDocument.defaultView!) {
            const style = element.ownerDocument.defaultView!.getComputedStyle(element);
            assert.notStrictEqual(style.display, 'none', `${prefix}Element should not have display: none`);
        }
    }

    /**
     * Logic Step: Assert element is hidden
     * @param element DOM element to check
     * @param message Optional assertion message
     */
    public static assertElementHidden(element: Element | null, message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        if (!element) {
            // Element not existing is considered hidden
            return;
        }

        const isHiddenByClass = element.classList.contains('hidden');
        let isHiddenByStyle = false;

        // Check computed style if available
        if ('getComputedStyle' in element.ownerDocument.defaultView!) {
            const style = element.ownerDocument.defaultView!.getComputedStyle(element);
            isHiddenByStyle = style.display === 'none';
        }

        assert.ok(isHiddenByClass || isHiddenByStyle, `${prefix}Element should be hidden by class or style`);
    }

    /**
     * Logic Step: Assert element has specific text content
     * @param element DOM element to check
     * @param expectedText Expected text content
     * @param message Optional assertion message
     */
    public static assertElementText(element: Element | null, expectedText: string, message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        assert.ok(element, `${prefix}Element should exist`);
        assert.strictEqual(element!.textContent?.trim(), expectedText, `${prefix}Element text content mismatch`);
    }

    /**
     * Logic Step: Assert element has specific attribute value
     * @param element DOM element to check
     * @param attributeName Attribute name to check
     * @param expectedValue Expected attribute value
     * @param message Optional assertion message
     */
    public static assertElementAttribute(
        element: Element | null, 
        attributeName: string, 
        expectedValue: string, 
        message?: string
    ): void {
        const prefix = message ? `${message}: ` : '';
        
        assert.ok(element, `${prefix}Element should exist`);
        assert.strictEqual(
            element!.getAttribute(attributeName), 
            expectedValue, 
            `${prefix}Element ${attributeName} attribute mismatch`
        );
    }

    /**
     * Logic Step: Assert no HTML comments are visible as text
     * @param document Document to check
     * @param message Optional assertion message
     */
    public static assertNoVisibleHTMLComments(document: Document, message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        const bodyText = document.body.textContent || '';
        
        // Check for common HTML comment patterns that shouldn't be visible
        assert.ok(!bodyText.includes('<!--'), `${prefix}Should not contain visible HTML comment start tags`);
        assert.ok(!bodyText.includes('-->'), `${prefix}Should not contain visible HTML comment end tags`);
        assert.ok(!bodyText.includes('<!-- '), `${prefix}Should not contain visible HTML comments with spaces`);
    }

    /**
     * Logic Step: Assert API key is properly obfuscated
     * @param element Element containing API key
     * @param message Optional assertion message
     */
    public static assertAPIKeyObfuscated(element: Element | null, message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        assert.ok(element, `${prefix}API key element should exist`);
        
        const text = element!.textContent || '';
        assert.ok(text.includes('sk-'), `${prefix}Should show API key prefix`);
        assert.ok(text.includes('*'), `${prefix}Should contain obfuscation asterisks`);
        assert.ok(text.length >= 20, `${prefix}Obfuscated key should be reasonable length`);
        
        // Should not contain the actual key (assuming test keys don't have many consecutive asterisks)
        const asteriskCount = (text.match(/\*/g) || []).length;
        assert.ok(asteriskCount >= 10, `${prefix}Should have sufficient obfuscation asterisks`);
    }
}

/**
 * API Response Assertion Helpers
 */
export class APIAssertions {
    /**
     * Logic Step: Assert OpenAI response structure is valid
     * @param response OpenAI API response
     * @param message Optional assertion message
     */
    public static assertValidOpenAIResponse(response: any, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.ok(response, `${prefix}Response should exist`);
        assert.ok(response.id, `${prefix}Response should have id`);
        assert.strictEqual(response.object, 'chat.completion', `${prefix}Response object should be chat.completion`);
        assert.ok(typeof response.created === 'number', `${prefix}Response should have created timestamp`);
        assert.ok(response.model, `${prefix}Response should have model`);
        assert.ok(Array.isArray(response.choices), `${prefix}Response should have choices array`);
        assert.ok(response.choices.length > 0, `${prefix}Response should have at least one choice`);
        assert.ok(response.usage, `${prefix}Response should have usage information`);

        // Validate first choice
        const choice = response.choices[0];
        assert.strictEqual(typeof choice.index, 'number', `${prefix}Choice should have index`);
        assert.ok(choice.message, `${prefix}Choice should have message`);
        assert.strictEqual(choice.message.role, 'assistant', `${prefix}Choice message should be from assistant`);
        assert.ok(choice.message.content, `${prefix}Choice message should have content`);
        assert.ok(choice.finish_reason, `${prefix}Choice should have finish_reason`);

        // Validate usage
        assert.ok(typeof response.usage.prompt_tokens === 'number', `${prefix}Usage should have prompt_tokens`);
        assert.ok(typeof response.usage.completion_tokens === 'number', `${prefix}Usage should have completion_tokens`);
        assert.ok(typeof response.usage.total_tokens === 'number', `${prefix}Usage should have total_tokens`);
    }

    /**
     * Logic Step: Assert OpenAI error response structure is valid
     * @param error OpenAI API error response
     * @param message Optional assertion message
     */
    public static assertValidOpenAIError(error: any, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.ok(error, `${prefix}Error should exist`);
        assert.ok(error.error, `${prefix}Error should have error property`);
        assert.ok(error.error.message, `${prefix}Error should have message`);
        assert.ok(error.error.type, `${prefix}Error should have type`);
        assert.ok(error.error.code, `${prefix}Error should have code`);
    }

    /**
     * Logic Step: Assert API response contains expected content type
     * @param response OpenAI API response
     * @param contentType Expected content type (prd, context, ccs)
     * @param message Optional assertion message
     */
    public static assertResponseContentType(response: any, contentType: 'prd' | 'context' | 'ccs', message?: string): void {
        const prefix = message ? `${message}: ` : '';
        
        this.assertValidOpenAIResponse(response, message);
        
        const content = (response.choices[0].message.content || '').toLowerCase();
        
        switch (contentType) {
            case 'prd':
                assert.ok(
                    content.includes('product requirements') || content.includes('prd') || content.includes('requirements document'),
                    `${prefix}Response should contain PRD-related content`
                );
                break;
            case 'context':
                assert.ok(
                    content.includes('context') || content.includes('architecture') || content.includes('component'),
                    `${prefix}Response should contain context-related content`
                );
                break;
            case 'ccs':
                assert.ok(
                    content.includes('comprehension') || content.includes('score') || content.includes('analysis'),
                    `${prefix}Response should contain CCS-related content`
                );
                break;
        }
    }
}

/**
 * Configuration Assertion Helpers
 */
export class ConfigAssertions {
    /**
     * Logic Step: Assert configuration has required keys
     * @param config Configuration object
     * @param requiredKeys Array of required configuration keys
     * @param message Optional assertion message
     */
    public static assertRequiredConfigKeys(config: any, requiredKeys: string[], message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.ok(config, `${prefix}Configuration should exist`);
        
        for (const key of requiredKeys) {
            assert.ok(config.get && typeof config.get === 'function', `${prefix}Configuration should have get method`);
            
            const value = config.get(key);
            assert.ok(value !== undefined, `${prefix}Configuration should have ${key}`);
        }
    }

    /**
     * Logic Step: Assert configuration paths are valid
     * @param config Configuration object
     * @param message Optional assertion message
     */
    public static assertValidConfigPaths(config: any, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        const pathKeys = [
            'aiPrdGenerator.prdOutput.prdPath',
            'aiPrdGenerator.contextCardOutput.contextCardPath',
            'aiPrdGenerator.contextTemplateOutput.contextTemplatePath',
            'aiPrdGenerator.diagramOutput.diagramPath',
            'aiPrdGenerator.ccsOutput.ccsPath'
        ];

        for (const key of pathKeys) {
            const path = config.get(key);
            assert.ok(path && typeof path === 'string', `${prefix}${key} should be a non-empty string`);
            assert.ok(path.length > 0, `${prefix}${key} should not be empty`);
            
            // Path should not start with / (should be relative)
            if (path.startsWith('/')) {
                console.warn(`${prefix}Warning: ${key} is an absolute path, which may cause issues`);
            }
        }
    }

    /**
     * Logic Step: Assert API key configuration is secure
     * @param config Configuration object
     * @param message Optional assertion message
     */
    public static assertSecureAPIKeyConfig(config: any, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        const apiKey = config.get('aiPrdGenerator.openAiApiKey');
        
        if (apiKey && apiKey.length > 0) {
            assert.ok(apiKey.startsWith('sk-'), `${prefix}API key should start with sk-`);
            assert.ok(apiKey.length >= 40, `${prefix}API key should be at least 40 characters`);
            
            // Should not be a placeholder or test value
            assert.ok(!apiKey.includes('your-api-key'), `${prefix}API key should not be placeholder`);
            assert.ok(!apiKey.includes('test-key'), `${prefix}API key should not be test placeholder`);
        }
    }
}

/**
 * Error Assertion Helpers
 */
export class ErrorAssertions {
    /**
     * Logic Step: Assert error has expected properties
     * @param error Error object
     * @param expectedMessage Expected error message (can be partial)
     * @param message Optional assertion message
     */
    public static assertErrorMessage(error: any, expectedMessage: string, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        assert.ok(error instanceof Error, `${prefix}Should be an Error instance`);
        assert.ok(error.message.includes(expectedMessage), `${prefix}Error message should contain "${expectedMessage}"`);
    }

    /**
     * Logic Step: Assert async function throws expected error
     * @param asyncFn Async function that should throw
     * @param expectedMessage Expected error message (can be partial)
     * @param message Optional assertion message
     */
    public static async assertAsyncThrows(
        asyncFn: () => Promise<any>, 
        expectedMessage: string, 
        message?: string
    ): Promise<void> {
        const prefix = message ? `${message}: ` : '';

        try {
            await asyncFn();
            assert.fail(`${prefix}Function should have thrown an error`);
        } catch (error) {
            this.assertErrorMessage(error, expectedMessage, message);
        }
    }

    /**
     * Logic Step: Assert function throws expected error
     * @param fn Function that should throw
     * @param expectedMessage Expected error message (can be partial)
     * @param message Optional assertion message
     */
    public static assertThrows(fn: () => any, expectedMessage: string, message?: string): void {
        const prefix = message ? `${message}: ` : '';

        try {
            fn();
            assert.fail(`${prefix}Function should have thrown an error`);
        } catch (error) {
            this.assertErrorMessage(error, expectedMessage, message);
        }
    }
}
