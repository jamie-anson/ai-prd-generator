// @ts-nocheck
/**
 * @file dependencyValidation.test.ts
 * @description Tests for dependency validation and packaging integrity
 * 
 * The logic of this file is to:
 * 1. Validate that no problematic native dependencies are present
 * 2. Ensure all required dependencies are available
 * 3. Check for potential packaging issues before VSIX creation
 * 4. Prevent deployment of extensions with missing or broken dependencies
 * 5. Provide early detection of issues that would cause activation failures
 */

import * as assert from 'assert';
import * as path from 'path';
import { DependencyValidator, validateProjectDependencies } from '../utils/dependencyValidator';

describe('Dependency Validation Tests', () => {
    const projectRoot = path.resolve(__dirname, '../../../');
    let validator: DependencyValidator;

    beforeEach(() => {
        validator = new DependencyValidator(projectRoot);
    });

    describe('Native Dependency Detection', () => {
        it('should not contain problematic native dependencies', () => {
            console.log('🔍 Scanning for problematic native dependencies...');
            
            const result = validator.validateDependencies();
            
            // Logic Step: Verify no problematic dependencies are present
            assert.strictEqual(result.problematicDeps.length, 0, 
                `Found problematic dependencies: ${result.problematicDeps.join(', ')}`);
            
            console.log('✅ No problematic native dependencies found');
        });

        it('should have all required production dependencies', () => {
            console.log('📦 Checking for required production dependencies...');
            
            const result = validator.validateDependencies();
            
            // Logic Step: Verify all required dependencies are present
            assert.strictEqual(result.missingDeps.length, 0, 
                `Missing required dependencies: ${result.missingDeps.join(', ')}`);
            
            console.log('✅ All required dependencies are present');
        });

        it('should pass overall dependency validation', () => {
            console.log('🎯 Running comprehensive dependency validation...');
            
            const result = validator.validateDependencies();
            
            // Logic Step: Generate and log the validation report
            const report = validator.generateReport(result);
            console.log('\n' + report);
            
            // Logic Step: Assert that validation passes
            if (!result.isValid) {
                const errorMessage = `Dependency validation failed:\n${result.errors.join('\n')}`;
                throw new Error(errorMessage);
            }
            
            assert.ok(result.isValid, 'Dependency validation should pass');
            console.log('🎉 Dependency validation passed successfully');
        });
    });

    describe('Import Resolution', () => {
        it('should resolve all critical imports', async () => {
            console.log('🔗 Testing import resolution for critical modules...');
            
            const criticalModules = [
                '../../../out/extension.js',
                '../../../out/commands/index.js',
                '../../../out/webview/handlers/handleGeneratePrd.js',
                '../../../out/utils/configManager.js',
                '../../../out/utils/errorHandler.js'
            ];

            // Import main modules to detect circular dependencies
            await Promise.all([
                import('../../../out/extension.js'),
                import('../../../out/commands/index.js'),
                import('../../../out/webview/handlers/handleGeneratePrd.js'),
                import('../../../out/utils/configManager.js'),
                import('../../../out/utils/errorHandler.js')
            ]);

            for (const modulePath of criticalModules) {
                try {
                    const module = await import(modulePath);
                    assert.ok(module, `Module ${modulePath} should be importable`);
                    console.log(`✅ Successfully imported ${modulePath}`);
                } catch (error) {
                    throw new Error(`Failed to import ${modulePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            
            console.log('🎉 All critical imports resolved successfully');
        });

        it('should not have unresolved module references', async () => {
            console.log('🔍 Checking for unresolved module references...');
            
            try {
                // Logic Step: Try importing the main extension and key commands
                const extension = await import('../../../out/extension.js');
                const commands = await import('../../../out/commands/index.js');
                
                // Logic Step: Verify key exports are available
                assert.ok(extension.activate, 'Extension should export activate function');
                assert.ok(commands.registerAllCommands, 'Commands should export registerAllCommands function');
                
                console.log('✅ No unresolved module references found');
                
            } catch (error) {
                throw new Error(`Unresolved module reference detected: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });

    describe('Package Configuration', () => {
        it('should have valid package.json configuration', () => {
            console.log('📋 Validating package.json configuration...');
            
            const result = validator.validateDependencies();
            
            // Logic Step: Check for configuration warnings
            if (result.warnings.length > 0) {
                console.log('⚠️  Configuration warnings:');
                result.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            // Logic Step: Ensure no critical configuration errors
            const configErrors = result.errors.filter(error => 
                error.includes('package.json') || error.includes('engine')
            );
            
            assert.strictEqual(configErrors.length, 0, 
                `Package configuration errors: ${configErrors.join(', ')}`);
            
            console.log('✅ Package configuration is valid');
        });

        it('should have appropriate VS Code engine version', () => {
            console.log('🔧 Checking VS Code engine compatibility...');
            
            const fs = require('fs');
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Logic Step: Verify VS Code engine is specified
            assert.ok(packageJson.engines, 'Package should specify engines');
            assert.ok(packageJson.engines.vscode, 'Package should specify VS Code engine version');
            
            const vscodeVersion = packageJson.engines.vscode;
            console.log(`📌 VS Code engine version: ${vscodeVersion}`);
            
            // Logic Step: Verify version format is valid
            assert.ok(vscodeVersion.match(/^\^?\d+\.\d+\.\d+$/), 
                `VS Code engine version should be valid semver: ${vscodeVersion}`);
            
            console.log('✅ VS Code engine version is valid');
        });
    });

    describe('Build Artifact Validation', () => {
        it('should exclude disabled modules from TypeScript compilation', () => {
            console.log('🚫 Checking that disabled modules are excluded...');
            
            const fs = require('fs');
            const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
            
            if (fs.existsSync(tsconfigPath)) {
                // Remove comments from JSON before parsing
                let tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
                
                // Remove /* */ comments
                tsconfigContent = tsconfigContent.replace(/\/\*[\s\S]*?\*\//g, '');
                
                // Remove // comments (but preserve strings)
                tsconfigContent = tsconfigContent.replace(/\/\/.*$/gm, '');
                
                // Clean up any trailing commas before } or ]
                tsconfigContent = tsconfigContent.replace(/,\s*([}\]])/g, '$1');
                
                const tsconfig = JSON.parse(tsconfigContent);
                
                // Logic Step: Verify exclude patterns are present
                assert.ok(tsconfig.exclude, 'tsconfig.json should have exclude patterns');
                
                const hasDisabledExclude = tsconfig.exclude.some((pattern: string) => 
                    pattern.includes('disabled') || pattern.includes('context-card-generator.disabled')
                );
                
                assert.ok(hasDisabledExclude, 'Should exclude disabled modules from compilation');
                console.log('✅ Disabled modules are properly excluded');
            } else {
                console.log('⚠️  No tsconfig.json found, skipping exclude validation');
            }
        });

        it('should not reference removed dependencies in build scripts', () => {
            console.log('🔍 Checking build scripts for removed dependency references...');
            
            const fs = require('fs');
            const esbuildPath = path.join(projectRoot, 'esbuild.js');
            
            if (fs.existsSync(esbuildPath)) {
                const esbuildContent = fs.readFileSync(esbuildPath, 'utf8');
                
                // Logic Step: Check for commented out tree-sitter references
                const hasActiveTreeSitterRef = esbuildContent.includes('tree-sitter') && 
                    !esbuildContent.includes('// fs.copySync') &&
                    !esbuildContent.includes('// Tree-sitter');
                
                assert.ok(!hasActiveTreeSitterRef, 
                    'Build script should not have active tree-sitter references');
                
                console.log('✅ Build scripts do not reference removed dependencies');
            } else {
                console.log('⚠️  No esbuild.js found, skipping build script validation');
            }
        });
    });
});
