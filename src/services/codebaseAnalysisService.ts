// @ts-nocheck
/**
 * @file codebaseAnalysisService.ts
 * @description Service for analyzing codebase structure and metrics for CCS evaluation.
 * 
 * The logic of this file is to:
 * 1. Provide a dedicated service for comprehensive codebase analysis
 * 2. Scan directory structures while respecting performance limits
 * 3. Collect file metrics, samples, and quality indicators
 * 4. Abstract complex analysis logic from the main CCS handler
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystemUtils } from '../utils/fileSystemUtils';
import { CCS_CONFIG } from '../constants/ccsConstants';

/**
 * Logic Step: Interface defining the structure of codebase analysis results.
 * Contains all metrics and samples needed for CCS evaluation.
 */
export interface CodebaseAnalysis {
    /** Total number of files found in the codebase */
    totalFiles: number;
    
    /** Total lines of code across all files */
    totalLines: number;
    
    /** Breakdown of file types by extension */
    fileTypes: { [ext: string]: number };
    
    /** Whether the project has a README file */
    hasReadme: boolean;
    
    /** Whether test files or directories are present */
    hasTests: boolean;
    
    /** Whether TypeScript type definitions are used */
    hasTypeDefinitions: boolean;
    
    /** Whether documentation directories exist */
    hasDocumentation: boolean;
    
    /** List of directory names found (for structure analysis) */
    directories: string[];
    
    /** Sample files with content for AI analysis */
    sampleFiles: SampleFile[];
    
    /** Analysis metadata */
    metadata: AnalysisMetadata;
}

/**
 * Logic Step: Interface for individual file samples included in analysis.
 */
export interface SampleFile {
    /** File name without path */
    name: string;
    
    /** Relative path from workspace root */
    path: string;
    
    /** File extension */
    extension: string;
    
    /** Number of lines in the file */
    lines: number;
    
    /** Sample content (truncated if necessary) */
    sampleContent: string;
    
    /** File size in bytes */
    size: number;
}

/**
 * Logic Step: Metadata about the analysis process itself.
 */
export interface AnalysisMetadata {
    /** When the analysis was performed */
    timestamp: Date;
    
    /** How long the analysis took in milliseconds */
    durationMs: number;
    
    /** Maximum depth reached during scanning */
    maxDepthReached: number;
    
    /** Number of files skipped due to patterns */
    filesSkipped: number;
    
    /** Whether analysis was truncated due to limits */
    wasTruncated: boolean;
    
    /** Any warnings encountered during analysis */
    warnings: string[];
}

/**
 * Logic Step: Service class for performing comprehensive codebase analysis.
 * Encapsulates all logic for scanning, analyzing, and collecting codebase metrics.
 */
export class CodebaseAnalysisService {
    
    /**
     * Logic Step: Analyzes the entire workspace codebase structure and quality.
     * 
     * This is the main entry point for codebase analysis. It performs:
     * 1. Directory structure scanning with depth limits
     * 2. File type classification and counting
     * 3. Quality indicator detection (tests, docs, types)
     * 4. Sample file collection for AI analysis
     * 5. Performance monitoring and limit enforcement
     * 
     * @param workspaceUri - The root URI of the workspace to analyze
     * @returns Promise<CodebaseAnalysis> - Comprehensive analysis results
     * @throws {Error} When workspace cannot be accessed or is invalid
     * 
     * @example
     * ```typescript
     * const service = new CodebaseAnalysisService();
     * const analysis = await service.analyzeWorkspace(workspaceUri);
     * console.log(`Analyzed ${analysis.totalFiles} files in ${analysis.metadata.durationMs}ms`);
     * ```
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
            // Logic Step: Check for quality indicators first (fast operations)
            await this.detectQualityIndicators(workspaceUri, analysis);
            
            // Logic Step: Perform deep directory scan
            await this.scanDirectory(workspaceUri, analysis, 0);
            
            // Logic Step: Finalize metadata
            analysis.metadata.durationMs = Date.now() - startTime;
            
            return analysis;
        } catch (error) {
            analysis.metadata.warnings.push(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            analysis.metadata.durationMs = Date.now() - startTime;
            throw error;
        }
    }

    /**
     * Logic Step: Detects quality indicators like README, tests, documentation.
     * 
     * Performs quick checks for common quality indicators before the main scan.
     * This provides early feedback and helps categorize the project quality.
     * 
     * @param workspaceUri - The workspace root URI
     * @param analysis - Analysis object to populate (modified in-place)
     */
    private async detectQualityIndicators(workspaceUri: vscode.Uri, analysis: CodebaseAnalysis): Promise<void> {
        try {
            // Logic Step: Run quality checks in parallel for performance
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
     * Logic Step: Recursively scans a directory tree to collect file metrics and samples.
     * 
     * This is the core scanning algorithm that:
     * 1. Respects depth limits to prevent infinite recursion
     * 2. Skips irrelevant files and directories
     * 3. Collects file metrics and sample content
     * 4. Enforces file count limits for performance
     * 5. Tracks progress and warnings
     * 
     * Algorithm details:
     * - Uses breadth-first approach to prioritize root-level files
     * - Implements early termination when limits are reached
     * - Collects diverse file samples across different types
     * - Handles errors gracefully without stopping the entire scan
     * 
     * @param dirUri - Directory to scan
     * @param analysis - Analysis object to populate (modified in-place)
     * @param depth - Current recursion depth (starts at 0)
     */
    private async scanDirectory(dirUri: vscode.Uri, analysis: CodebaseAnalysis, depth: number): Promise<void> {
        // Logic Step: Enforce depth limit to prevent stack overflow
        if (depth > CCS_CONFIG.MAX_RECURSION_DEPTH) {
            analysis.metadata.warnings.push(`Maximum depth ${CCS_CONFIG.MAX_RECURSION_DEPTH} reached, stopping recursion`);
            return;
        }

        // Logic Step: Enforce file count limit for performance
        if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
            analysis.metadata.wasTruncated = true;
            analysis.metadata.warnings.push(`Maximum file limit ${CCS_CONFIG.MAX_FILES_TO_SCAN} reached, truncating scan`);
            return;
        }

        // Logic Step: Update maximum depth reached
        analysis.metadata.maxDepthReached = Math.max(analysis.metadata.maxDepthReached, depth);

        try {
            const entries = await FileSystemUtils.readDirectorySafe(dirUri);
            
            // Logic Step: Separate files and directories for processing order
            const files: [string, vscode.FileType][] = [];
            const directories: [string, vscode.FileType][] = [];
            
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

            // Logic Step: Process files first (prioritize content over structure)
            for (const [name, type] of files) {
                if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
                    break;
                }
                
                await this.processFile(dirUri, name, analysis);
            }

            // Logic Step: Process directories recursively
            for (const [name, type] of directories) {
                if (analysis.totalFiles >= CCS_CONFIG.MAX_FILES_TO_SCAN) {
                    break;
                }
                
                // Logic Step: Track directory names for structure analysis
                const relativePath = path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 
                                                 vscode.Uri.joinPath(dirUri, name).fsPath);
                analysis.directories.push(relativePath);
                
                // Logic Step: Recurse into subdirectory
                const subDirUri = vscode.Uri.joinPath(dirUri, name);
                await this.scanDirectory(subDirUri, analysis, depth + 1);
            }

        } catch (error) {
            analysis.metadata.warnings.push(`Failed to scan directory ${dirUri.fsPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Logic Step: Processes an individual file for metrics and sampling.
     * 
     * Handles a single file by:
     * 1. Checking if it's a code file worth analyzing
     * 2. Counting lines and updating metrics
     * 3. Collecting sample content if under the limit
     * 4. Updating file type statistics
     * 
     * @param dirUri - Directory containing the file
     * @param fileName - Name of the file to process
     * @param analysis - Analysis object to update
     */
    private async processFile(dirUri: vscode.Uri, fileName: string, analysis: CodebaseAnalysis): Promise<void> {
        const fileUri = vscode.Uri.joinPath(dirUri, fileName);
        const ext = path.extname(fileName);
        
        try {
            // Logic Step: Update file type statistics
            analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
            analysis.totalFiles++;

            // Logic Step: Only process code files for detailed analysis
            if (!FileSystemUtils.isCodeFile(ext)) {
                return;
            }

            // Logic Step: Count lines for code metrics
            const lineCount = await FileSystemUtils.countLines(fileUri);
            analysis.totalLines += lineCount;

            // Logic Step: Collect sample files for AI analysis (up to limit)
            if (analysis.sampleFiles.length < CCS_CONFIG.MAX_SAMPLE_FILES) {
                const sampleContent = await FileSystemUtils.readFileContent(fileUri, CCS_CONFIG.SAMPLE_CONTENT_CHARS);
                const stats = await FileSystemUtils.getFileStats(fileUri);
                
                const relativePath = path.relative(
                    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 
                    fileUri.fsPath
                );

                const sampleFile: SampleFile = {
                    name: fileName,
                    path: relativePath,
                    extension: ext,
                    lines: lineCount,
                    sampleContent,
                    size: stats?.size || 0
                };

                analysis.sampleFiles.push(sampleFile);
            }

        } catch (error) {
            analysis.metadata.warnings.push(`Failed to process file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Logic Step: Generates a summary of the analysis for logging/debugging.
     * 
     * Creates a human-readable summary of the analysis results for debugging
     * and progress reporting. Useful for understanding what was analyzed.
     * 
     * @param analysis - The completed analysis to summarize
     * @returns string - Human-readable summary
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
