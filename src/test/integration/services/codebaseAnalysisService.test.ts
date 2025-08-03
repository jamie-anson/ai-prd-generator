/**
 * @file codebaseAnalysisService.test.ts
 * @description Integration tests for the CodebaseAnalysisService.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodebaseAnalysisService } from '../../../services/codebaseAnalysisService';
import { FileSystemManager } from '../../utils/fileSystemManager';
import { TestSetup } from '../../utils/testSetup';

describe('CodebaseAnalysisService Integration Tests', () => {
    let fileSystemManager: FileSystemManager;
    let workspaceRootUri: vscode.Uri;

    beforeEach(() => {
        TestSetup.beforeEach();
        fileSystemManager = new FileSystemManager();
        workspaceRootUri = vscode.Uri.file(fileSystemManager.getWorkspaceRoot());

        // Create a mock project structure
        fileSystemManager.createFile('src/index.ts', 'console.log("hello");\n// another line');
        fileSystemManager.createFile('src/app.ts', 'const x = 1;');
        fileSystemManager.createFile('package.json', '{ "name": "test-project" }');
        fileSystemManager.createFile('README.md', '# Test Project');
    });

    afterEach(() => {
        TestSetup.afterEach();
        fileSystemManager.cleanup();
    });

    it('should correctly analyze a mock workspace', async () => {
        const service = new CodebaseAnalysisService();
        const analysis = await service.analyzeWorkspace(workspaceRootUri);

        assert.strictEqual(analysis.totalFiles, 4, 'Should count all files');
        assert.strictEqual(analysis.totalLines, 5, 'Should sum lines from all readable files');
        assert.deepStrictEqual(analysis.fileTypes, { '.ts': 2, '.json': 1, '.md': 1 }, 'Should correctly identify file types');
        assert.strictEqual(analysis.hasReadme, true, 'Should detect README.md');
    });

    it('should exclude files in node_modules by default', async () => {
        // Add a file in node_modules
        fileSystemManager.createFile('node_modules/library/index.js', 'module.exports = {};');

        const service = new CodebaseAnalysisService();
        const analysis = await service.analyzeWorkspace(workspaceRootUri);

        assert.strictEqual(analysis.totalFiles, 4, 'Should not count files in node_modules');
    });
});
