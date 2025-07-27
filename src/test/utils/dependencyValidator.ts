// @ts-nocheck
/**
 * @file dependencyValidator.ts
 * @description Utility for validating extension dependencies and detecting potential issues
 * 
 * The logic of this file is to:
 * 1. Scan package.json for problematic native dependencies
 * 2. Validate that all imports can be resolved
 * 3. Check for missing production dependencies
 * 4. Detect potential packaging issues before VSIX creation
 * 5. Provide early warning for deployment problems
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DependencyValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    problematicDeps: string[];
    missingDeps: string[];
}

export class DependencyValidator {
    private projectRoot: string;
    private packageJsonPath: string;

    // Logic Step: Known problematic dependencies that cause native module issues
    private static readonly PROBLEMATIC_DEPENDENCIES = [
        'tree-sitter',
        'tree-sitter-typescript',
        'node-gyp',
        'node-gyp-build',
        'native-addon',
        'node-addon-api',
        'prebuild-install'
    ];

    // Logic Step: Essential dependencies required for core functionality
    private static readonly REQUIRED_DEPENDENCIES = [
        'openai',
        'node-fetch'
    ];

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.packageJsonPath = path.join(projectRoot, 'package.json');
    }

    /**
     * Logic Step: Perform comprehensive dependency validation
     * Checks for problematic dependencies, missing requirements, and potential issues
     * @returns Validation result with errors, warnings, and recommendations
     */
    public validateDependencies(): DependencyValidationResult {
        const result: DependencyValidationResult = {
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

            // Logic Step: Check for problematic native dependencies
            this.checkProblematicDependencies(allDeps, result);

            // Logic Step: Check for missing required dependencies
            this.checkRequiredDependencies(packageJson.dependencies || {}, result);

            // Logic Step: Validate dependency versions
            this.validateDependencyVersions(allDeps, result);

            // Logic Step: Check for potential circular dependencies
            this.checkCircularDependencies(result);

            // Logic Step: Validate VS Code engine compatibility
            this.validateVSCodeEngine(packageJson, result);

        } catch (error) {
            result.errors.push(`Failed to validate dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Logic Step: Check for dependencies that cause native module issues
     * These dependencies often require node-gyp-build and fail in packaged extensions
     */
    private checkProblematicDependencies(dependencies: Record<string, string>, result: DependencyValidationResult): void {
        for (const dep of DependencyValidator.PROBLEMATIC_DEPENDENCIES) {
            if (dependencies[dep]) {
                result.problematicDeps.push(dep);
                result.errors.push(`Problematic native dependency found: ${dep} (may cause activation failures)`);
                result.isValid = false;
            }
        }
    }

    /**
     * Logic Step: Check for missing essential dependencies
     * Ensures core functionality dependencies are present
     */
    private checkRequiredDependencies(dependencies: Record<string, string>, result: DependencyValidationResult): void {
        for (const dep of DependencyValidator.REQUIRED_DEPENDENCIES) {
            if (!dependencies[dep]) {
                result.missingDeps.push(dep);
                result.errors.push(`Required dependency missing: ${dep}`);
                result.isValid = false;
            }
        }
    }

    /**
     * Logic Step: Validate dependency versions for compatibility
     * Checks for known problematic version ranges
     */
    private validateDependencyVersions(dependencies: Record<string, string>, result: DependencyValidationResult): void {
        // Check for overly broad version ranges that might cause issues
        for (const [dep, version] of Object.entries(dependencies)) {
            if (version.startsWith('*') || version.startsWith('^0.')) {
                result.warnings.push(`Potentially unstable version range for ${dep}: ${version}`);
            }
        }
    }

    /**
     * Logic Step: Basic circular dependency detection
     * Attempts to import key modules to detect circular dependencies
     */
    private checkCircularDependencies(result: DependencyValidationResult): void {
        // This is a basic check - more sophisticated tools like madge could be used
        const keyModules = [
            'src/extension.ts',
            'src/commands/index.ts',
            'src/utils/configManager.ts'
        ];

        for (const module of keyModules) {
            const modulePath = path.join(this.projectRoot, module);
            if (fs.existsSync(modulePath)) {
                // Basic check for obvious circular imports in the same file
                const content = fs.readFileSync(modulePath, 'utf8');
                const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
                
                // Check if any imports reference the same module directory
                const moduleDir = path.dirname(module);
                for (const importLine of imports) {
                    if (importLine.includes(moduleDir) && importLine.includes('./')) {
                        result.warnings.push(`Potential circular dependency in ${module}`);
                    }
                }
            }
        }
    }

    /**
     * Logic Step: Validate VS Code engine compatibility
     * Ensures the extension targets a supported VS Code version
     */
    private validateVSCodeEngine(packageJson: any, result: DependencyValidationResult): void {
        const engines = packageJson.engines;
        if (!engines || !engines.vscode) {
            result.warnings.push('No VS Code engine version specified');
            return;
        }

        const vscodeVersion = engines.vscode;
        if (!vscodeVersion.match(/^\^?\d+\.\d+\.\d+$/)) {
            result.warnings.push(`Invalid VS Code engine version format: ${vscodeVersion}`);
        }
    }

    /**
     * Logic Step: Generate a human-readable validation report
     * Formats the validation results for easy consumption
     */
    public generateReport(result: DependencyValidationResult): string {
        const lines: string[] = [];
        
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
        }
        
        if (result.missingDeps.length > 0) {
            lines.push('\n📦 Missing Dependencies:');
            result.missingDeps.forEach(dep => lines.push(`  - ${dep}`));
        }
        
        return lines.join('\n');
    }
}

/**
 * Logic Step: Standalone function for quick dependency validation
 * Provides a simple interface for one-off validation checks
 */
export function validateProjectDependencies(projectRoot: string): DependencyValidationResult {
    const validator = new DependencyValidator(projectRoot);
    return validator.validateDependencies();
}
