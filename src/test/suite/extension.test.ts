import * as assert from 'assert';
import * as vscode from 'vscode';
import { MessageRouter } from '../../webview/router';
import { handleWebviewReady } from '../../webview/handlers/handleWebviewReady';
import { createPrdMessageHandler } from '../../commands/prdGeneration/messageHandlers';
import { COMMANDS } from '../../webview/commands';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let extension: vscode.Extension<any> | undefined;
	let context: vscode.ExtensionContext;

	suiteSetup(async () => {
		extension = vscode.extensions.getExtension('jammie-anson.ai-prd-generator');
		if (extension) {
			context = await extension.activate();
		}
	});

	test('Should register generatePrd command', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('ai-prd-generator.generatePrd'), 'Command not registered');
	});

	test('Should create message router with all handlers', () => {
		const router = createPrdMessageHandler();
		assert.ok(router instanceof MessageRouter, 'Router should be instance of MessageRouter');
	});

	test('Should handle webview ready message', async () => {
		if (!context) {
			assert.fail('Extension context not available');
			return;
		}

		// Mock webview
		const mockWebview = {
			postMessage: (message: any) => {
				assert.ok(message.command === 'apiKeyStatus', 'Should send apiKeyStatus message');
				assert.ok(typeof message.hasApiKey === 'boolean', 'Should include hasApiKey boolean');
			}
		} as vscode.Webview;

		// Test the handler
		await handleWebviewReady({}, context, mockWebview);
	});

	test('Should validate command constants', () => {
		assert.ok(COMMANDS.WEBVIEW_READY === 'webviewReady', 'WEBVIEW_READY command should match');
		assert.ok(COMMANDS.GET_API_KEY === 'get-api-key', 'GET_API_KEY command should match');
		assert.ok(COMMANDS.SAVE_API_KEY === 'save-api-key', 'SAVE_API_KEY command should match');
		assert.ok(COMMANDS.GENERATE_PRD === 'generate-prd', 'GENERATE_PRD command should match');
	});

	test('Should handle API key storage and retrieval', async () => {
		if (!context) {
			assert.fail('Extension context not available');
			return;
		}

		// Test storing an API key
		const testApiKey = 'test-api-key-123';
		await context.secrets.store('openAiApiKey', testApiKey);

		// Test retrieving the API key
		const retrievedKey = await context.secrets.get('openAiApiKey');
		assert.ok(retrievedKey === testApiKey, 'Should store and retrieve API key correctly');

		// Clean up
		await context.secrets.delete('openAiApiKey');
		const deletedKey = await context.secrets.get('openAiApiKey');
		assert.ok(deletedKey === undefined, 'Should delete API key correctly');
	});
});
