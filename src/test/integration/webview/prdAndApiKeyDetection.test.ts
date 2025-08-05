/**
 * @file prdAndApiKeyDetection.test.ts
 * @description Integration tests for webview state communication.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../../utils/projectStateDetector';
import { handleWebviewReady } from '../../../webview/handlers/handleWebviewReady';
import * as configManager from '../../../utils/configManager';
import { TestSetup } from '../../utils/testSetup';
import { FileSystemManager } from '../../utils/fileSystemManager';

describe('Webview PRD and API Key Detection', () => {
    let postMessageStub: sinon.SinonStub;
    let mockWebview: vscode.Webview;
    let getApiKeyStub: sinon.SinonStub;
    let mockContext: vscode.ExtensionContext;
    let fileSystemManager: FileSystemManager;
    const originalGetWorkspaceUri = configManager.getWorkspaceUri;
    let detector: ProjectStateDetector;

    beforeEach(() => {
        TestSetup.beforeEach();
        fileSystemManager = new FileSystemManager();
        const workspaceRootUri = vscode.Uri.file(fileSystemManager.getWorkspaceRoot());

        postMessageStub = sinon.stub();
        mockWebview = { postMessage: postMessageStub } as any;
        
        const mockSecretStorage = {
            get: sinon.stub(),
            store: sinon.stub(),
            delete: sinon.stub(),
        };
        getApiKeyStub = mockSecretStorage.get;
        mockContext = { secrets: mockSecretStorage } as any;

        // Stub the getWorkspaceUri function and inject it
        const getWorkspaceUriStub = sinon.stub(configManager, 'getWorkspaceUri').resolves(workspaceRootUri);
        detector = ProjectStateDetector.getInstance();
        detector.setDependencies({
            getWorkspaceUri: getWorkspaceUriStub as any,
        });
    });

    afterEach(() => {
        TestSetup.afterEach();
        sinon.restore();
        fileSystemManager.cleanup();
        detector.setDependencies({
            getWorkspaceUri: originalGetWorkspaceUri,
        });
    });

    it('should send `hasApiKey: false` and empty project state', async () => {
        getApiKeyStub.resolves(undefined);

        await handleWebviewReady({}, mockContext, mockWebview);

        assert.ok(postMessageStub.calledWithMatch({ command: 'apiKeyStatus', hasApiKey: false }));
        const projectStateCall = postMessageStub.getCalls().find(call => call.args[0].command === 'project-state-update');
        assert.ok(projectStateCall, 'Project state update should have been sent');
        assert.strictEqual(projectStateCall.args[0].projectState.hasPRD, false);
    });

    it('should send `hasApiKey: true` and detected project state', async () => {
        getApiKeyStub.resolves('fake-api-key');
        fileSystemManager.createFile('mise-en-place-output/prd/my-prd.md', '# PRD Title');

        await handleWebviewReady({}, mockContext, mockWebview);

        assert.ok(postMessageStub.calledWithMatch({ command: 'apiKeyStatus', hasApiKey: true }));
        const projectStateCall = postMessageStub.getCalls().find(call => call.args[0].command === 'project-state-update');
        assert.ok(projectStateCall, 'Project state update should have been sent');
        assert.strictEqual(projectStateCall.args[0].projectState.hasPRD, true, 'Should detect PRD');
        assert.strictEqual(projectStateCall.args[0].projectState.prdCount, 1, 'Should count one PRD');
    });
});
