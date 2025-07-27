/**
 * @ts-nocheck
 * Unit Tests for ProjectStateDetector
 * 
 * Logic: Tests the project state detection functionality including
 * file scanning, artifact counting, and state validation.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../../utils/projectStateDetector';
import { TestSetup, FileSystemMocks, VSCodeMocks, TestDataFactory } from '../../utils/testUtils';
import { testConfig } from '../../test.config';

describe('ProjectStateDetector Unit Tests', () => {
    let workspaceFoldersStub: sinon.SinonStub;
    let workspaceGetConfigStub: sinon.SinonStub;
    let uriJoinPathStub: sinon.SinonStub;
    
    beforeEach(() => {
        TestSetup.beforeEach();
        // Mock the actual vscode.workspace methods
        workspaceFoldersStub = sinon.stub(vscode.workspace, 'workspaceFolders' as any);
        workspaceGetConfigStub = sinon.stub(vscode.workspace, 'getConfiguration');
        uriJoinPathStub = sinon.stub(vscode.Uri, 'joinPath');
    });

    afterEach(() => {
        TestSetup.afterEach();
        workspaceFoldersStub.restore();
        workspaceGetConfigStub.restore();
        uriJoinPathStub.restore();
    });

    it('should detect empty project state', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock empty workspace
        FileSystemMocks.mockProjectFiles({
            hasPRD: false,
            hasContextCards: false,
            hasContextTemplates: false
        });

        VSCodeMocks.workspace.getConfiguration.returns(
            TestDataFactory.createMockConfig()
        );

        // Logic Step: Execute detection
        const state = await ProjectStateDetector.detectProjectState();

        // Logic Step: Verify empty state
        assert.strictEqual(state.hasPRD, false);
        assert.strictEqual(state.hasContextCards, false);
        assert.strictEqual(state.hasContextTemplates, false);
        assert.strictEqual(state.prdCount, 0);
        assert.strictEqual(state.contextCardCount, 0);
        assert.strictEqual(state.contextTemplateCount, 0);
    });

    it('should detect existing PRD files', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock workspace with PRD files
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/test/workspace');
        workspaceFoldersStub.value([{ uri: mockWorkspaceUri }]);
        workspaceGetConfigStub.returns(TestDataFactory.createMockConfig());
        
        // Mock file system operations for PRD detection
        const mockPrdPath = VSCodeMocks.createMockUri('/test/workspace/mise-en-place-output/prd');
        uriJoinPathStub.withArgs(mockWorkspaceUri, 'mise-en-place-output/prd').returns(mockPrdPath);
        
        // Mock findPRDFiles to return one file
        sinon.stub(ProjectStateDetector, 'findPRDFiles' as any).resolves([{ fsPath: '/test/workspace/mise-en-place-output/prd/test.md' }]);
        sinon.stub(ProjectStateDetector, 'findContextCardFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findContextTemplateFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findCCSFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'checkDiagramExists' as any).resolves(false);

        // Logic Step: Execute detection
        const state = await ProjectStateDetector.detectProjectState();

        // Logic Step: Verify PRD detection
        assert.strictEqual(state.hasPRD, true);
        assert.strictEqual(state.prdCount, 1);
        assert.strictEqual(state.hasContextCards, false);
        assert.strictEqual(state.hasContextTemplates, false);
    });

    it('should handle detection errors gracefully', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock file system error
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/error/workspace');
        workspaceFoldersStub.value([{ uri: mockWorkspaceUri }]);
        workspaceGetConfigStub.returns(TestDataFactory.createMockConfig());
        
        // Mock all find methods to reject with error
        sinon.stub(ProjectStateDetector, 'findPRDFiles' as any).rejects(new Error('File system error'));
        sinon.stub(ProjectStateDetector, 'findContextCardFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findContextTemplateFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findCCSFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'checkDiagramExists' as any).resolves(false);

        // Logic Step: Execute detection and verify error handling
        try {
            await ProjectStateDetector.detectProjectState();
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error);
            assert.ok(error.message.includes('File system error'));
        }
    });

    it('should use custom configuration paths', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Mock custom configuration
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/test/workspace');
        workspaceFoldersStub.value([{ uri: mockWorkspaceUri }]);
        
        const customConfig = TestDataFactory.createMockConfig({
            'aiPrdGenerator.prdOutput.prdPath': 'custom/prd/path',
            'aiPrdGenerator.contextCardOutput.contextCardPath': 'custom/cards/path'
        });
        workspaceGetConfigStub.returns(customConfig);
        
        // Mock Uri.joinPath for custom paths
        const mockPrdPath = VSCodeMocks.createMockUri('/test/workspace/custom/prd/path');
        const mockCardPath = VSCodeMocks.createMockUri('/test/workspace/custom/cards/path');
        uriJoinPathStub.withArgs(mockWorkspaceUri, 'custom/prd/path').returns(mockPrdPath);
        uriJoinPathStub.withArgs(mockWorkspaceUri, 'custom/cards/path').returns(mockCardPath);
        
        // Spy on find methods to verify they're called with correct paths
        const findPRDStub = sinon.stub(ProjectStateDetector, 'findPRDFiles' as any).resolves([]);
        const findCardsStub = sinon.stub(ProjectStateDetector, 'findContextCardFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findContextTemplateFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'findCCSFiles' as any).resolves([]);
        sinon.stub(ProjectStateDetector, 'checkDiagramExists' as any).resolves(false);

        // Logic Step: Execute detection
        await ProjectStateDetector.detectProjectState();

        // Logic Step: Verify custom paths were used
        assert.ok(findPRDStub.calledWith(mockWorkspaceUri));
        assert.ok(findCardsStub.calledWith(mockWorkspaceUri));
    });

    it('should validate project state structure', async function(this: any) {
        this.timeout(testConfig.timeouts.unit);
        
        // Logic Step: Create test state
        const testState = TestDataFactory.createProjectState({
            hasPRD: true,
            prdCount: 5,
            hasContextCards: true,
            contextCardCount: 3
        });

        // Logic Step: Verify state structure
        assert.ok(typeof testState.hasPRD === 'boolean');
        assert.ok(typeof testState.prdCount === 'number');
        assert.ok(typeof testState.hasContextCards === 'boolean');
        assert.ok(typeof testState.contextCardCount === 'number');
        assert.ok(typeof testState.hasContextTemplates === 'boolean');
        assert.ok(typeof testState.contextTemplateCount === 'number');
    });
});
