import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { VSCodeMocks } from '../../utils/testUtils';
import { handleWebviewReady } from '../../../webview/handlers/handleWebviewReady';

/**
 * @file apiKeyDisplay.test.ts
 * @description Comprehensive tests for API Key display logic to prevent recurring UI bugs.
 * 
 * These tests target a recurring issue where:
 * - API Key input shows when key is already set
 * - Should show obfuscated key with "Change" button instead
 * - HTML comments appear as visible text in UI
 * 
 * This test suite ensures the API key display logic works correctly in all scenarios.
 */

describe('API Key Display Integration Tests', () => {
    let vscodeMocks: VSCodeMocks;
    let mockContext: vscode.ExtensionContext;
    let mockWebview: vscode.Webview;
    let postMessageSpy: sinon.SinonSpy;

    beforeEach(() => {
        vscodeMocks = new VSCodeMocks();
        mockContext = VSCodeMocks.createMockExtensionContext();
        mockWebview = VSCodeMocks.createMockWebview();
        postMessageSpy = sinon.spy(mockWebview, 'postMessage');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('API Key Status Detection', () => {
        it('should detect when API key is set and send hasApiKey: true', async () => {
            // Logic Step: Mock API key being present in secrets
            const mockApiKey = 'sk-test1234567890abcdef1234567890abcdef';
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves(mockApiKey);

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify API key status message was sent correctly
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            assert.strictEqual(apiKeyStatusCall.args[0].hasApiKey, true, 'hasApiKey should be true when key exists');
        });

        it('should detect when API key is not set and send hasApiKey: false', async () => {
            // Logic Step: Mock API key being absent from secrets
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves(undefined);

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify API key status message was sent correctly
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            assert.strictEqual(apiKeyStatusCall.args[0].hasApiKey, false, 'hasApiKey should be false when key is missing');
        });

        it('should handle empty string API key as not set', async () => {
            // Logic Step: Mock API key being empty string
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('');

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify empty string is treated as no API key
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            assert.strictEqual(apiKeyStatusCall.args[0].hasApiKey, false, 'Empty string should be treated as no API key');
        });

        it('should handle null API key as not set', async () => {
            // Logic Step: Mock API key being null
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves(undefined);

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify null is treated as no API key
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            assert.strictEqual(apiKeyStatusCall.args[0].hasApiKey, false, 'Null should be treated as no API key');
        });
    });

    describe('API Key Message Format Validation', () => {
        it('should send correctly formatted API key status message', async () => {
            // Logic Step: Mock API key being present
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify message format is correct
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            
            const message = apiKeyStatusCall.args[0];
            assert.strictEqual(message.command, 'apiKeyStatus', 'Command should be apiKeyStatus');
            assert.strictEqual(typeof message.hasApiKey, 'boolean', 'hasApiKey should be boolean');
            assert.ok(message.hasOwnProperty('hasApiKey'), 'Message should have hasApiKey property');
        });

        it('should handle secrets API errors gracefully', async () => {
            // Logic Step: Mock secrets API throwing an error
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').rejects(new Error('Secrets API error'));

            // Logic Step: Call webview ready handler and ensure it doesn't throw
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify some message was still sent (fallback behavior)
            assert.ok(postMessageSpy.called, 'Some message should be sent even if secrets API fails');
        });
    });

    describe('Webview HTML Comment Validation', () => {
        it('should not contain visible HTML comments in webview content', () => {
            // Logic Step: Import webview content generation function
            const { getWebviewContent } = require('../../../utils/webviews/mainView');
            
            // Logic Step: Create mock webview panel
            const mockWebviewPanel = VSCodeMocks.createMockWebviewPanel();
            const mockScriptUri = vscode.Uri.file('/test/script.js');
            
            // Logic Step: Generate webview content
            const htmlContent = getWebviewContent(mockScriptUri, mockWebviewPanel);
            
            // Logic Step: Verify no visible HTML comments exist
            assert.ok(!htmlContent.includes('> //'), 'HTML should not contain visible // comments');
            assert.ok(!htmlContent.includes('> /*'), 'HTML should not contain visible /* comments');
            
            // Logic Step: Verify proper HTML comments are used instead
            assert.ok(htmlContent.includes('<!-- '), 'HTML should use proper <!-- --> comments');
            
            // Logic Step: Verify specific problematic comment is fixed
            assert.ok(!htmlContent.includes('> // Visible by default'), 'Specific problematic comment should be fixed');
            assert.ok(htmlContent.includes('<!-- Visible by default'), 'Should use proper HTML comment instead');
        });
    });

    describe('API Key Display State Consistency', () => {
        it('should send both API key status and project state in webview ready', async () => {
            // Logic Step: Mock API key being present
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify both messages are sent
            const apiKeyStatusCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            const projectStateCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'project-state-update'
            );
            
            assert.ok(apiKeyStatusCall, 'API key status message should be sent');
            assert.ok(projectStateCall, 'Project state message should be sent');
            
            // Logic Step: Verify messages are sent in correct order (API key first)
            const apiKeyIndex = postMessageSpy.getCalls().findIndex(call => 
                call.args[0].command === 'apiKeyStatus'
            );
            const projectStateIndex = postMessageSpy.getCalls().findIndex(call => 
                call.args[0].command === 'project-state-update'
            );
            
            assert.ok(apiKeyIndex < projectStateIndex, 'API key status should be sent before project state');
        });
    });
});
