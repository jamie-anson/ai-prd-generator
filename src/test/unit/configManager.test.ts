/**
 * @file configManager.test.ts
 * @description Unit tests for the ConfigManager utility.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as ConfigManager from '../../utils/configManager';
import { TestSetup } from '../utils/testSetup';
import { VSCodeMocks } from '../utils/vscodeMocks';

describe('ConfigManager Unit Tests', () => {
    let getConfigurationStub: sinon.SinonStub;

    beforeEach(() => {
        TestSetup.beforeEach();
        getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
    });

    afterEach(() => {
        TestSetup.afterEach();
    });

    it('should retrieve the configured OpenAI model', () => {
        const mockConfig = VSCodeMocks.createMockConfig({ 'aiPrdGenerator.openAiModel': 'gpt-4-turbo' });
        getConfigurationStub.returns(mockConfig);

        const model = ConfigManager.getOpenAiModel();
        assert.strictEqual(model, 'gpt-4-turbo');
    });

    it('should return the default OpenAI model when not configured', () => {
        const mockConfig = VSCodeMocks.createMockConfig({});
        getConfigurationStub.returns(mockConfig);

        const model = ConfigManager.getOpenAiModel();
        assert.strictEqual(model, 'gpt-4o'); // Default model
    });

    describe('getWorkspaceUri', () => {
        it('should return the first workspace folder URI if available', () => {
            const mockUri = VSCodeMocks.createMockUri('/test/workspace');
            const mockWorkspaceFolder = VSCodeMocks.createMockWorkspaceFolder(mockUri);
            sinon.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);

            const result = ConfigManager.getWorkspaceUri();
            assert.deepStrictEqual(result, mockUri);
        });

        it('should return the active editor URI as a fallback', () => {
            sinon.stub(vscode.workspace, 'workspaceFolders').value([]);
            const mockEditorUri = VSCodeMocks.createMockUri('/test/editor/file.ts');
            sinon.stub(vscode.window, 'activeTextEditor').value({ document: { uri: mockEditorUri } });

            const result = ConfigManager.getWorkspaceUri();
            const expectedUri = VSCodeMocks.createMockUri('/test/editor');
            assert.strictEqual(result?.fsPath, expectedUri.fsPath);
        });

        it('should return null if no workspace or active editor is found', () => {
            sinon.stub(vscode.workspace, 'workspaceFolders').value(undefined);
            sinon.stub(vscode.window, 'activeTextEditor').value(undefined);

            const result = ConfigManager.getWorkspaceUri();
            assert.strictEqual(result, null);
        });
    });

    it('should resolve the PRD output path correctly', () => {
        const mockUri = VSCodeMocks.createMockUri('/test/workspace');
        sinon.stub(vscode.workspace, 'workspaceFolders').value([VSCodeMocks.createMockWorkspaceFolder(mockUri)]);
        const mockConfig = VSCodeMocks.createMockConfig({ 'aiPrdGenerator.prdOutput.prdPath': 'custom/prd' });
        getConfigurationStub.returns(mockConfig);

        const result = ConfigManager.getPrdOutputPath();
        const expected = vscode.Uri.joinPath(mockUri, 'custom/prd');
        assert.strictEqual(result?.fsPath, expected.fsPath);
    });
});
