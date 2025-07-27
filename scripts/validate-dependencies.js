#!/usr/bin/env node

/**
 * @file validate-dependencies.js
 * @description CLI tool for validating extension dependencies before packaging
 * 
 * The logic of this script is to:
 * 1. Run dependency validation checks before VSIX packaging
 * 2. Provide early warning for potential deployment issues
 * 3. Exit with error code if validation fails (for CI/CD integration)
 * 4. Generate detailed reports for debugging dependency issues
 * 5. Prevent packaging of extensions with problematic dependencies
 */

const path = require('path');
const fs = require('fs');

// Import the dependency validator (we'll use require since this is a JS file)
const projectRoot = path.resolve(__dirname, '..');

/**
 * Logic Step: Simple dependency validator implementation for CLI use
 * This is a simplified version that doesn't require TypeScript compilation
 */
class SimpleDependencyValidator {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.packageJsonPath = path.join(projectRoot, 'package.json');
    }

    static PROBLEMATIC_DEPENDENCIES = [
        'tree-sitter',
        'tree-sitter-typescript',
        'node-gyp',
        'node-gyp-build',
        'native-addon',
        'node-addon-api',
        'prebuild-install'
    ];

    static REQUIRED_DEPENDENCIES = [
        'openai',
        'node-fetch'
    ];

    validateDependencies() {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            problematicDeps: [],
            missingDeps: []
        };

        try {
            // Logic Step: Load and parse package.json
            if (!fs.existsSync(this.packageJsonPath)) {
                result.errors.push('package.json not found');
                result.isValid = false;
                return result;
            }

            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };

            // Logic Step: Check for problematic dependencies
            for (const dep of SimpleDependencyValidator.PROBLEMATIC_DEPENDENCIES) {
                if (allDeps[dep]) {
                    result.problematicDeps.push(dep);
                    result.errors.push(`Problematic native dependency found: ${dep}`);
                    result.isValid = false;
                }
            }

            // Logic Step: Check for missing required dependencies
            const prodDeps = packageJson.dependencies || {};
            for (const dep of SimpleDependencyValidator.REQUIRED_DEPENDENCIES) {
                if (!prodDeps[dep]) {
                    result.missingDeps.push(dep);
                    result.errors.push(`Required dependency missing: ${dep}`);
                    result.isValid = false;
                }
            }

            // Logic Step: Check VS Code engine
            if (!packageJson.engines || !packageJson.engines.vscode) {
                result.warnings.push('No VS Code engine version specified');
            }

            // Logic Step: Check for overly broad version ranges
            for (const [dep, version] of Object.entries(allDeps)) {
                if (version.startsWith('*') || version.startsWith('^0.')) {
                    result.warnings.push(`Potentially unstable version range for ${dep}: ${version}`);
                }
            }

        } catch (error) {
            result.errors.push(`Failed to validate dependencies: ${error.message}`);
            result.isValid = false;
        }

        return result;
    }

    generateReport(result) {
        const lines = [];
        
        lines.push('🔍 Dependency Validation Report');
        lines.push('================================');
        
        if (result.isValid) {
            lines.push('✅ Overall Status: VALID');
        } else {
            lines.push('❌ Overall Status: INVALID');
        }
        
        if (result.errors.length > 0) {
            lines.push('\n❌ Errors:');
            result.errors.forEach(error => lines.push(`  - ${error}`));
        }
        
        if (result.warnings.length > 0) {
            lines.push('\n⚠️  Warnings:');
            result.warnings.forEach(warning => lines.push(`  - ${warning}`));
        }
        
        if (result.problematicDeps.length > 0) {
            lines.push('\n🚨 Problematic Dependencies:');
            result.problematicDeps.forEach(dep => lines.push(`  - ${dep}`));
            lines.push('\n💡 Recommendation: Remove these dependencies or find alternatives');
            lines.push('   These dependencies often require native compilation and may fail in packaged extensions.');
        }
        
        if (result.missingDeps.length > 0) {
            lines.push('\n📦 Missing Dependencies:');
            result.missingDeps.forEach(dep => lines.push(`  - ${dep}`));
            lines.push('\n💡 Recommendation: Add these dependencies to package.json');
        }
        
        return lines.join('\n');
    }
}

/**
 * Logic Step: Main CLI execution function
 * Runs validation and exits with appropriate code for CI/CD integration
 */
function main() {
    console.log('🚀 Starting dependency validation...\n');
    
    const validator = new SimpleDependencyValidator(projectRoot);
    const result = validator.validateDependencies();
    const report = validator.generateReport(result);
    
    console.log(report);
    
    if (result.isValid) {
        console.log('\n🎉 Dependency validation passed! Extension is ready for packaging.');
        process.exit(0);
    } else {
        console.log('\n💥 Dependency validation failed! Please fix the issues above before packaging.');
        process.exit(1);
    }
}

// Logic Step: Handle CLI arguments and options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Dependency Validation Tool
==========================

Usage: node validate-dependencies.js [options]

Options:
  --help, -h    Show this help message
  --verbose, -v Show detailed validation information

This tool validates extension dependencies to prevent packaging issues:
- Detects problematic native dependencies that may cause activation failures
- Ensures required dependencies are present
- Checks for potential configuration issues
- Provides recommendations for fixing dependency problems

Exit codes:
  0 - Validation passed
  1 - Validation failed
`);
    process.exit(0);
}

// Run the validation
main();
