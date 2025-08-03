/**
 * @file projectStateDetector.test.ts
 * @description Unit tests for the ProjectStateDetector utility.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';

import * as vscode from 'vscode';
import { ProjectStateDetector } from '../../utils/projectStateDetector';
import * as configManager from '../../utils/configManager';
import { TestSetup } from '../utils/testSetup';

describe('ProjectStateDetector Unit Tests', () => {
    let findFilesStub: sinon.SinonStub;
    let getWorkspaceUriStub: sinon.SinonStub;

    beforeEach(() => {
        TestSetup.beforeEach();
        findFilesStub = sinon.stub(vscode.workspace, 'findFiles');
        getWorkspaceUriStub = sinon.stub(configManager, 'getWorkspaceUri');

        ProjectStateDetector.setDependencies({
            getWorkspaceUri: getWorkspaceUriStub,
        });
    });

    // Helper to create a single, robust stub for findFiles that checks base and pattern
    const setupFindFilesStub = (filesByPattern: { base: string; pattern: string; uris: vscode.Uri[] }[]) => {
        findFilesStub.callsFake(async (relativePattern: vscode.RelativePattern) => {
            const base = relativePattern.base as any;
            const baseFsPath = typeof base === 'string' ? base : base.fsPath;

            const match = filesByPattern.find(p => 
                p.base === baseFsPath && 
                p.pattern === relativePattern.pattern
            );
            return Promise.resolve(match ? match.uris : []);
        });
    };

    afterEach(() => {
        sinon.restore();
        ProjectStateDetector.setDependencies({
            getWorkspaceUri: configManager.getWorkspaceUri,
        });
    });

    it('should return an empty state when no workspace is open', async () => {
        getWorkspaceUriStub.resolves(null);

        const state = await ProjectStateDetector.detectProjectState();

        assert.deepStrictEqual(state, ProjectStateDetector.getEmptyProjectState());
    });

    it('should detect existing PRD files correctly', async () => {
        const mockWorkspaceUri = vscode.Uri.file('/test/workspace');
        getWorkspaceUriStub.resolves(mockWorkspaceUri);

        const prdFileUri = vscode.Uri.file('/test/workspace/prd/my-prd.md');

        // Mock the findFiles behavior for the new logic
        setupFindFilesStub([
            // Mock for legacy 'prd' folder search
            { 
                base: vscode.Uri.joinPath(mockWorkspaceUri, 'prd').fsPath, 
                pattern: '**/*.md', 
                uris: [prdFileUri] 
            },
            // Mock for root workspace search for common names
            { 
                base: mockWorkspaceUri.fsPath, 
                pattern: '{PRD.md,prd.md,product-requirements.md,ProductRequirements.md}', 
                uris: [] 
            }
        ]);

        const state = await ProjectStateDetector.detectProjectState();

        assert.strictEqual(state.hasPRD, true, 'Should detect that PRD files exist');
        assert.strictEqual(state.prdCount, 1, 'Should count one PRD file');
        assert.strictEqual(state.hasContextCards, false, 'Should not detect context cards');
    });

    it('should detect multiple types of artifacts', async () => {
        const mockWorkspaceUri = vscode.Uri.file('/test/workspace');
        getWorkspaceUriStub.resolves(mockWorkspaceUri);

        const prdFileUris = [vscode.Uri.file('/test/workspace/prd/1.md'), vscode.Uri.file('/test/workspace/mise-en-place-output/prd/2.md')];
        const cardFileUris = [vscode.Uri.file('/test/workspace/mise-en-place-output/development-guidelines/card.md')];

        // Mock the findFiles behavior for multiple artifact types
        setupFindFilesStub([
            // PRD searches
            { 
                base: vscode.Uri.joinPath(mockWorkspaceUri, 'mise-en-place-output/prd').fsPath, 
                pattern: '**/*.md', 
                uris: [prdFileUris[1]] 
            },
            { 
                base: vscode.Uri.joinPath(mockWorkspaceUri, 'prd').fsPath, 
                pattern: '**/*.md', 
                uris: [prdFileUris[0]] 
            },
            { 
                base: mockWorkspaceUri.fsPath, 
                pattern: '{PRD.md,prd.md,product-requirements.md,ProductRequirements.md}', 
                uris: [] 
            },
            // Context Card searches
            { 
                base: vscode.Uri.joinPath(mockWorkspaceUri, 'mise-en-place-output/development-guidelines').fsPath, 
                pattern: '**/*.md', 
                uris: cardFileUris 
            },
            { 
                base: vscode.Uri.joinPath(mockWorkspaceUri, 'mise-en-place-output/context-cards').fsPath, 
                pattern: '**/*.md', 
                uris: [] 
            },
        ]);

        const state = await ProjectStateDetector.detectProjectState();

        assert.strictEqual(state.hasPRD, true);
        assert.strictEqual(state.prdCount, 2);
        assert.strictEqual(state.hasContextCards, true);
        assert.strictEqual(state.contextCardCount, 1);
    });

    it('should handle file system errors gracefully', async () => {
        const mockWorkspaceUri = vscode.Uri.file('/test/workspace');
        getWorkspaceUriStub.resolves(mockWorkspaceUri);

        findFilesStub.rejects(new Error('Disk read error'));

        const state = await ProjectStateDetector.detectProjectState();

        assert.deepStrictEqual(state, ProjectStateDetector.getEmptyProjectState(), 'Should return an empty state on error');
    });
});
