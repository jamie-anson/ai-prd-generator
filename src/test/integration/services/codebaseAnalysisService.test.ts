/**
 * @ts-nocheck
 * Integration Tests for CodebaseAnalysisService
 * 
 * Logic: Tests the complete codebase analysis workflow including
 * file scanning, analysis execution, and result formatting.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CodebaseAnalysisService } from '../../../services/codebaseAnalysisService';
import { TestSetup, FileSystemMocks, VSCodeMocks, TestDataFactory } from '../../utils/testUtils';
import { testConfig } from '../../test.config';

describe('CodebaseAnalysisService Integration Tests', () => {
    
    beforeEach(() => {
        TestSetup.beforeEach();
        TestSetup.setupIntegrationTest();
    });

    afterEach(() => {
        TestSetup.afterEach();
    });

    it('should analyze workspace and return complete analysis', async function(this: any) {
        this.timeout(testConfig.timeouts.integration);
        
        // Logic Step: Mock workspace structure
        VSCodeMocks.workspace.workspaceFolders = [{ uri: { fsPath: '/test/workspace' } }];
        
        // Logic Step: Mock file system with sample code files
        FileSystemMocks.readdir.resolves(['src', 'package.json', 'README.md']);
        FileSystemMocks.readFile.callsFake((path: string) => {
            if (path.includes('package.json')) {
                return Promise.resolve('{"name": "test-project", "dependencies": {}}');
            }
            if (path.includes('.ts')) {
                return Promise.resolve('export class TestClass { public method() {} }');
            }
            return Promise.resolve('# Test file content');
        });
        FileSystemMocks.pathExists.resolves(true);

        // Logic Step: Execute analysis
        const service = new CodebaseAnalysisService();
        const mockWorkspaceUri = { fsPath: '/test/workspace' } as any;
        const analysis = await service.analyzeWorkspace(mockWorkspaceUri);

        // Logic Step: Verify analysis structure
        assert.ok(analysis);
        assert.ok(typeof analysis.totalFiles === 'number');
        assert.ok(typeof analysis.totalLines === 'number');
        assert.ok(Array.isArray(analysis.sampleFiles));
        assert.ok(analysis.metadata);
        assert.ok(typeof analysis.hasTests === 'boolean');
        assert.ok(typeof analysis.hasDocumentation === 'boolean');
        assert.ok(typeof analysis.hasTypeDefinitions === 'boolean');
    });

    it('should handle large codebases with file limits', async function(this: any) {
        this.timeout(testConfig.timeouts.integration);
        
        // Logic Step: Mock large workspace
        VSCodeMocks.workspace.workspaceFolders = [{ uri: { fsPath: '/large/workspace' } }];
        
        // Logic Step: Mock many files
        const manyFiles = Array.from({ length: 1000 }, (_, i) => `file${i}.ts`);
        FileSystemMocks.readdir.resolves(manyFiles);
        FileSystemMocks.readFile.resolves('export const test = "content";');
        FileSystemMocks.pathExists.resolves(true);

        // Logic Step: Execute analysis with limits
        const service = new CodebaseAnalysisService();
        const mockWorkspaceUri = { fsPath: '/large/workspace' } as any;
        const analysis = await service.analyzeWorkspace(mockWorkspaceUri);

        // Logic Step: Verify limits were applied
        assert.ok(analysis.totalFiles <= 500); // Should respect file limits
        assert.ok(analysis.sampleFiles.length <= 20); // Should limit sample files
    });

    it('should detect quality indicators correctly', async function(this: any) {
        this.timeout(testConfig.timeouts.integration);
        
        // Logic Step: Mock FileSystemUtils methods directly instead of VS Code API
        const mockWorkspaceUri = VSCodeMocks.createMockUri('/quality/workspace');
        
        // Mock FileSystemUtils methods that are used by CodebaseAnalysisService
        const checkFileExistsStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'checkFileExists');
        checkFileExistsStub.resolves(true); // README exists
        
        const checkTestFilesStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'checkTestFiles');
        checkTestFilesStub.resolves(true); // Tests exist
        
        const checkTypeDefinitionsStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'checkTypeDefinitions');
        checkTypeDefinitionsStub.resolves(true); // TypeScript definitions exist
        
        const checkDocumentationStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'checkDocumentation');
        checkDocumentationStub.resolves(true); // Documentation exists
        
        const readDirectorySafeStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'readDirectorySafe');
        readDirectorySafeStub.resolves([
            ['src', vscode.FileType.Directory],
            ['tests', vscode.FileType.Directory],
            ['README.md', vscode.FileType.File],
            ['package.json', vscode.FileType.File],
            ['tsconfig.json', vscode.FileType.File]
        ]);
        
        const countLinesStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'countLines');
        countLinesStub.resolves(100);
        
        const readFileContentStub = sinon.stub(require('../../../utils/fileSystemUtils').FileSystemUtils, 'readFileContent');
        readFileContentStub.resolves('// Quality code content');

        try {
            // Logic Step: Execute analysis
            const service = new CodebaseAnalysisService();
            const analysis = await service.analyzeWorkspace(mockWorkspaceUri);

            // Logic Step: Verify quality indicators
            assert.strictEqual(analysis.hasTests, true, 'Should detect test files');
            assert.strictEqual(analysis.hasDocumentation, true, 'Should detect documentation');
            assert.strictEqual(analysis.hasTypeDefinitions, true, 'Should detect TypeScript definitions');
            assert.strictEqual(analysis.hasReadme, true, 'Should detect README file');
        } finally {
            // Logic Step: Clean up stubs
            checkFileExistsStub.restore();
            checkTestFilesStub.restore();
            checkTypeDefinitionsStub.restore();
            checkDocumentationStub.restore();
            readDirectorySafeStub.restore();
            countLinesStub.restore();
            readFileContentStub.restore();
        }
    });

    it('should handle analysis errors gracefully', async function(this: any) {
        this.timeout(testConfig.timeouts.integration);
        
        // Logic Step: Mock file system errors
        VSCodeMocks.workspace.workspaceFolders = [{ uri: { fsPath: '/error/workspace' } }];
        FileSystemMocks.readdir.rejects(new Error('Permission denied'));

        // Logic Step: Execute analysis and verify error handling
        const service = new CodebaseAnalysisService();
        const mockWorkspaceUri = { fsPath: '/error/workspace' } as any;
        const analysis = await service.analyzeWorkspace(mockWorkspaceUri);

        // Logic Step: Verify fallback analysis
        assert.ok(analysis);
        assert.strictEqual(analysis.totalFiles, 0);
        assert.strictEqual(analysis.totalLines, 0);
        assert.strictEqual(analysis.sampleFiles.length, 0);
    });
});
