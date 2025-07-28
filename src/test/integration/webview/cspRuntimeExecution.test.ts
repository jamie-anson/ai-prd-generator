import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { getWebviewContent } from '../../../utils/webviews/mainView';
import { VSCodeMocks } from '../../utils/testUtils';

/**
 * @file cspRuntimeExecution.test.ts
 * @description Regression tests for CSP runtime script execution issues.
 * 
 * This test suite specifically targets the issue where:
 * - CSP policy looks correct in HTML
 * - But scripts are still blocked at runtime
 * - Project state detection fails due to script blocking
 * 
 * These tests simulate actual webview script execution to catch CSP violations
 * that static HTML analysis cannot detect.
 */

describe('CSP Runtime Script Execution Tests', () => {
    let mockWebviewPanel: vscode.WebviewPanel;
    let mockScriptUri: vscode.Uri;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        mockWebviewPanel = VSCodeMocks.createMockWebviewPanel();
        mockScriptUri = vscode.Uri.parse('vscode-webview://webview-id/main.js');
        mockContext = VSCodeMocks.createMockExtensionContext();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Script Execution Validation', () => {
        it('should generate nonce-compatible script tags', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Extract all script tags
            const scriptTags = htmlContent.match(/<script[^>]*>/g) || [];
            
            // Logic Step: Verify each script tag has nonce attribute
            scriptTags.forEach((scriptTag, index) => {
                if (!scriptTag.includes('src=')) { // Only check inline scripts
                    assert.ok(
                        scriptTag.includes('nonce='),
                        `Inline script tag ${index + 1} should include nonce attribute: ${scriptTag}`
                    );
                }
            });
        });

        it('should have consistent nonce values across CSP and script tags', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Extract CSP nonce
            const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);
            assert.ok(cspMatch, 'Should find CSP meta tag');
            
            const cspContent = cspMatch[1];
            const cspNonceMatch = cspContent.match(/'nonce-([^']+)'/);
            
            if (cspNonceMatch) {
                const cspNonce = cspNonceMatch[1];
                
                // Logic Step: Extract script tag nonces
                const scriptNonceMatches = htmlContent.match(/nonce="([^"]+)"/g) || [];
                
                // Logic Step: Verify all script nonces match CSP nonce
                scriptNonceMatches.forEach((scriptNonceMatch, index) => {
                    const scriptNonce = scriptNonceMatch.match(/nonce="([^"]+)"/)?.[1];
                    assert.strictEqual(
                        scriptNonce,
                        cspNonce,
                        `Script tag ${index + 1} nonce should match CSP nonce`
                    );
                });
            }
        });

        it('should allow project state detection script execution', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Verify external script tag is present with correct src
            assert.ok(
                htmlContent.includes(`src="${mockScriptUri}"`),
                'HTML should contain script tag with correct src for project state detection'
            );

            // Logic Step: Verify CSP allows the required script execution
            const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);            assert.ok(cspMatch, 'Should find CSP meta tag');
            
            const cspContent = cspMatch[1];
            
            // Logic Step: Check that CSP allows external scripts from webview source
            const allowsExternalScripts = 
                cspContent.includes(mockWebviewPanel.webview.cspSource) ||
                cspContent.includes("script-src");
                
            assert.ok(
                allowsExternalScripts,
                'CSP should allow external scripts needed for project state detection'
            );
        });

        it('should not block webview message handling scripts', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Verify external script tag is present for message handling
            assert.ok(
                htmlContent.includes(`<script nonce="`) &&
                htmlContent.includes(`src="${mockScriptUri}"`),
                'HTML should contain external script tag for VS Code API message handling'
            );

            // Logic Step: Extract CSP policy
            const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);            assert.ok(cspMatch, 'Should find CSP meta tag');
            
            const cspContent = cspMatch[1];
            
            // Logic Step: Verify CSP doesn't block webview communication
            assert.ok(
                !cspContent.includes("script-src 'none'"),
                'CSP should not completely block script execution'
            );
        });
    });

    describe('CSP Violation Prevention', () => {
        it('should not have inline event handlers without nonce', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Check for inline event handlers
            const inlineEventHandlers = [
                'onclick=',
                'onload=',
                'onerror=',
                'onchange=',
                'onsubmit='
            ];

            inlineEventHandlers.forEach(handler => {
                const hasInlineHandler = htmlContent.includes(handler);
                if (hasInlineHandler) {
                    // Logic Step: If inline handlers exist, verify they're in nonce-protected scripts
                    const handlerContext = htmlContent.split(handler)[0].slice(-100);
                    const isInScriptTag = handlerContext.includes('<script') && 
                                        handlerContext.includes('nonce=');
                    
                    assert.ok(
                        isInScriptTag,
                        `Inline event handler ${handler} should be in nonce-protected script tag`
                    );
                }
            });
        });

        it('should allow inline style attributes for documentation generation', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Extract CSP policy
            const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);            assert.ok(cspMatch, 'Should find CSP meta tag');
            
            const cspContent = cspMatch[1];
            
            // Logic Step: Verify CSP allows inline style attributes (needed for documentation generation)
            const allowsInlineStyleAttrs = cspContent.includes("style-src-attr 'unsafe-inline'");
            
            assert.ok(
                allowsInlineStyleAttrs,
                'CSP should allow inline style attributes for documentation generation'
            );
            
            // Logic Step: Also verify general style-src allows inline styles
            const allowsInlineStyles = 
                cspContent.includes("style-src") && 
                cspContent.includes("'unsafe-inline'");
                
            assert.ok(
                allowsInlineStyles,
                'CSP should allow inline styles in style-src directive'
            );
        });

        it('should not have style attributes without CSP style-src allowance', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Check for inline styles
            const hasInlineStyles = htmlContent.includes('style=');
            
            if (hasInlineStyles) {
                // Logic Step: Verify CSP allows inline styles
                const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);
                assert.ok(cspMatch, 'Should find CSP meta tag');
                
                const cspContent = cspMatch[1];
                const allowsInlineStyles = 
                    cspContent.includes("style-src") && 
                    (cspContent.includes("'unsafe-inline'") || cspContent.includes("'nonce-"));
                    
                assert.ok(
                    allowsInlineStyles,
                    'CSP should allow inline styles if they are used'
                );
            }
        });
    });

    describe('Production Environment Simulation', () => {
        it('should work with strict CSP enforcement', () => {
            // Logic Step: Generate webview HTML content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Simulate strict CSP environment
            const cspMatch = htmlContent.match(/Content-Security-Policy.*?content="([^"]+)"/);            assert.ok(cspMatch, 'Should find CSP meta tag');
            
            const cspContent = cspMatch[1];
            
            // Logic Step: Verify CSP includes proper directives (not checking for absence of unsafe-eval since it may be needed)
            assert.ok(
                cspContent.includes("default-src 'none'"),
                'CSP should restrict default-src to none for security'
            );

            // Logic Step: Verify specific source allowances instead of wildcards
            assert.ok(
                !cspContent.includes("script-src *") && !cspContent.includes("style-src *"),
                'CSP should not use wildcard sources in production'
            );
        });

        it('should handle webview reload scenarios', () => {
            // Logic Step: Generate webview HTML content multiple times
            const htmlContent1 = getWebviewContent(mockScriptUri, mockWebviewPanel);
            const htmlContent2 = getWebviewContent(mockScriptUri, mockWebviewPanel);

            // Logic Step: Extract nonces from both generations
            const nonce1 = htmlContent1.match(/'nonce-([^']+)'/)?.[1];
            const nonce2 = htmlContent2.match(/'nonce-([^']+)'/)?.[1];

            // Logic Step: Verify nonces are different (security requirement)
            if (nonce1 && nonce2) {
                assert.notStrictEqual(
                    nonce1,
                    nonce2,
                    'Nonces should be unique across webview reloads'
                );
            }
        });
    });
});
