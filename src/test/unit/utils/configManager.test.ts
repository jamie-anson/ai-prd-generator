/**
 * @ts-nocheck
 * Unit Tests for ConfigManager
 * 
 * Logic: Tests configuration management functionality including
 * setting retrieval, path resolution, and default value handling.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as ConfigManager from '../../../utils/configManager';
import { TestSetup, VSCodeMocks, TestDataFactory } from '../../utils/testUtils';
import { testConfig } from '../../test.config';

describe('ConfigManager Unit Tests', () => {
    let workspaceGetConfigStub: sinon.SinonStub;
    let workspaceFoldersStub: sinon.SinonStub;
    let uriJoinPathStub: sinon.SinonStub;
    
    beforeEach(() => {
        TestSetup.beforeEach();
        // Mock the actual vscode.workspace methods
        workspaceGetConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
        workspaceFoldersStub = sinon.stub(vscode.workspace, 'workspaceFolders' as any);
        uriJoinPathStub = sinon.stub(vscode.Uri, 'joinPath');
    });

    afterEach(() => {
        TestSetup.afterEach();
        workspaceGetConfigStub.restore();
        workspaceFoldersStub.restore();
        uriJoinPathStub.restore();
    });

    it('should retrieve OpenAI model configuration', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock configuration with custom model
        const mockConfig = TestDataFactory.createMockConfig({
            'aiPrdGenerator.openAiModel': 'gpt-4-turbo'
        });
        workspaceGetConfigStub.returns(mockConfig);

        // Logic Step: Test model retrieval
        const model = ConfigManager.getOpenAiModel();
        assert.strictEqual(model, 'gpt-4-turbo');
    });

    it('should return default model when not configured', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock empty configuration
        const mockConfig = TestDataFactory.createMockConfig({});
        workspaceGetConfigStub.returns(mockConfig);

        // Logic Step: Test default model
        const model = ConfigManager.getOpenAiModel();
        assert.strictEqual(model, 'gpt-4o');
    });

    it('should resolve PRD output path correctly', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock workspace and configuration
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/test/workspace');
        workspaceFoldersStub.value([{ uri: mockWorkspaceUri }]);
        const mockConfig = TestDataFactory.createMockConfig({
            'aiPrdGenerator.prdOutput.prdPath': 'custom/prd'
        });
        workspaceGetConfigStub.returns(mockConfig);
        
        // Logic Step: Mock Uri.joinPath to return expected path
        const expectedPath = VSCodeMocks.createMockUri('/test/workspace/custom/prd');
        uriJoinPathStub.returns(expectedPath);

        // Logic Step: Test path resolution
        const path = ConfigManager.getPrdOutputPath();
        assert.ok(uriJoinPathStub.calledWith(mockWorkspaceUri, 'custom/prd'));
        assert.strictEqual(path, expectedPath);
    });

    it('should handle missing workspace folder', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock no workspace folders
        workspaceFoldersStub.value(null);
        const mockConfig = TestDataFactory.createMockConfig();
        workspaceGetConfigStub.returns(mockConfig);

        // Logic Step: Test error handling
        assert.throws(() => {
            ConfigManager.getPrdOutputPath();
        }, /No workspace folder found/);
    });

    it('should resolve all output paths consistently', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Setup workspace
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/workspace');
        workspaceFoldersStub.value([{ uri: mockWorkspaceUri }]);
        const mockConfig = TestDataFactory.createMockConfig();
        workspaceGetConfigStub.returns(mockConfig);
        
        // Logic Step: Mock Uri.joinPath for different paths
        const mockPrdPath = VSCodeMocks.createMockUri('/workspace/mise-en-place-output/prd');
        const mockCardPath = VSCodeMocks.createMockUri('/workspace/mise-en-place-output/context-cards');
        const mockTemplatePath = VSCodeMocks.createMockUri('/workspace/mise-en-place-output/context-templates');
        
        uriJoinPathStub
            .withArgs(mockWorkspaceUri, 'mise-en-place-output/prd').returns(mockPrdPath)
            .withArgs(mockWorkspaceUri, 'mise-en-place-output/context-cards').returns(mockCardPath)
            .withArgs(mockWorkspaceUri, 'mise-en-place-output/context-templates').returns(mockTemplatePath);

        // Logic Step: Test all path methods
        const prdPath = ConfigManager.getPrdOutputPath();
        const cardPath = ConfigManager.getContextCardOutputPath();
        const templatePath = ConfigManager.getContextTemplateOutputPath();

        // Logic Step: Verify correct paths returned
        assert.strictEqual(prdPath, mockPrdPath);
        assert.strictEqual(cardPath, mockCardPath);
        assert.strictEqual(templatePath, mockTemplatePath);

        // Logic Step: Verify paths are different
        assert.notStrictEqual(prdPath, cardPath);
        assert.notStrictEqual(cardPath, templatePath);
        assert.notStrictEqual(prdPath, templatePath);
    });
});
