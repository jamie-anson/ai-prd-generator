// @ts-nocheck
/**
 * @file handleGenerateCCS.ts
 * @description Handles the generation of Code Comprehension Score (CCS) analysis for the current workspace.
 * 
 * The logic of this file is to:
 * 1. Analyze the current workspace codebase structure and complexity
 * 2. Evaluate documentation quality, naming conventions, and test coverage
 * 3. Generate a comprehensive CCS report using AI analysis
 * 4. Display the results in the webview with scores and improvement suggestions
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { handleGenerationError, handleApiError, withErrorHandling } from '../../utils/errorHandler';
import { getCcsOutputPath, ensureOutputDirectory } from '../../utils/configManager';

/**
 * Logic Step: Handles the 'generate-ccs' message from the webview to generate a Code Comprehension Score analysis.
 * @param message The message object from the webview.
 * @param context The extension context.
 * @param webview The webview instance to post messages back to.
 * @returns The URI of the generated CCS file, or undefined if generation fails.
 */
export async function handleGenerateCCS(message: any, context: vscode.ExtensionContext, webview: vscode.Webview): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-ccs') {
        return undefined;
    }

    let generatedPath: vscode.Uri | undefined = undefined;

    await vscode.window.withProgress({ 
        location: vscode.ProgressLocation.Notification, 
        title: "Analyzing Code Comprehension Score...", 
        cancellable: false 
    }, async (progress) => {
        progress.report({ increment: 0, message: "Analyzing codebase..." });

        const apiKey = await context.secrets.get('openAiApiKey');
        if (!apiKey) {
            handleApiError(
                new Error('OpenAI API Key not set'), 
                'OpenAI', 
                'authentication', 
                webview
            );
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            handleGenerationError(
                new Error('No workspace folder found'), 
                'CCS generation', 
                webview
            );
            return;
        }

        // Logic Step: Use error handling wrapper for the entire generation process
        const result = await withErrorHandling(async () => {
            const workspaceUri = workspaceFolders[0].uri;
            
            // Logic Step: Analyze the codebase structure
            progress.report({ increment: 20, message: "Scanning files..." });
            const codebaseAnalysis = await analyzeCodebase(workspaceUri);
            
            progress.report({ increment: 40, message: "Calling AI for analysis..." });
            const openAiService = new OpenAiService(apiKey);
            const ccsAnalysis = await generateCCSAnalysis(openAiService, codebaseAnalysis);
            
            progress.report({ increment: 70, message: "Saving results..." });
            
            if (!ccsAnalysis) {
                throw new Error('No CCS analysis generated');
            }

            // Logic Step: Save the CCS analysis to file
            const outputDir = getCcsOutputPath(workspaceUri);
            await ensureOutputDirectory(outputDir);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const ccsFilePath = vscode.Uri.joinPath(outputDir, `ccs-analysis-${timestamp}.md`);
            
            await vscode.workspace.fs.writeFile(ccsFilePath, Buffer.from(ccsAnalysis, 'utf-8'));
            generatedPath = ccsFilePath;

            // Logic Step: Send the analysis results to the webview
            await webview.postMessage({ 
                command: 'ccsGenerated', 
                analysis: ccsAnalysis,
                filePath: ccsFilePath.fsPath
            });

            vscode.window.showInformationMessage('Code Comprehension Score analysis completed.');
            
            return ccsAnalysis;
        }, {
            operation: 'generate CCS analysis',
            component: 'CCSGenerator'
        }, webview);

        // Logic Step: Return early if generation failed
        if (!result) {
            return;
        }
    });

    return generatedPath;
}

/**
 * Logic Step: Analyzes the codebase structure to gather metrics for CCS evaluation.
 * @param workspaceUri The workspace URI to analyze.
 * @returns A structured analysis of the codebase.
 */
async function analyzeCodebase(workspaceUri: vscode.Uri): Promise<CodebaseAnalysis> {
    const analysis: CodebaseAnalysis = {
        totalFiles: 0,
        totalLines: 0,
        fileTypes: {},
        hasReadme: false,
        hasTests: false,
        hasTypeDefinitions: false,
        hasDocumentation: false,
        directories: [],
        sampleFiles: []
    };

    try {
        // Logic Step: Recursively scan the workspace directory
        await scanDirectory(workspaceUri, analysis, 0);
        
        // Logic Step: Analyze specific patterns
        analysis.hasReadme = await checkFileExists(workspaceUri, ['README.md', 'README.txt', 'readme.md']);
        analysis.hasTests = await checkTestFiles(workspaceUri);
        analysis.hasTypeDefinitions = await checkTypeDefinitions(workspaceUri);
        analysis.hasDocumentation = await checkDocumentation(workspaceUri);
        
    } catch (error) {
        console.error('Error analyzing codebase:', error);
    }

    return analysis;
}

/**
 * Logic Step: Recursively scans a directory to collect file metrics.
 */
async function scanDirectory(dirUri: vscode.Uri, analysis: CodebaseAnalysis, depth: number): Promise<void> {
    if (depth > 5) {
        return; // Limit recursion depth
    }
    
    try {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);
        
        for (const [name, type] of entries) {
            // Logic Step: Skip common ignore patterns
            if (shouldSkipFile(name)) {
                continue;
            }
            
            const itemUri = vscode.Uri.joinPath(dirUri, name);
            
            if (type === vscode.FileType.Directory) {
                analysis.directories.push(name);
                await scanDirectory(itemUri, analysis, depth + 1);
            } else if (type === vscode.FileType.File) {
                analysis.totalFiles++;
                
                const ext = path.extname(name).toLowerCase();
                analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
                
                // Logic Step: Count lines for code files
                if (isCodeFile(ext)) {
                    const lineCount = await countLines(itemUri);
                    analysis.totalLines += lineCount;
                    
                    // Logic Step: Collect sample files for analysis
                    if (analysis.sampleFiles.length < 5) {
                        const content = await readFileContent(itemUri, 500); // First 500 chars
                        analysis.sampleFiles.push({
                            name,
                            path: itemUri.fsPath,
                            extension: ext,
                            lines: lineCount,
                            sampleContent: content
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirUri.fsPath}:`, error);
    }
}

/**
 * Logic Step: Generates the CCS analysis using AI.
 */
async function generateCCSAnalysis(openAiService: OpenAiService, analysis: CodebaseAnalysis): Promise<string> {
    const prompt = `You are acting as a senior technical reviewer.
Estimate the Code Comprehension Score (CCS) for this codebase. This score represents how easily a new developer or an AI assistant could understand and reason about the codebase in its current state.

CODEBASE ANALYSIS:
- Total Files: ${analysis.totalFiles}
- Total Lines of Code: ${analysis.totalLines}
- File Types: ${JSON.stringify(analysis.fileTypes, null, 2)}
- Has README: ${analysis.hasReadme}
- Has Tests: ${analysis.hasTests}
- Has Type Definitions: ${analysis.hasTypeDefinitions}
- Has Documentation: ${analysis.hasDocumentation}
- Main Directories: ${analysis.directories.slice(0, 10).join(', ')}

SAMPLE FILES:
${analysis.sampleFiles.map(f => `
File: ${f.name} (${f.lines} lines)
Sample Content:
${f.sampleContent}
---`).join('\n')}

Use the following categories to guide your reasoning:
1. Codebase Size & Complexity
   Estimate total lines of code, number of modules/files, and structural complexity. Consider modularity and cohesion.
2. Documentation Quality
   Evaluate README files, docstrings, inline comments, typed annotations, and usage of documentation tools like JSDoc/Typedoc.
3. Naming Clarity
   Assess if variable, function, and module names are descriptive and consistent.
4. Test Coverage & Structure
   Note if the codebase has tests, how comprehensive they are, and if they're organized.
5. Summarizability
   Try summarizing one or two modules. If it's hard to do, reduce the score accordingly.

Score each section out of 10, and then provide an overall CCS out of 100%. Include a short rationale for the final score.

Then, suggest 1–3 actions that would most increase the CCS.

Format your response as:
## Code Comprehension Score Analysis

### Category Scores
1. **Codebase Size & Complexity**: X/10
2. **Documentation Quality**: X/10
3. **Naming Clarity**: X/10
4. **Test Coverage & Structure**: X/10
5. **Summarizability**: X/10

### Overall CCS: X%

### Rationale
[Your detailed rationale here]

### Improvement Recommendations
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]`;

    return await openAiService.generateText(prompt);
}

// Logic Step: Helper functions for codebase analysis

function shouldSkipFile(name: string): boolean {
    const skipPatterns = [
        'node_modules', '.git', '.vscode', 'dist', 'build', 'out',
        '.DS_Store', 'Thumbs.db', '*.log', '*.tmp'
    ];
    return skipPatterns.some(pattern => 
        name === pattern || name.startsWith('.') && name !== '.gitignore'
    );
}

function isCodeFile(ext: string): boolean {
    const codeExtensions = [
        '.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.cs',
        '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.html',
        '.css', '.scss', '.sass', '.vue', '.svelte', '.md'
    ];
    return codeExtensions.includes(ext);
}

async function countLines(fileUri: vscode.Uri): Promise<number> {
    try {
        const content = await vscode.workspace.fs.readFile(fileUri);
        return content.toString().split('\n').length;
    } catch {
        return 0;
    }
}

async function readFileContent(fileUri: vscode.Uri, maxChars: number): Promise<string> {
    try {
        const content = await vscode.workspace.fs.readFile(fileUri);
        const text = content.toString();
        return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
    } catch {
        return '';
    }
}

async function checkFileExists(workspaceUri: vscode.Uri, filenames: string[]): Promise<boolean> {
    for (const filename of filenames) {
        try {
            const fileUri = vscode.Uri.joinPath(workspaceUri, filename);
            await vscode.workspace.fs.stat(fileUri);
            return true;
        } catch {
            // File doesn't exist, continue checking
        }
    }
    return false;
}

async function checkTestFiles(workspaceUri: vscode.Uri): Promise<boolean> {
    const testPatterns = ['test', 'tests', '__tests__', 'spec', 'specs'];
    for (const pattern of testPatterns) {
        try {
            const testUri = vscode.Uri.joinPath(workspaceUri, pattern);
            await vscode.workspace.fs.stat(testUri);
            return true;
        } catch {
            // Directory doesn't exist, continue checking
        }
    }
    return false;
}

async function checkTypeDefinitions(workspaceUri: vscode.Uri): Promise<boolean> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(workspaceUri);
        return entries.some(([name]) => name.endsWith('.d.ts') || name === 'tsconfig.json');
    } catch {
        return false;
    }
}

async function checkDocumentation(workspaceUri: vscode.Uri): Promise<boolean> {
    const docPatterns = ['docs', 'documentation', 'doc'];
    for (const pattern of docPatterns) {
        try {
            const docUri = vscode.Uri.joinPath(workspaceUri, pattern);
            await vscode.workspace.fs.stat(docUri);
            return true;
        } catch {
            // Directory doesn't exist, continue checking
        }
    }
    return false;
}

// Logic Step: Interface definitions for type safety
interface CodebaseAnalysis {
    totalFiles: number;
    totalLines: number;
    fileTypes: { [ext: string]: number };
    hasReadme: boolean;
    hasTests: boolean;
    hasTypeDefinitions: boolean;
    hasDocumentation: boolean;
    directories: string[];
    sampleFiles: SampleFile[];
}

interface SampleFile {
    name: string;
    path: string;
    extension: string;
    lines: number;
    sampleContent: string;
}
