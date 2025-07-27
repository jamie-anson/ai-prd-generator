import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { COMMANDS } from '../../webview/commands';
import { PanelManager } from '../../commands/prdGeneration/panelManager';
import { MessageRouter } from '../../webview/router';
import { handleWebviewReady } from '../../webview/handlers/handleWebviewReady';

describe('Webview Panel Handshake Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    // Create a sandbox for our stubs and spies
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    // Restore the original functions after each test
    afterEach(() => {
        sandbox.restore();
    });

    it('Should send apiKeyStatus when webview sends webviewReady', async () => {
        // 1. Prepare a fake webview panel to intercept the real one.
        let webviewMessageListener: (message: any) => void;
        const postMessageSpy = sandbox.spy();
        const fakePanel = {
            webview: {
                onDidReceiveMessage: (listener: (message: any) => void) => {
                    webviewMessageListener = listener; // Capture the message handler
                },
                postMessage: postMessageSpy,
                asWebviewUri: (uri: vscode.Uri) => uri, // Mock the URI conversion
            },
            onDidDispose: () => {},
            reveal: () => {},
        };

        // 2. Stub the VS Code API to return our fake panel.
        const createWebviewPanelStub = sandbox.stub(vscode.window, 'createWebviewPanel').returns(fakePanel as any);

        // 3. Setup the router and PanelManager
        const router = new MessageRouter();
        router.register(COMMANDS.WEBVIEW_READY, handleWebviewReady); // Register the specific handler we're testing

        const fakeContext = {
            subscriptions: [],
            extensionUri: vscode.Uri.file(__dirname),
            secrets: {
                get: sandbox.stub().resolves(undefined), // Mock the secrets API
            },
        } as any;

        const panelManager = new PanelManager(fakeContext, router);

        // 4. Call the method that creates the panel
        await panelManager.createAndShowPanel();

        // 5. Assert that our stub was called, meaning the PanelManager tried to create a panel.
        assert.ok(createWebviewPanelStub.calledOnce, 'createWebviewPanel should have been called');

        // 6. Simulate the webview being ready by invoking the captured listener.
        assert.ok(webviewMessageListener!, 'Webview message listener should have been captured');
        await webviewMessageListener!({ command: COMMANDS.WEBVIEW_READY });

        // 7. Assert that the extension sent the correct status message back.
        assert.ok(postMessageSpy.calledWith({ command: 'apiKeyStatus', hasApiKey: false }),
            'postMessage should be called with apiKeyStatus after webview is ready');
    });
});
