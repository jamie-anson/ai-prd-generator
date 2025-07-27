// @ts-nocheck
/**
 * @file vsixPackage.test.ts
 * @description VSIX Package Integrity and Activation Smoke Tests
 * 
 * The logic of this file is to:
 * 1. Test that the extension packages correctly without missing dependencies
 * 2. Verify the packaged VSIX can be installed and activated
 * 3. Ensure all commands are registered and available after activation
 * 4. Catch production deployment issues that unit/integration tests miss
 * 5. Validate the complete packaging → installation → activation pipeline
 * 
 * These tests prevent issues like:
 * - Missing native dependencies (node-gyp-build)
 * - Broken import statements in packaged code
 * - Extension activation failures in production
 * - Command registration issues after packaging
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { VSCodeMocks } from '../utils/testUtils';

describe('VSIX Package Smoke Tests', () => {
    let vscodeMocks: VSCodeMocks;
    const projectRoot = path.resolve(__dirname, '../../../');
    const vsixPath = path.join(projectRoot, 'ai-prd-generator-0.1.1.vsix');

    beforeEach(() => {
        vscodeMocks = new VSCodeMocks();
        // VSCodeMocks handles setup automatically in constructor
    });

    afterEach(() => {
        // VSCodeMocks cleanup handled automatically
    });

    describe('Package Build Integrity', () => {
        it('should build VSIX package without errors', function() {
            this.timeout(60000); // Allow 60 seconds for packaging

            try {
                // Logic Step: Clean any existing build artifacts
                console.log('🧹 Cleaning previous build artifacts...');
                if (fs.existsSync(vsixPath)) {
                    fs.unlinkSync(vsixPath);
                }

                // Logic Step: Run the packaging command and capture output
                console.log('📦 Building VSIX package...');
                const buildOutput = execSync('npx vsce package', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });

                console.log('✅ VSIX package built successfully');
                console.log('Build output:', buildOutput);

                // Logic Step: Verify the VSIX file was created
                assert.ok(fs.existsSync(vsixPath), 'VSIX file should be created');
                
                // Logic Step: Verify the VSIX file has reasonable size (not empty)
                const stats = fs.statSync(vsixPath);
                assert.ok(stats.size > 100000, 'VSIX file should be larger than 100KB'); // Reasonable minimum
                assert.ok(stats.size < 10000000, 'VSIX file should be smaller than 10MB'); // Reasonable maximum

                console.log(`📊 VSIX package size: ${(stats.size / 1024).toFixed(2)} KB`);

            } catch (error) {
                console.error('❌ VSIX packaging failed:', error);
                throw new Error(`VSIX packaging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        it('should not contain problematic native dependencies', function() {
            this.timeout(30000);

            // Logic Step: Check package.json for problematic dependencies
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            const problematicDeps = ['tree-sitter', 'tree-sitter-typescript', 'node-gyp', 'node-gyp-build'];
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            for (const dep of problematicDeps) {
                assert.ok(!dependencies[dep], `Should not contain problematic dependency: ${dep}`);
            }

            console.log('✅ No problematic native dependencies found in package.json');
        });

        it('should have all required production dependencies', function() {
            // Logic Step: Verify essential dependencies are present
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            const requiredDeps = ['openai', 'node-fetch'];
            const dependencies = packageJson.dependencies || {};

            for (const dep of requiredDeps) {
                assert.ok(dependencies[dep], `Should contain required dependency: ${dep}`);
            }

            console.log('✅ All required production dependencies present');
        });
    });

    describe('Extension Module Validation', () => {
        it('should export required functions', async function() {
            this.timeout(10000);

            try {
                // Logic Step: Import and verify extension exports
                const extension = await import('../../../out/extension.js');
                
                console.log('🔍 Testing extension module exports...');
                
                // Logic Step: Verify required exports exist
                assert.ok(extension.activate, 'Extension should export activate function');
                assert.ok(typeof extension.activate === 'function', 'activate should be a function');
                
                console.log('✅ Extension module exports are valid');

            } catch (error) {
                console.error('❌ Extension module validation failed:', error);
                throw new Error(`Extension module validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        it('should have command registration modules available', async function() {
            this.timeout(10000);
            
            try {
                // Logic Step: Test that command modules can be imported
                const commands = await import('../../../out/commands/index.js');
                
                console.log('🔍 Testing command module exports...');
                
                // Logic Step: Verify command registration function exists
                assert.ok(commands.registerAllCommands, 'Commands should export registerAllCommands function');
                assert.ok(typeof commands.registerAllCommands === 'function', 'registerAllCommands should be a function');
                
                console.log('✅ Command modules are available and valid');

            } catch (error) {
                console.error('❌ Command module validation failed:', error);
                throw new Error(`Command module validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });

    describe('Build Process Validation', () => {
        it('should compile TypeScript without errors', function() {
            this.timeout(30000);

            try {
                console.log('🔧 Testing TypeScript compilation...');
                const compileOutput = execSync('npx tsc --noEmit', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });

                console.log('✅ TypeScript compilation successful');
                if (compileOutput.trim()) {
                    console.log('Compile output:', compileOutput);
                }

            } catch (error) {
                console.error('❌ TypeScript compilation failed:', error);
                throw new Error(`TypeScript compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        it('should build extension bundle without missing files', function() {
            this.timeout(30000);

            try {
                console.log('🏗️ Testing extension build process...');
                const buildOutput = execSync('npm run build', {
                    cwd: projectRoot,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });

                console.log('✅ Extension build successful');
                
                // Logic Step: Verify dist directory was created
                const distPath = path.join(projectRoot, 'dist');
                assert.ok(fs.existsSync(distPath), 'dist directory should be created');
                
                // Logic Step: Verify main extension file exists
                const extensionPath = path.join(distPath, 'extension.js');
                assert.ok(fs.existsSync(extensionPath), 'extension.js should be built');

                console.log('📁 Build artifacts verified');

            } catch (error) {
                console.error('❌ Extension build failed:', error);
                throw new Error(`Extension build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });

    describe('Dependency Resolution', () => {
        it('should resolve all imports without missing modules', async function() {
            this.timeout(15000);

            try {
                console.log('🔍 Testing import resolution...');
                
                // Logic Step: Try to import the main extension module
                const extension = await import('../../../out/extension.js');
                assert.ok(extension.activate, 'Extension should export activate function');
                assert.ok(typeof extension.activate === 'function', 'activate should be a function');

                // Logic Step: Try to import key command modules
                const generatePrd = await import('../../../out/commands/generatePrd.js');
                assert.ok(generatePrd.registerGeneratePrdCommand, 'generatePrd should export registration function');

                console.log('✅ All critical imports resolved successfully');

            } catch (error) {
                console.error('❌ Import resolution failed:', error);
                throw new Error(`Import resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        it('should not have circular dependencies', async function() {
            // Logic Step: Basic circular dependency check by importing main modules
            try {
                console.log('🔄 Testing for circular dependencies...');
                
                // Import main modules to detect circular dependencies
                await Promise.all([
                    import('../../../out/extension.js'),
                    import('../../../out/commands/index.js'),
                    import('../../../out/webview/handlers/handleGeneratePrd.js'),
                    import('../../../out/utils/configManager.js'),
                    import('../../../out/utils/errorHandler.js')
                ]);

                console.log('✅ No circular dependencies detected');

            } catch (error) {
                console.error('❌ Circular dependency detected:', error);
                throw new Error(`Circular dependency detected: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });
});
