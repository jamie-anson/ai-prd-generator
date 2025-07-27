import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { VSCodeMocks } from '../../utils/testUtils';
import { ProjectStateDetector } from '../../../utils/projectStateDetector';
import { handleWebviewReady } from '../../../webview/handlers/handleWebviewReady';

/**
 * @file prdDetection.test.ts
 * @description Comprehensive tests for PRD detection logic to prevent recurring UI bugs.
 * 
 * These tests target a recurring issue where:
 * - Extension not detecting existing PRDs in workspace
 * - UI not updating to show post-generation controls when PRDs exist
 * - Project state detection logic failing
 * 
 * This test suite ensures PRD detection works correctly in all scenarios.
 */

describe('PRD Detection Integration Tests', () => {
    let vscodeMocks: VSCodeMocks;
    let mockContext: vscode.ExtensionContext;
    let mockWebview: vscode.Webview;
    let postMessageSpy: sinon.SinonSpy;
    let workspaceFoldersStub: sinon.SinonStub;
    let findFilesStub: sinon.SinonStub;

    beforeEach(() => {
        vscodeMocks = new VSCodeMocks();
        mockContext = VSCodeMocks.createMockExtensionContext();
        mockWebview = VSCodeMocks.createMockWebview();
        postMessageSpy = sinon.spy(mockWebview, 'postMessage');
        
        // Setup workspace folder mock
        const mockWorkspaceFolder = {
            uri: vscode.Uri.file('/test/workspace'),
            name: 'test-workspace',
            index: 0
        };
        workspaceFoldersStub = sinon.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);
        
        // Setup file finding mock
        findFilesStub = sinon.stub(vscode.workspace, 'findFiles');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('PRD File Detection', () => {
        it('should detect PRD files in mise-en-place-output directory', async () => {
            // Logic Step: Mock PRD files being found in output directory
            const mockPrdFiles = [
                vscode.Uri.file('/test/workspace/mise-en-place-output/product-requirements.md'),
                vscode.Uri.file('/test/workspace/mise-en-place-output/PRD.md')
            ];
            findFilesStub.resolves(mockPrdFiles);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify PRD detection
            assert.strictEqual(projectState.hasPRD, true, 'Should detect PRD files exist');
            assert.strictEqual(projectState.prdCount, 2, 'Should count correct number of PRD files');
            assert.strictEqual(projectState.prdFiles.length, 2, 'Should return correct PRD file array');
        });

        it('should detect PRD files in root directory', async () => {
            // Logic Step: Mock PRD files being found in root directory
            const mockPrdFiles = [
                vscode.Uri.file('/test/workspace/PRD.md')
            ];
            findFilesStub.resolves(mockPrdFiles);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify PRD detection
            assert.strictEqual(projectState.hasPRD, true, 'Should detect PRD files in root');
            assert.strictEqual(projectState.prdCount, 1, 'Should count root PRD file');
        });

        it('should detect PRD files with various naming patterns', async () => {
            // Logic Step: Mock PRD files with different naming patterns
            const mockPrdFiles = [
                vscode.Uri.file('/test/workspace/PRD.md'),
                vscode.Uri.file('/test/workspace/prd.md'),
                vscode.Uri.file('/test/workspace/product-requirements.md'),
                vscode.Uri.file('/test/workspace/ProductRequirements.md'),
                vscode.Uri.file('/test/workspace/mise-en-place-output/my-prd-document.md')
            ];
            findFilesStub.resolves(mockPrdFiles);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify all PRD patterns are detected
            assert.strictEqual(projectState.hasPRD, true, 'Should detect PRD files with various patterns');
            assert.strictEqual(projectState.prdCount, 5, 'Should count all PRD file patterns');
        });

        it('should not detect non-PRD markdown files as PRDs', async () => {
            // Logic Step: Mock non-PRD markdown files
            const mockFiles = [
                vscode.Uri.file('/test/workspace/README.md'),
                vscode.Uri.file('/test/workspace/CHANGELOG.md'),
                vscode.Uri.file('/test/workspace/docs/api.md')
            ];
            findFilesStub.resolves(mockFiles);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify non-PRD files are not detected as PRDs
            assert.strictEqual(projectState.hasPRD, false, 'Should not detect non-PRD files as PRDs');
            assert.strictEqual(projectState.prdCount, 0, 'Should not count non-PRD files');
        });

        it('should handle no workspace folders gracefully', async () => {
            // Logic Step: Mock no workspace folders
            workspaceFoldersStub.value(undefined);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify graceful handling
            assert.strictEqual(projectState.hasPRD, false, 'Should handle no workspace gracefully');
            assert.strictEqual(projectState.prdCount, 0, 'Should return zero count with no workspace');
            assert.strictEqual(projectState.prdFiles.length, 0, 'Should return empty array with no workspace');
        });

        it('should handle empty workspace folders gracefully', async () => {
            // Logic Step: Mock empty workspace folders array
            workspaceFoldersStub.value([]);

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify graceful handling
            assert.strictEqual(projectState.hasPRD, false, 'Should handle empty workspace gracefully');
            assert.strictEqual(projectState.prdCount, 0, 'Should return zero count with empty workspace');
        });
    });

    describe('PRD Detection Error Handling', () => {
        it('should handle file system errors gracefully', async () => {
            // Logic Step: Mock file system error
            findFilesStub.rejects(new Error('File system error'));

            // Logic Step: Call project state detection and ensure it doesn't throw
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify error is handled gracefully
            assert.strictEqual(projectState.hasPRD, false, 'Should handle file system errors gracefully');
            assert.strictEqual(projectState.prdCount, 0, 'Should return zero count on error');
        });

        it('should handle permission errors gracefully', async () => {
            // Logic Step: Mock permission error
            findFilesStub.rejects(new Error('EACCES: permission denied'));

            // Logic Step: Call project state detection
            const projectState = await ProjectStateDetector.detectProjectState();

            // Logic Step: Verify permission errors are handled
            assert.strictEqual(projectState.hasPRD, false, 'Should handle permission errors gracefully');
        });
    });

    describe('Webview PRD State Communication', () => {
        it('should send correct project state when PRDs exist', async () => {
            // Logic Step: Mock API key and PRD files
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');
            const mockPrdFiles = [vscode.Uri.file('/test/workspace/PRD.md')];
            findFilesStub.resolves(mockPrdFiles);

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify project state message
            const projectStateCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'project-state-update'
            );
            
            assert.ok(projectStateCall, 'Project state message should be sent');
            
            const projectState = projectStateCall.args[0].projectState;
            assert.strictEqual(projectState.hasPRD, true, 'Should indicate PRDs exist');
            assert.strictEqual(projectState.prdCount, 1, 'Should send correct PRD count');
            assert.ok(Array.isArray(projectState.prdFiles), 'Should send PRD files array');
        });

        it('should send correct project state when no PRDs exist', async () => {
            // Logic Step: Mock API key and no PRD files
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');
            findFilesStub.resolves([]);

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify project state message
            const projectStateCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'project-state-update'
            );
            
            assert.ok(projectStateCall, 'Project state message should be sent');
            
            const projectState = projectStateCall.args[0].projectState;
            assert.strictEqual(projectState.hasPRD, false, 'Should indicate no PRDs exist');
            assert.strictEqual(projectState.prdCount, 0, 'Should send zero PRD count');
            assert.strictEqual(projectState.prdFiles.length, 0, 'Should send empty PRD files array');
        });

        it('should send fallback project state on detection error', async () => {
            // Logic Step: Mock API key and file system error
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');
            findFilesStub.rejects(new Error('File system error'));

            // Logic Step: Call webview ready handler
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify fallback project state is sent
            const projectStateCall = postMessageSpy.getCalls().find(call => 
                call.args[0].command === 'project-state-update'
            );
            
            assert.ok(projectStateCall, 'Fallback project state should be sent on error');
            
            const projectState = projectStateCall.args[0].projectState;
            assert.strictEqual(projectState.hasPRD, false, 'Fallback should indicate no PRDs');
            assert.strictEqual(projectState.prdCount, 0, 'Fallback should have zero count');
        });
    });

    describe('PRD Detection Performance', () => {
        it('should complete PRD detection within reasonable time', async () => {
            // Logic Step: Mock large number of files
            const mockFiles = Array.from({ length: 100 }, (_, i) => 
                vscode.Uri.file(`/test/workspace/file${i}.md`)
            );
            findFilesStub.resolves(mockFiles);

            // Logic Step: Measure detection time
            const startTime = Date.now();
            await ProjectStateDetector.detectProjectState();
            const endTime = Date.now();

            // Logic Step: Verify reasonable performance
            const detectionTime = endTime - startTime;
            assert.ok(detectionTime < 5000, `PRD detection should complete in under 5 seconds, took ${detectionTime}ms`);
        });

        it('should limit file search results to prevent performance issues', async () => {
            // Logic Step: Verify findFiles is called with reasonable limits
            findFilesStub.resolves([]);
            
            await ProjectStateDetector.detectProjectState();

            // Logic Step: Check that file search has reasonable limits
            assert.ok(findFilesStub.called, 'File search should be called');
            
            // Verify search limits are applied (check call arguments)
            const findFilesCalls = findFilesStub.getCalls();
            findFilesCalls.forEach(call => {
                const limit = call.args[2]; // Third argument is the limit
                if (typeof limit === 'number') {
                    assert.ok(limit <= 100, 'File search limit should be reasonable to prevent performance issues');
                }
            });
        });
    });

    describe('PRD Detection Integration with UI State', () => {
        it('should trigger correct UI state when PRDs are detected', async () => {
            // Logic Step: This test verifies the end-to-end flow from detection to UI update
            // Mock PRD files existing
            const mockPrdFiles = [vscode.Uri.file('/test/workspace/PRD.md')];
            findFilesStub.resolves(mockPrdFiles);
            sinon.stub(mockContext.secrets, 'get').withArgs('openAiApiKey').resolves('sk-test123');

            // Logic Step: Call webview ready (simulates extension startup)
            await handleWebviewReady({ command: 'webviewReady' }, mockContext, mockWebview);

            // Logic Step: Verify the complete message flow
            const messages = postMessageSpy.getCalls().map(call => call.args[0]);
            
            // Should send API key status
            const apiKeyMessage = messages.find(m => m.command === 'apiKeyStatus');
            assert.ok(apiKeyMessage, 'Should send API key status');
            
            // Should send project state with PRD detection
            const projectStateMessage = messages.find(m => m.command === 'project-state-update');
            assert.ok(projectStateMessage, 'Should send project state');
            assert.strictEqual(projectStateMessage.projectState.hasPRD, true, 'Project state should indicate PRDs exist');
            
            // This simulates the UI receiving both messages and updating accordingly
            console.log('[Test] Simulated UI would receive:', {
                hasApiKey: apiKeyMessage.hasApiKey,
                hasPRD: projectStateMessage.projectState.hasPRD,
                expectedUIState: 'Should show post-generation controls, not PRD input'
            });
        });
    });
});
