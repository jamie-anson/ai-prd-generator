// @ts-nocheck
/**
 * @file vsixPackage.test.ts
 * @description VSIX Package Integrity and Activation Smoke Tests
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { VSCodeMocks } from '../utils/testUtils';

describe('VSIX Package Smoke Tests', function () {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    this.timeout(5000); // 5 seconds, since we are just checking a file

    let vscodeMocks: VSCodeMocks;

    beforeEach(() => {
        vscodeMocks = new VSCodeMocks();
    });

    afterEach(() => {
        // Cleanup handled by VSCodeMocks if necessary
    });

    describe('Package Build and Integrity', () => {
        it('should find the VSIX package file', () => {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
            const version = packageJson.version;
            const vsixName = `${packageJson.name}-${version}.vsix`;
            const vsixPath = path.join(projectRoot, vsixName);

            assert.ok(fs.existsSync(vsixPath), `VSIX package should exist at ${vsixPath}. Please run 'npm run package' before running tests.`);
            
            const stats = fs.statSync(vsixPath);
            assert.ok(stats.size > 0, 'VSIX package should not be empty.');
        });

        it('should not contain problematic native dependencies', () => {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
            const problematicDeps = ['tree-sitter', 'tree-sitter-typescript', 'node-gyp', 'node-gyp-build'];
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            for (const dep of problematicDeps) {
                assert.ok(!allDeps[dep], `Should not contain problematic dependency: ${dep}`);
            }
        });
    });


    describe('Dependency and Module Resolution', () => {
        it('should resolve all critical imports', async function() {
            this.timeout(15000);
            try {
                const extension = await import('../../../out/extension.js');
                assert.ok(extension.activate, 'extension.js should export activate');
            } catch (error) {
                throw new Error(`Import resolution failed: ${error}`);
            }
        });
    });
});
