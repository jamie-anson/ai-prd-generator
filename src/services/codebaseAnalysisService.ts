/**
 * @file codebaseAnalysisService.ts
 * @description Provides a service for performing a comprehensive analysis of the workspace codebase.
 * This service scans the directory structure, collects file metrics, identifies quality indicators,
 * and generates samples for AI-driven analysis, abstracting complex logic from other parts of the extension.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystemUtils } from '../utils/fileSystemUtils';
import { CCS_CONFIG } from '../constants/ccsConstants';

/**
 * @interface CodebaseAnalysis
 * @description Defines the structure for the complete analysis results of a codebase.
 * It contains all metrics, quality indicators, and file samples required for evaluation.
 */
export interface CodebaseAnalysis {
    totalFiles: number;
    totalLines: number;
    fileTypes: { [ext: string]: number };
    hasReadme: boolean;
    hasTests: boolean;
    hasTypeDefinitions: boolean;
    hasDocumentation: boolean;
    directories: string[];
    sampleFiles: SampleFile[];
    metadata: AnalysisMetadata;
}

/**
 * @interface SampleFile
 * @description Represents a single file sample included in the codebase analysis.
 */
export interface SampleFile {
    name: string;
    path: string;
    extension: string;
    lines: number;
    sampleContent: string;
    size: number;
}

/**
 * @interface AnalysisMetadata
 * @description Contains metadata about the analysis process itself, such as performance and warnings.
 */
export interface AnalysisMetadata {
    timestamp: Date;
    durationMs: number;
    maxDepthReached: number;
    filesSkipped: number;
    wasTruncated: boolean;
    warnings: string[];
}

/**
 * @class CodebaseAnalysisService
 * @description Service class that encapsulates all logic for scanning, analyzing, and collecting codebase metrics.
 */
export class CodebaseAnalysisService {
    
    /**
     * @method analyzeWorkspace
     * @description The main entry point for analyzing the entire workspace codebase.
     * It performs a deep scan to gather metrics on file structure, code volume, and quality indicators.
     * @param {vscode.Uri} workspaceUri - The root URI of the workspace to analyze.
     * @returns {Promise<CodebaseAnalysis>} A promise that resolves to the comprehensive analysis results.
     * @throws {Error} If the workspace cannot be accessed or is invalid.
     */
    async analyzeWorkspace(workspaceUri: vscode.Uri): Promise<CodebaseAnalysis> {
        const startTime = Date.now();
        const analysis: CodebaseAnalysis = {
            totalFiles: 0,
            totalLines: 0,
            fileTypes: {},
            hasReadme: false,
            hasTests: false,
            hasTypeDefinitions: false,
            hasDocumentation: false,
            directories: [],
            sampleFiles: [],
            metadata: {
                timestamp: new Date(),
                durationMs: 0,
                maxDepthReached: 0,
                filesSkipped: 0,
                wasTruncated: false,
                warnings: []
            }
        };

        try {
            // Logic Step 1: Perform fast checks for key quality indicators.
            await this.detectQualityIndicators(workspaceUri, analysis);
            
            // Logic Step 2: Execute the main recursive directory scan.
            await this.scanDirectory(workspaceUri, analysis, 0);
            
            // Logic Step 3: Finalize metadata before returning.
            analysis.metadata.durationMs = Date.now() - startTime;
            return analysis;
        } catch (error) {
            analysis.metadata.warnings.push(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            analysis.metadata.durationMs = Date.now() - startTime;
            throw error;
        }
    }

    /**
     * @method detectQualityIndicators
     * @description Performs quick checks for common quality indicators like READMEs, tests, and documentation.
     * This provides a fast, high-level assessment of project maturity.
     * @param {vscode.Uri} workspaceUri - The workspace root URI.
     * @param {CodebaseAnalysis} analysis - The analysis object, which is mutated in-place.
     * @private
     */
    private async detectQualityIndicators(workspaceUri: vscode.Uri, analysis: CodebaseAnalysis): Promise<void> {
        try {
            // Run checks in parallel for efficiency.
            const [hasReadme, hasTests, hasTypeDefinitions, hasDocumentation] = await Promise.all([
                FileSystemUtils.checkFileExists(workspaceUri, ['README.md', 'README.txt', 'README']),
                FileSystemUtils.checkTestFiles(workspaceUri),
                FileSystemUtils.checkTypeDefinitions(workspaceUri),
                FileSystemUtils.checkDocumentation(workspaceUri)
            ]);

            analysis.hasReadme = hasReadme;
            analysis.hasTests = hasTests;
            analysis.hasTypeDefinitions = hasTypeDefinitions;
            analysis.hasDocumentation = hasDocumentation;
        } catch (error) {
            analysis.metadata.warnings.push(`Quality indicator detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method scanDirectory
     * @description Recursively scans a directory tree to collect file metrics and samples.
     * This core algorithm respects depth and file count limits, skips ignored files, and handles errors gracefully.
     * @param {vscode.Uri} dirUri - The URI of the directory to scan.
     * @param {CodebaseAnalysis} analysis - The analysis object, which is mutated in-place.
     * @param {number} depth - The current recursion depth.
     * @private
     */
    private async scanDirectory(dirUri: vscode.Uri, analysis: CodebaseAnalysis, depth: number): Promise<void> {
        // Defend against infinite recursion and excessive scanning.
        if (depth > CCS_CONFIG.MAX_RECURSION_DEPTH) {
            analysis.metadata.warnings.push(`Max depth ${CCS_CONFIG.MAX_RECURSION_DEPTH} reached.`);
            return;
        }
        if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
            if (!analysis.metadata.wasTruncated) {
                analysis.metadata.wasTruncated = true;
                analysis.metadata.warnings.push(`Max files ${CCS_CONFIG.MAX_FILES_TO_SCAN} reached. Scan truncated.`);
            }
            return;
        }

        analysis.metadata.maxDepthReached = Math.max(analysis.metadata.maxDepthReached, depth);

        try {
            const entries = await FileSystemUtils.readDirectorySafe(dirUri);
            const files: [string, vscode.FileType][] = [];
            const directories: [string, vscode.FileType][] = [];

            // Separate entries and filter out ignored files.
            for (const [name, type] of entries) {
                if (FileSystemUtils.shouldSkipFile(name)) {
                    analysis.metadata.filesSkipped++;
                    continue;
                }
                if (type === vscode.FileType.File) {
                    files.push([name, type]);
                } else if (type === vscode.FileType.Directory) {
                    directories.push([name, type]);
                }
            }

            // Process files first to prioritize content analysis.
            for (const [name] of files) {
                if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
                    break;
                }
                await this.processFile(dirUri, name, analysis);
            }

            // Then, recurse into subdirectories.
            for (const [name] of directories) {
                if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
                    break;
                }
                const subDirUri = vscode.Uri.joinPath(dirUri, name);
                const relativePath = path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', subDirUri.fsPath);
                analysis.directories.push(relativePath);
                await this.scanDirectory(subDirUri, analysis, depth + 1);
            }
        } catch (error) {
            analysis.metadata.warnings.push(`Failed to scan ${dirUri.fsPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method processFile
     * @description Processes an individual file to gather metrics and collect a content sample.
     * It updates file counts, line counts, and captures sample content for AI analysis if the file is relevant.
     * @param {vscode.Uri} dirUri - The URI of the directory containing the file.
     * @param {string} fileName - The name of the file to process.
     * @param {CodebaseAnalysis} analysis - The analysis object, which is mutated in-place.
     * @private
     */
    private async processFile(dirUri: vscode.Uri, fileName: string, analysis: CodebaseAnalysis): Promise<void> {
        const fileUri = vscode.Uri.joinPath(dirUri, fileName);
        const ext = path.extname(fileName);
        
        try {
            analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
            analysis.totalFiles++;

            // Only perform detailed analysis on code files.
            if (!FileSystemUtils.isCodeFile(ext)) {
                return;
            }

            const lineCount = await FileSystemUtils.countLines(fileUri);
            analysis.totalLines += lineCount;

            // Collect a sample if the limit has not been reached.
            if (analysis.sampleFiles.length < CCS_CONFIG.MAX_SAMPLE_FILES) {
                const sampleContent = await FileSystemUtils.readFileContent(fileUri, CCS_CONFIG.SAMPLE_CONTENT_CHARS);
                const stats = await FileSystemUtils.getFileStats(fileUri);
                const relativePath = path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', fileUri.fsPath);

                analysis.sampleFiles.push({
                    name: fileName,
                    path: relativePath,
                    extension: ext,
                    lines: lineCount,
                    sampleContent,
                    size: stats?.size || 0
                });
            }
        } catch (error) {
            analysis.metadata.warnings.push(`Failed to process ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method generateAnalysisSummary
     * @description Creates a human-readable summary of the analysis results for logging and debugging.
     * @param {CodebaseAnalysis} analysis - The completed analysis object.
     * @returns {string} A formatted string summarizing the analysis.
     */
    generateAnalysisSummary(analysis: CodebaseAnalysis): string {
        const { totalFiles, totalLines, fileTypes, sampleFiles, metadata } = analysis;
        
        const topFileTypes = Object.entries(fileTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([ext, count]) => `${ext}: ${count}`)
            .join(', ');

        return `
Codebase Analysis Summary:
- Total Files: ${totalFiles}
- Total Lines: ${totalLines}
- Top File Types: ${topFileTypes}
- Sample Files: ${sampleFiles.length}
- Analysis Duration: ${metadata.durationMs}ms
- Max Depth: ${metadata.maxDepthReached}
- Files Skipped: ${metadata.filesSkipped}
- Warnings: ${metadata.warnings.length}
- Quality Indicators: README(${analysis.hasReadme}), Tests(${analysis.hasTests}), Types(${analysis.hasTypeDefinitions}), Docs(${analysis.hasDocumentation})
`.trim();
}

}
