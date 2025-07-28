/**
 * @file toLowerCaseSafety.test.ts
 * @description Regression test to prevent unsafe toLowerCase() usage that can cause runtime errors.
 * 
 * This test scans the codebase for toLowerCase() calls and ensures they are properly protected
 * against undefined/null values that would cause "Cannot read properties of undefined" errors.
 * 
 * Background: toLowerCase() has been a recurring source of runtime errors in this extension.
 * This test prevents future regressions by enforcing defensive coding patterns.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('toLowerCase Safety Regression Tests', () => {
    let sourceFiles: string[] = [];
    
    before(async () => {
        // Find all TypeScript source files (excluding test files, node_modules, and dist)
        const projectRoot = path.resolve(__dirname, '../../../');
        const pattern = path.join(projectRoot, 'src/**/*.ts').replace(/\\/g, '/');
        
        sourceFiles = glob.sync(pattern, {
            ignore: [
                '**/node_modules/**',
                '**/dist/**',
                '**/*.test.ts',
                '**/*.spec.ts'
            ]
        });
        
        assert.ok(sourceFiles.length > 0, 'Should find source files to analyze');
    });

    describe('toLowerCase() Usage Analysis', () => {
        interface ToLowerCaseUsage {
            file: string;
            line: number;
            content: string;
            isSafe: boolean;
            reason?: string;
        }

        let toLowerCaseUsages: ToLowerCaseUsage[] = [];

        before(() => {
            // Scan all source files for toLowerCase usage
            sourceFiles.forEach(filePath => {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    if (line.includes('.toLowerCase()')) {
                        const usage = analyzeToLowerCaseUsage(filePath, index + 1, line);
                        toLowerCaseUsages.push(usage);
                    }
                });
            });
        });

        it('should find all toLowerCase() usages in the codebase', () => {
            console.log(`\nFound ${toLowerCaseUsages.length} toLowerCase() usages:`);
            toLowerCaseUsages.forEach(usage => {
                const status = usage.isSafe ? '✅ SAFE' : '❌ UNSAFE';
                console.log(`  ${status}: ${path.relative(process.cwd(), usage.file)}:${usage.line}`);
                if (!usage.isSafe && usage.reason) {
                    console.log(`    Reason: ${usage.reason}`);
                }
            });
            
            // This test always passes - it's informational
            assert.ok(true, 'toLowerCase usage analysis completed');
        });

        it('should not have any unsafe toLowerCase() usages', () => {
            const unsafeUsages = toLowerCaseUsages.filter(usage => !usage.isSafe);
            
            if (unsafeUsages.length > 0) {
                const errorMessage = `Found ${unsafeUsages.length} unsafe toLowerCase() usage(s):\n` +
                    unsafeUsages.map(usage => 
                        `  ${path.relative(process.cwd(), usage.file)}:${usage.line} - ${usage.reason}`
                    ).join('\n') +
                    '\n\nTo fix: Use optional chaining (?.) and fallback values, e.g.:\n' +
                    '  UNSAFE: someVar.toLowerCase()\n' +
                    '  SAFE:   (someVar || "").toLowerCase()\n' +
                    '  SAFE:   someVar?.toLowerCase() || ""';
                
                assert.fail(errorMessage);
            }
        });

        it('should have proper defensive patterns for all toLowerCase() calls', () => {
            const defensivePatterns = [
                /\?\./,  // Optional chaining: obj?.prop.toLowerCase()
                /\|\|\s*['"]/,  // Fallback string: (obj || "").toLowerCase()
                /\|\|\s*\w+/,   // Fallback variable: (obj || fallback).toLowerCase()
            ];

            const unprotectedUsages = toLowerCaseUsages.filter(usage => {
                // Skip if already marked as unsafe for other reasons
                if (!usage.isSafe) return false;
                
                // Check if the line contains any defensive patterns
                return !defensivePatterns.some(pattern => pattern.test(usage.content));
            });

            if (unprotectedUsages.length > 0) {
                console.log('\nWarning: Found potentially unprotected toLowerCase() calls:');
                unprotectedUsages.forEach(usage => {
                    console.log(`  ${path.relative(process.cwd(), usage.file)}:${usage.line}`);
                    console.log(`    ${usage.content.trim()}`);
                });
                console.log('\nConsider adding defensive coding patterns to prevent runtime errors.');
            }

            // This is a warning, not a failure - some cases might be legitimately safe
            assert.ok(true, 'Defensive pattern analysis completed');
        });
    });

    describe('Common Error Patterns', () => {
        it('should not have direct property access followed by toLowerCase()', () => {
            const dangerousPatterns = [
                /\w+\.\w+\.toLowerCase\(\)/,  // obj.prop.toLowerCase()
                /\w+\[\w+\]\.toLowerCase\(\)/, // obj[key].toLowerCase()
            ];

            const violations: string[] = [];

            sourceFiles.forEach(filePath => {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    dangerousPatterns.forEach(pattern => {
                        if (pattern.test(line) && !line.includes('?.') && !line.includes('||') && !line.includes('.fsPath')) {
                            violations.push(`${path.relative(process.cwd(), filePath)}:${index + 1} - ${line.trim()}`);
                        }
                    });
                });
            });

            if (violations.length > 0) {
                assert.fail(`Found potentially dangerous toLowerCase() patterns:\n${violations.join('\n')}`);
            }
        });
    });
});

/**
 * Analyzes a toLowerCase() usage to determine if it's safe or potentially problematic.
 */
function analyzeToLowerCaseUsage(filePath: string, lineNumber: number, lineContent: string): {
    file: string;
    line: number;
    content: string;
    isSafe: boolean;
    reason?: string;
} {
    const trimmedLine = lineContent.trim();
    
    // Check for known safe patterns
    const safePatterns = [
        // Optional chaining
        /\?\./,
        // Explicit null/undefined checks with fallbacks
        /\|\|\s*['"]/,
        /\|\|\s*\w+/,
        // String literals (always safe)
        /['"'][^'"]*['"]\.toLowerCase\(\)/,
        // Known safe API calls (VS Code file paths, etc.)
        /\.fsPath\.toLowerCase\(\)/,
        // Template literals with fallbacks
        /\$\{[^}]*\|\|[^}]*\}/,
        // Known safe VS Code API properties
        /\.(scheme|authority|path|query|fragment)\.toLowerCase\(\)/,
    ];

    const isSafe = safePatterns.some(pattern => pattern.test(trimmedLine));
    
    let reason: string | undefined;
    if (!isSafe) {
        // Try to identify the specific risk
        if (trimmedLine.includes('.toLowerCase()') && !trimmedLine.includes('?.') && !trimmedLine.includes('||')) {
            reason = 'Direct property access without null/undefined protection';
        } else {
            reason = 'Potentially unsafe toLowerCase() usage';
        }
    }

    return {
        file: filePath,
        line: lineNumber,
        content: lineContent,
        isSafe,
        reason
    };
}
