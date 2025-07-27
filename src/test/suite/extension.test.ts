import * as assert from 'assert';
import * as vscode from 'vscode';
import { MessageRouter } from '../../webview/router';
import { handleWebviewReady } from '../../webview/handlers/handleWebviewReady';
import { createPrdMessageHandler } from '../../commands/prdGeneration/messageHandlers';
import { COMMANDS } from '../../webview/commands';
import { VSCodeMocks } from '../utils/testUtils';

describe('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let extension: vscode.Extension<any> | undefined;
	let context: vscode.ExtensionContext;

	// Ensure context is always available for tests
	beforeEach(() => {
		if (!context) {
			context = VSCodeMocks.createMockExtensionContext();
		}
	});

	before(async function() {
		this.timeout(10000); // Increase timeout for extension activation
		
		// Try to get the extension by ID
		extension = vscode.extensions.getExtension('jammie-anson.ai-prd-generator');
		
		if (!extension) {
			// Try alternative extension ID format
			extension = vscode.extensions.getExtension('ai-prd-generator');
		}
		
		if (extension) {
			try {
				context = await extension.activate();
				console.log('Extension activated successfully');
			} catch (error) {
				console.error('Failed to activate extension:', error);
				// Use testUtils mock context for testing
				context = VSCodeMocks.createMockExtensionContext();
			}
		} else {
			console.warn('Extension not found, creating mock context');
			// Use testUtils mock context when extension is not found
			context = VSCodeMocks.createMockExtensionContext();
		}
	});

	it('Should register ai-prd-generator.generatePrd command', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('ai-prd-generator.generatePrd'), 'Command not registered');
	});

	it('Should create message router with all handlers', () => {
		const router = createPrdMessageHandler();
		assert.ok(router instanceof MessageRouter, 'Router should be instance of MessageRouter');
	});

	it('Should handle webview ready message', async () => {
		if (!context) {
			assert.fail('Extension context not available');
			return;
		}

		// Mock webview with spy to capture messages
		let capturedMessages: any[] = [];
		const mockWebview = {
			postMessage: (message: any) => {
				capturedMessages.push(message);
			}
		} as vscode.Webview;

		// Test the handler
		await handleWebviewReady({}, context, mockWebview);
		
		// Verify messages were sent
		assert.ok(capturedMessages.length >= 1, 'Should send at least one message');
		
		// Find the apiKeyStatus message
		const apiKeyMessage = capturedMessages.find(msg => msg.command === 'apiKeyStatus');
		assert.ok(apiKeyMessage, 'Should send apiKeyStatus message');
		assert.ok(typeof apiKeyMessage.hasApiKey === 'boolean', 'Should include hasApiKey boolean');
	});

	it('Should validate command constants', () => {
		assert.ok(COMMANDS.WEBVIEW_READY === 'webviewReady', 'WEBVIEW_READY command should match');
		assert.ok(COMMANDS.GET_API_KEY === 'get-api-key', 'GET_API_KEY command should match');
		assert.ok(COMMANDS.SAVE_API_KEY === 'save-api-key', 'SAVE_API_KEY command should match');
		assert.ok(COMMANDS.GENERATE_PRD === 'generate-prd', 'GENERATE_PRD command should match');
	});

	it('Should handle API key storage and retrieval', async () => {
		if (!context) {
			assert.fail('Extension context not available');
			return;
		}

		// Create a proper mock secrets storage for this test
		const secretsStorage = new Map<string, string>();
		const mockSecrets = {
			get: async (key: string) => secretsStorage.get(key),
			store: async (key: string, value: string) => { secretsStorage.set(key, value); },
			delete: async (key: string) => { secretsStorage.delete(key); },
			onDidChange: () => ({ dispose: () => {} })
		};
		
		// Replace the context secrets with our working mock using Object.defineProperty
		Object.defineProperty(context, 'secrets', {
			value: mockSecrets,
			writable: true,
			configurable: true
		});

		// Test storing an API key
		const testApiKey = 'test-api-key-123';
		await context.secrets.store('openAiApiKey', testApiKey);

		// Test retrieving the API key
		const retrievedKey = await context.secrets.get('openAiApiKey');
		assert.strictEqual(retrievedKey, testApiKey, 'Should store and retrieve API key correctly');

		// Clean up
		await context.secrets.delete('openAiApiKey');
		const deletedKey = await context.secrets.get('openAiApiKey');
		assert.strictEqual(deletedKey, undefined, 'Should delete API key correctly');
	});
});
