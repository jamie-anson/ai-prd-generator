import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Should register generatePrd command', async () => {
		await vscode.extensions.getExtension('jammie-anson.ai-prd-generator')?.activate();
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('ai-prd-generator.generatePrd-dev'), 'Command not registered');
	});
});
