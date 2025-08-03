/**
 * @file generatePrd.test.ts
 * @description E2E tests for the 'generatePrd' command.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { TestSetup } from '../../utils/testSetup';

describe('Extension Command: generatePrd', () => {
    //- Logic Step: Activate the extension before running tests to ensure commands are registered
    before(async function () {
        this.timeout(20000); // Increase timeout for activation
        const extension = vscode.extensions.getExtension('jammie-anson.ai-prd-generator');
        if (!extension) {
            assert.fail('Extension could not be found.');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });


    beforeEach(() => {
        TestSetup.beforeEach();
    });

    afterEach(() => {
        TestSetup.afterEach();
    });

    it('should register the ai-prd-generator.generatePrd command', async () => {
        // The extension should be activated by the test runner
        const commands = await vscode.commands.getCommands(true);
        const commandExists = commands.includes('ai-prd-generator.generatePrd');
        assert.ok(commandExists, 'The command should be registered');
    });

    it('should create a webview panel when the command is executed', async () => {
        const createWebviewPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns({
            title: 'PRD Generator',
            webview: { onDidReceiveMessage: () => { } },
            onDidDispose: () => { },
            reveal: () => { },
            dispose: () => { }
        } as any);
        
        await vscode.commands.executeCommand('ai-prd-generator.generatePrd');

        //- Logic Step: Allow time for the webview panel to be created
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.ok(createWebviewPanelStub.calledOnce, 'createWebviewPanel should be called');
        
        const panel = createWebviewPanelStub.getCall(0).returnValue;
        assert.strictEqual(panel.title, 'PRD Generator', 'Panel should have the correct title');
        
        // Clean up the created panel
        panel.dispose();
    });
});
