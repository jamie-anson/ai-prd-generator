// @ts-nocheck
/**
 * @file fileSystemUtils.ts
 * @description Utility functions for file system operations used in CCS analysis.
 * 
 * The logic of this file is to:
 * 1. Provide reusable file system operations for codebase analysis
 * 2. Handle file reading with proper error handling and limits
 * 3. Check for existence of specific file patterns and directories
 * 4. Abstract file system complexity from the main CCS handler
 */

import * as vscode from 'vscode';
import { 
    SKIP_PATTERNS, 
    ALL_CODE_EXTENSIONS, 
    TEST_PATTERNS, 
    DOCUMENTATION_PATTERNS, 
    README_PATTERNS, 
    TYPESCRIPT_PATTERNS,
    CCS_CONFIG 
} from '../constants/ccsConstants';

/**
 * Logic Step: Utility class for file system operations in CCS analysis.
 * Provides static methods for common file operations with proper error handling.
 */
export class FileSystemUtils {
    
    /**
     * Logic Step: Determines if a file or directory should be skipped during analysis.
     * 
     * This function checks against common patterns that should be excluded:
     * - Build artifacts and dependencies (node_modules, dist, etc.)
     * - Version control directories (.git, .svn)
     * - IDE and OS files (.vscode, .DS_Store)
     * - Hidden files (starting with .) except important ones like .gitignore
     * 
     * @param name - The file or directory name to check
     * @returns boolean - True if the file should be skipped
     * 
     * @example
     * ```typescript
     * FileSystemUtils.shouldSkipFile('node_modules') // returns true
     * FileSystemUtils.shouldSkipFile('src') // returns false
     * FileSystemUtils.shouldSkipFile('.gitignore') // returns false
     * ```
     */
    static shouldSkipFile(name: string): boolean {
        // Logic Step: Check against explicit skip patterns
        if (SKIP_PATTERNS.includes(name as any)) {
            return true;
        }
        
        // Logic Step: Skip hidden files except important ones
        if (name.startsWith('.')) {
            const importantHiddenFiles = ['.gitignore', '.env.example', '.editorconfig'];
            return !importantHiddenFiles.includes(name);
        }
        
        // Logic Step: Skip files with certain patterns
        const skipFilePatterns = ['*.log', '*.tmp', '*.cache'];
        return skipFilePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(name);
        });
    }

    /**
     * Logic Step: Determines if a file extension represents a code file.
     * 
     * Uses the comprehensive list of code extensions from constants to determine
     * if a file should be included in code analysis. This helps focus the analysis
     * on actual source code rather than binary or irrelevant files.
     * 
     * @param ext - The file extension to check (including the dot, e.g., '.ts')
     * @returns boolean - True if the extension represents a code file
     * 
     * @example
     * ```typescript
     * FileSystemUtils.isCodeFile('.ts') // returns true
     * FileSystemUtils.isCodeFile('.jpg') // returns false
     * FileSystemUtils.isCodeFile('.md') // returns true (documentation)
     * ```
     */
    static isCodeFile(ext: string): boolean {
        return ALL_CODE_EXTENSIONS.includes(ext as any);
    }

    /**
     * Logic Step: Counts the number of lines in a file safely.
     * 
     * Reads the file content and splits by newlines to count lines.
     * Includes proper error handling to prevent crashes on inaccessible files.
     * This is used to calculate codebase size metrics.
     * 
     * @param fileUri - The URI of the file to count lines in
     * @returns Promise<number> - The number of lines in the file, or 0 if error
     * 
     * @example
     * ```typescript
     * const lines = await FileSystemUtils.countLines(fileUri);
     * console.log(`File has ${lines} lines`);
     * ```
     */
    static async countLines(fileUri: vscode.Uri): Promise<number> {
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            const text = content.toString();
            
            // Logic Step: Handle empty files
            if (text.length === 0) {
                return 0;
            }
            
            // Logic Step: Split by newlines and count
            const lines = text.split('\n').length;
            
            // Logic Step: Adjust for files that don't end with newline
            return text.endsWith('\n') ? lines - 1 : lines;
        } catch (error) {
            // Logic Step: Log error for debugging but don't throw
            console.warn(`Failed to count lines in ${fileUri.fsPath}:`, error);
            return 0;
        }
    }

    /**
     * Logic Step: Reads file content with a character limit for sampling.
     * 
     * This function safely reads file content up to a specified limit to prevent
     * memory issues with large files. Used for including sample code in AI analysis.
     * Includes proper encoding handling and error recovery.
     * 
     * @param fileUri - The URI of the file to read
     * @param maxChars - Maximum number of characters to read
     * @returns Promise<string> - The file content (truncated if necessary), or empty string if error
     * 
     * @example
     * ```typescript
     * const sample = await FileSystemUtils.readFileContent(fileUri, 500);
     * console.log(`Sample: ${sample}`);
     * ```
     */
    static async readFileContent(fileUri: vscode.Uri, maxChars: number = CCS_CONFIG.SAMPLE_CONTENT_CHARS): Promise<string> {
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            const text = content.toString();
            
            // Logic Step: Truncate if necessary and add indicator
            if (text.length > maxChars) {
                return text.substring(0, maxChars) + '\n... [truncated]';
            }
            
            return text;
        } catch (error) {
            // Logic Step: Log error for debugging but return empty string
            console.warn(`Failed to read content from ${fileUri.fsPath}:`, error);
            return '';
        }
    }

    /**
     * Logic Step: Checks if any of the specified filenames exist in the workspace.
     * 
     * This function is used to detect the presence of important files like README,
     * configuration files, or other indicators of project structure quality.
     * It checks multiple possible filenames to handle variations.
     * 
     * @param workspaceUri - The root workspace URI to search in
     * @param filenames - Array of filenames to check for
     * @returns Promise<boolean> - True if any of the files exist
     * 
     * @example
     * ```typescript
     * const hasReadme = await FileSystemUtils.checkFileExists(
     *     workspaceUri, 
     *     ['README.md', 'README.txt', 'README']
     * );
     * ```
     */
    static async checkFileExists(workspaceUri: vscode.Uri, filenames: readonly string[]): Promise<boolean> {
        for (const filename of filenames) {
            try {
                const fileUri = vscode.Uri.joinPath(workspaceUri, filename);
                await vscode.workspace.fs.stat(fileUri);
                return true; // Found at least one file
            } catch {
                // File doesn't exist, continue checking others
                continue;
            }
        }
        return false; // None of the files exist
    }

    /**
     * Logic Step: Checks for the presence of test files or directories.
     * 
     * Scans the workspace for common test patterns to assess test coverage.
     * This helps determine the quality of the codebase's testing infrastructure.
     * Checks both directory names and file patterns.
     * 
     * @param workspaceUri - The root workspace URI to search in
     * @returns Promise<boolean> - True if test files or directories are found
     * 
     * @example
     * ```typescript
     * const hasTests = await FileSystemUtils.checkTestFiles(workspaceUri);
     * console.log(`Tests present: ${hasTests}`);
     * ```
     */
    static async checkTestFiles(workspaceUri: vscode.Uri): Promise<boolean> {
        // Logic Step: Check for test directories
        for (const pattern of TEST_PATTERNS) {
            if (!pattern.includes('*')) { // Directory patterns
                try {
                    const testUri = vscode.Uri.joinPath(workspaceUri, pattern);
                    const stat = await vscode.workspace.fs.stat(testUri);
                    if (stat.type === vscode.FileType.Directory) {
                        return true;
                    }
                } catch {
                    // Directory doesn't exist, continue checking
                    continue;
                }
            }
        }

        // Logic Step: Check for test files in root directory
        try {
            const entries = await vscode.workspace.fs.readDirectory(workspaceUri);
            for (const [name, type] of entries) {
                if (type === vscode.FileType.File) {
                    const testFilePatterns = TEST_PATTERNS.filter(p => p.includes('*'));
                    for (const pattern of testFilePatterns) {
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        if (regex.test(name)) {
                            return true;
                        }
                    }
                }
            }
        } catch {
            // Error reading directory
        }

        return false;
    }

    /**
     * Logic Step: Checks for TypeScript type definitions and configuration.
     * 
     * Looks for TypeScript-specific files that indicate type safety practices:
     * - tsconfig.json files
     * - .d.ts type definition files
     * - Common type files
     * 
     * This helps assess the type safety quality of the codebase.
     * 
     * @param workspaceUri - The root workspace URI to search in
     * @returns Promise<boolean> - True if TypeScript files are found
     * 
     * @example
     * ```typescript
     * const hasTypes = await FileSystemUtils.checkTypeDefinitions(workspaceUri);
     * console.log(`TypeScript usage: ${hasTypes}`);
     * ```
     */
    static async checkTypeDefinitions(workspaceUri: vscode.Uri): Promise<boolean> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(workspaceUri);
            
            for (const [name, type] of entries) {
                // Logic Step: Check for exact matches
                if (TYPESCRIPT_PATTERNS.some(pattern => {
                    if (pattern.includes('*')) {
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        return regex.test(name);
                    }
                    return name === pattern;
                })) {
                    return true;
                }
                
                // Logic Step: Check for .d.ts files
                if (type === vscode.FileType.File && name.endsWith('.d.ts')) {
                    return true;
                }
            }
        } catch (error) {
            console.warn(`Failed to check type definitions:`, error);
        }
        
        return false;
    }

    /**
     * Logic Step: Checks for documentation directories and files.
     * 
     * Scans for common documentation patterns to assess documentation quality:
     * - docs, documentation directories
     * - README files
     * - Wiki or guide directories
     * 
     * This helps evaluate the documentation aspect of code comprehension.
     * 
     * @param workspaceUri - The root workspace URI to search in
     * @returns Promise<boolean> - True if documentation is found
     * 
     * @example
     * ```typescript
     * const hasDocs = await FileSystemUtils.checkDocumentation(workspaceUri);
     * console.log(`Documentation present: ${hasDocs}`);
     * ```
     */
    static async checkDocumentation(workspaceUri: vscode.Uri): Promise<boolean> {
        // Logic Step: Check for README files first
        const hasReadme = await this.checkFileExists(workspaceUri, README_PATTERNS);
        if (hasReadme) {
            return true;
        }

        // Logic Step: Check for documentation directories
        for (const pattern of DOCUMENTATION_PATTERNS) {
            try {
                const docUri = vscode.Uri.joinPath(workspaceUri, pattern);
                const stat = await vscode.workspace.fs.stat(docUri);
                if (stat.type === vscode.FileType.Directory) {
                    return true;
                }
            } catch {
                // Directory doesn't exist, continue checking
                continue;
            }
        }

        return false;
    }

    /**
     * Logic Step: Gets basic file statistics for analysis.
     * 
     * Retrieves file metadata including size and modification time.
     * Used for understanding file characteristics in codebase analysis.
     * 
     * @param fileUri - The URI of the file to get stats for
     * @returns Promise<vscode.FileStat | null> - File statistics or null if error
     */
    static async getFileStats(fileUri: vscode.Uri): Promise<vscode.FileStat | null> {
        try {
            return await vscode.workspace.fs.stat(fileUri);
        } catch {
            return null;
        }
    }

    /**
     * Logic Step: Safely reads directory contents with error handling.
     * 
     * Reads directory entries and filters out inaccessible or problematic entries.
     * Used as a foundation for directory scanning operations.
     * 
     * @param dirUri - The directory URI to read
     * @returns Promise<[string, vscode.FileType][]> - Array of directory entries
     */
    static async readDirectorySafe(dirUri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        try {
            return await vscode.workspace.fs.readDirectory(dirUri);
        } catch (error) {
            console.warn(`Failed to read directory ${dirUri.fsPath}:`, error);
            return [];
        }
    }
}
