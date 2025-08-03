/**
 * @file fileSystemUtils.ts
 * @description Provides a comprehensive suite of utility functions for file system operations.
 * This class abstracts the complexity of interacting with the VS Code file system API, offering
 * robust, error-handled methods for analysis, scanning, and file content manipulation.
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
 * @class FileSystemUtils
 * @description A utility class providing static methods for common file system operations.
 * These methods are designed for safety, efficiency, and reuse across the extension.
 */
export class FileSystemUtils {
    
    /**
     * @method shouldSkipFile
     * @description Determines if a file or directory should be excluded from analysis based on predefined patterns.
     * This is crucial for performance and for focusing analysis on relevant source code.
     * @param {string} name - The file or directory name to check.
     * @returns {boolean} True if the item should be skipped, false otherwise.
     */
    static shouldSkipFile(name: string): boolean {
        // Skip common dependency and build artifact directories.
        if ((SKIP_PATTERNS as readonly string[]).includes(name)) {
            return true;
        }
        
        // Skip most hidden files, but allow important configuration files.
        if (name.startsWith('.')) {
            const importantHiddenFiles = ['.gitignore', '.env.example', '.editorconfig'];
            return !importantHiddenFiles.includes(name);
        }
        
        // Skip temporary or log files.
        const skipFilePatterns = ['*.log', '*.tmp', '*.cache'];
        return skipFilePatterns.some(pattern => new RegExp(pattern.replace('*', '.*')).test(name));
    }

    /**
     * @method isCodeFile
     * @description Checks if a file extension corresponds to a known code or documentation format.
     * @param {string} ext - The file extension (e.g., '.ts', '.md').
     * @returns {boolean} True if the extension is considered a code file.
     */
    static isCodeFile(ext: string): boolean {
        return (ALL_CODE_EXTENSIONS as readonly string[]).includes(ext);
    }

    /**
     * @method countLines
     * @description Safely counts the number of lines in a file.
     * @param {vscode.Uri} fileUri - The URI of the file.
     * @returns {Promise<number>} The total number of lines, or 0 on error.
     */
    static async countLines(fileUri: vscode.Uri): Promise<number> {
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            const text = content.toString();
            if (text.length === 0) return 0;
            // Efficiently count newlines without creating a large array.
            return (text.match(/\n/g) || []).length + 1;
        } catch (error) {
            console.warn(`Could not count lines in ${fileUri.fsPath}:`, error);
            return 0;
        }
    }

    /**
     * @method readFileContent
     * @description Reads file content up to a specified character limit for sampling.
     * @param {vscode.Uri} fileUri - The URI of the file.
     * @param {number} [maxChars=CCS_CONFIG.SAMPLE_CONTENT_CHARS] - The maximum number of characters to read.
     * @returns {Promise<string>} The file content (potentially truncated) or an empty string on error.
     */
    static async readFileContent(fileUri: vscode.Uri, maxChars: number = CCS_CONFIG.SAMPLE_CONTENT_CHARS): Promise<string> {
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            const text = content.toString();
            if (text.length > maxChars) {
                return text.substring(0, maxChars) + '\n... [truncated]';
            }
            return text;
        } catch (error) {
            console.warn(`Could not read content from ${fileUri.fsPath}:`, error);
            return '';
        }
    }

    /**
     * @method checkFileExists
     * @description Checks if any of a given list of filenames exist at the workspace root.
     * @param {vscode.Uri} workspaceUri - The root URI of the workspace.
     * @param {readonly string[]} filenames - An array of filenames to check.
     * @returns {Promise<boolean>} True if at least one of the files exists.
     */
    static async checkFileExists(workspaceUri: vscode.Uri, filenames: readonly string[]): Promise<boolean> {
        for (const filename of filenames) {
            try {
                await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceUri, filename));
                return true; // Found one, no need to check others.
            } catch {
                // File not found, continue.
            }
        }
        return false;
    }

    /**
     * @method checkTestFiles
     * @description Scans the workspace for common test files or directories to assess testing infrastructure.
     * @param {vscode.Uri} workspaceUri - The root URI of the workspace.
     * @returns {Promise<boolean>} True if test patterns are found.
     */
    static async checkTestFiles(workspaceUri: vscode.Uri): Promise<boolean> {
        // First, check for common test directory names.
        for (const pattern of TEST_PATTERNS.filter(p => !p.includes('*'))) {
            try {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceUri, pattern));
                if (stat.type === vscode.FileType.Directory) return true;
            } catch {}
        }

        // Second, check for files matching test patterns in the root.
        try {
            const entries = await this.readDirectorySafe(workspaceUri);
            const testFilePatterns = TEST_PATTERNS.filter(p => p.includes('*'));
            for (const [name, type] of entries) {
                if (type === vscode.FileType.File && testFilePatterns.some(p => new RegExp(p.replace('*', '.*')).test(name))) {
                    return true;
                }
            }
        } catch {}

        return false;
    }

    /**
     * @method checkTypeDefinitions
     * @description Checks for TypeScript configuration and type definition files.
     * @param {vscode.Uri} workspaceUri - The root URI of the workspace.
     * @returns {Promise<boolean>} True if TypeScript-related files are found.
     */
    static async checkTypeDefinitions(workspaceUri: vscode.Uri): Promise<boolean> {
        try {
            const entries = await this.readDirectorySafe(workspaceUri);
            for (const [name, type] of entries) {
                if (TYPESCRIPT_PATTERNS.some(p => new RegExp(p.replace('*', '.*')).test(name))) {
                    return true;
                }
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
     * @method checkDocumentation
     * @description Scans for common documentation directories and files (e.g., 'docs', 'README.md').
     * @param {vscode.Uri} workspaceUri - The root URI of the workspace.
     * @returns {Promise<boolean>} True if documentation artifacts are found.
     */
    static async checkDocumentation(workspaceUri: vscode.Uri): Promise<boolean> {
        if (await this.checkFileExists(workspaceUri, README_PATTERNS)) {
            return true;
        }
        for (const pattern of DOCUMENTATION_PATTERNS) {
            try {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(workspaceUri, pattern));
                if (stat.type === vscode.FileType.Directory) return true;
            } catch {}
        }
        return false;
    }

    /**
     * @method getFileStats
     * @description Retrieves file metadata (stats) safely.
     * @param {vscode.Uri} fileUri - The URI of the file.
     * @returns {Promise<vscode.FileStat | null>} The file stats, or null on error.
     */
    static async getFileStats(fileUri: vscode.Uri): Promise<vscode.FileStat | null> {
        try {
            return await vscode.workspace.fs.stat(fileUri);
        } catch {
            return null;
        }
    }

    /**
     * @method readDirectorySafe
     * @description Reads directory contents with robust error handling.
     * @param {vscode.Uri} dirUri - The URI of the directory to read.
     * @returns {Promise<[string, vscode.FileType][]>} An array of directory entries, or an empty array on error.
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
