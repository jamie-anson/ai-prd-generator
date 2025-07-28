// @ts-nocheck
/**
 * @file handleCcsDocumentation.ts
 * @description Handles the generation of CCS improvement documentation artifacts.
 * 
 * The logic of this file is to:
 * 1. Generate comprehensive documentation to improve Code Comprehension Scores
 * 2. Create README.md, CODEBASE_MAP.md, testing framework, and AI prompting guides
 * 3. Use AI to customize content based on the specific codebase being analyzed
 * 4. Save files to appropriate output directories following existing patterns
 * 5. Update project state detection to recognize new documentation types
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { OpenAiService } from '../../utils/openai';
import { handleGenerationError, handleApiError, handleFileError, withErrorHandling } from '../../utils/errorHandler';
import { getContextTemplateOutputPath, ensureOutputDirectory } from '../../utils/configManager';
import { ProjectStateDetector } from '../../utils/projectStateDetector';
import { CodebaseAnalysisService } from '../../services/codebaseAnalysisService';

/**
 * Logic Step: Generate comprehensive README.md with project overview and architecture diagrams.
 * Creates a detailed README that addresses CCS Documentation Quality score.
 * 
 * @param message - The message object from the webview
 * @param context - The VS Code extension context
 * @param webview - The webview instance for progress updates
 * @returns Promise<vscode.Uri | undefined> - URI of generated README file
 */
export async function handleGenerateComprehensiveReadme(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-comprehensive-readme') {
        return undefined;
    }

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

    const openAiService = new OpenAiService(apiKey);

    return await withErrorHandling(async () => {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating Comprehensive README...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing codebase structure...', increment: 20 });

            // Logic Step: Analyze current codebase to customize README content
            const analysisService = new CodebaseAnalysisService();
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const codebaseAnalysis = await analysisService.analyzeWorkspace(workspaceFolder.uri.fsPath);
            
            progress.report({ message: 'Generating README content with AI...', increment: 40 });

            // Logic Step: Create AI prompt for comprehensive README generation
            const readmePrompt = `Generate a comprehensive README.md for this project to improve Code Comprehension Scores.

Project Analysis:
- Total Files: ${codebaseAnalysis.totalFiles}
- Code Files: ${codebaseAnalysis.codeFiles}
- Languages: ${codebaseAnalysis.languages.join(', ')}
- Directory Structure Depth: ${codebaseAnalysis.maxDepth}
- Has Tests: ${codebaseAnalysis.hasTests}
- Has Documentation: ${codebaseAnalysis.hasDocumentation}
- Has TypeScript: ${codebaseAnalysis.hasTypeScript}

Sample Files:
${codebaseAnalysis.sampleFiles.map(file => `- ${file.relativePath} (${file.language})`).join('\n')}

Create a README.md that includes:
1. **Project Overview** - Clear description of what this project does
2. **Architecture Diagram** - Mermaid diagram showing system components
3. **Quick Start Guide** - Step-by-step setup instructions
4. **Project Structure** - Directory layout explanation
5. **Key Features** - Main functionality highlights
6. **Development Guide** - How to contribute and develop
7. **API Documentation** - If applicable, API endpoints and usage
8. **Testing** - How to run tests and coverage information
9. **Deployment** - Production deployment instructions
10. **Troubleshooting** - Common issues and solutions

Focus on making this README extremely helpful for AI agents and new developers to understand the codebase quickly.
Use Mermaid diagrams where appropriate for visual clarity.
Include specific commands and examples.
Make it comprehensive but well-organized with clear navigation.`;

            const readmeContent = await openAiService.generateText(readmePrompt);

            progress.report({ message: 'Saving README.md file...', increment: 80 });

            // Logic Step: Save README.md to workspace root
            const readmePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'README.md'));
            await vscode.workspace.fs.writeFile(readmePath, Buffer.from(readmeContent, 'utf-8'));

            progress.report({ message: 'README.md generated successfully!', increment: 100 });

            // Logic Step: Show success message and offer to open file
            const action = await vscode.window.showInformationMessage(
                'Comprehensive README.md generated successfully!',
                'Open README',
                'View in Explorer'
            );

            if (action === 'Open README') {
                await vscode.window.showTextDocument(readmePath);
            } else if (action === 'View in Explorer') {
                await vscode.commands.executeCommand('revealInExplorer', readmePath);
            }

            return readmePath;
        });
    }, 'README generation', webview);
}

/**
 * Logic Step: Generate comprehensive codebase map with architecture diagrams and navigation.
 * Creates a detailed CODEBASE_MAP.md that addresses CCS Summarizability score.
 * 
 * @param message - The message object from the webview
 * @param context - The VS Code extension context
 * @param webview - The webview instance for progress updates
 * @returns Promise<vscode.Uri | undefined> - URI of generated codebase map file
 */
export async function handleGenerateCodebaseMap(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-codebase-map') {
        return undefined;
    }

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

    const openAiService = new OpenAiService(apiKey);

    return await withErrorHandling(async () => {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating Codebase Map...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing codebase architecture...', increment: 20 });

            const analysisService = new CodebaseAnalysisService();
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const codebaseAnalysis = await analysisService.analyzeWorkspace(workspaceFolder.uri.fsPath);
            
            progress.report({ message: 'Generating codebase map with AI...', increment: 40 });

            // Logic Step: Create AI prompt for comprehensive codebase map generation
            const codebaseMapPrompt = `Generate a comprehensive CODEBASE_MAP.md for this project to improve Code Comprehension Scores and help AI agents navigate the codebase.

Project Analysis:
- Total Files: ${codebaseAnalysis.totalFiles}
- Code Files: ${codebaseAnalysis.codeFiles}
- Languages: ${codebaseAnalysis.languages.join(', ')}
- Directory Structure Depth: ${codebaseAnalysis.maxDepth}
- Main Directories: ${codebaseAnalysis.sampleFiles.map(f => path.dirname(f.relativePath)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10).join(', ')}

Sample Files and Structure:
${codebaseAnalysis.sampleFiles.map(file => `- ${file.relativePath} (${file.language}) - ${file.lines} lines`).join('\n')}

Create a CODEBASE_MAP.md that includes:
1. **System Overview** - High-level architecture description
2. **Architecture Diagrams** - Mermaid diagrams showing:
   - System components and their relationships
   - Data flow between components
   - Dependency graphs
3. **Directory Structure** - Complete breakdown of folders and their purposes
4. **Entry Points** - Main application entry points and configuration files
5. **Component Dependencies** - How different parts of the system connect
6. **Integration Points** - External services and API connections
7. **Critical Paths** - Most important code paths for AI agents to understand
8. **Development Workflows** - Common development tasks and procedures
9. **Navigation Guide** - How to find specific functionality
10. **AI Agent Quick Reference** - Specific guidance for AI agents working with this codebase

Focus on creating clear navigation paths and visual diagrams that help AI agents understand the codebase structure and relationships.
Use Mermaid diagrams extensively for visual clarity.
Include specific file paths and component relationships.
Make it a comprehensive guide for understanding the entire system architecture.`;

            const codebaseMapContent = await openAiService.generateText(codebaseMapPrompt);

            progress.report({ message: 'Saving CODEBASE_MAP.md file...', increment: 80 });

            // Logic Step: Save CODEBASE_MAP.md to workspace root
            const codebaseMapPath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'CODEBASE_MAP.md'));
            await vscode.workspace.fs.writeFile(codebaseMapPath, Buffer.from(codebaseMapContent, 'utf-8'));

            progress.report({ message: 'CODEBASE_MAP.md generated successfully!', increment: 100 });

            // Logic Step: Show success message and offer to open file
            const action = await vscode.window.showInformationMessage(
                'Comprehensive CODEBASE_MAP.md generated successfully!',
                'Open Codebase Map',
                'View in Explorer'
            );

            if (action === 'Open Codebase Map') {
                await vscode.window.showTextDocument(codebaseMapPath);
            } else if (action === 'View in Explorer') {
                await vscode.commands.executeCommand('revealInExplorer', codebaseMapPath);
            }

            return codebaseMapPath;
        });
    }, 'Codebase map generation', webview);
}

/**
 * Logic Step: Generate comprehensive testing framework documentation.
 * Creates testing structure and documentation that addresses CCS Test Coverage score.
 * 
 * @param message - The message object from the webview
 * @param context - The VS Code extension context
 * @param webview - The webview instance for progress updates
 * @returns Promise<vscode.Uri | undefined> - URI of generated testing framework directory
 */
export async function handleGenerateTestingFramework(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-testing-framework') {
        return undefined;
    }

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

    const openAiService = new OpenAiService(apiKey);

    return await withErrorHandling(async () => {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating Testing Framework...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing codebase for testing needs...', increment: 20 });

            const analysisService = new CodebaseAnalysisService();
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const codebaseAnalysis = await analysisService.analyzeWorkspace(workspaceFolder.uri.fsPath);
            
            progress.report({ message: 'Generating testing framework with AI...', increment: 40 });

            // Logic Step: Create AI prompt for comprehensive testing framework
            const testingFrameworkPrompt = `Generate a comprehensive testing framework for this project to improve Code Comprehension Scores.

Project Analysis:
- Languages: ${codebaseAnalysis.languages.join(', ')}
- Has TypeScript: ${codebaseAnalysis.hasTypeScript}
- Has Tests: ${codebaseAnalysis.hasTests}
- Code Files: ${codebaseAnalysis.codeFiles}
- Main Framework: ${codebaseAnalysis.hasTypeScript ? 'TypeScript/JavaScript' : 'JavaScript'}

Sample Files:
${codebaseAnalysis.sampleFiles.slice(0, 10).map(file => `- ${file.relativePath} (${file.language})`).join('\n')}

Create a comprehensive testing framework that includes:
1. **Testing Strategy Document** - Overall approach and philosophy
2. **Test Structure** - Directory organization (unit, integration, e2e)
3. **Configuration Files** - Jest/Mocha/Vitest config based on the project
4. **Test Utilities** - Helper functions and mocks
5. **Sample Test Files** - Examples for each type of testing
6. **Coverage Requirements** - Minimum coverage thresholds
7. **CI/CD Integration** - GitHub Actions or similar workflow
8. **Testing Guidelines** - Best practices and conventions
9. **Mock Strategies** - How to mock external dependencies
10. **Performance Testing** - Load and performance test examples

Focus on creating a testing framework that serves as living documentation and helps AI agents understand expected behavior.
Include specific examples and configuration for the detected languages and frameworks.
Make it comprehensive but practical for immediate implementation.`;

            const testingFrameworkContent = await openAiService.generateText(testingFrameworkPrompt);

            progress.report({ message: 'Creating testing framework structure...', increment: 60 });

            // Logic Step: Create tests directory and framework files
            const testsDir = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'tests'));
            await vscode.workspace.fs.createDirectory(testsDir);

            // Create subdirectories
            const unitDir = vscode.Uri.file(path.join(testsDir.fsPath, 'unit'));
            const integrationDir = vscode.Uri.file(path.join(testsDir.fsPath, 'integration'));
            const e2eDir = vscode.Uri.file(path.join(testsDir.fsPath, 'e2e'));
            const utilsDir = vscode.Uri.file(path.join(testsDir.fsPath, 'utils'));

            await vscode.workspace.fs.createDirectory(unitDir);
            await vscode.workspace.fs.createDirectory(integrationDir);
            await vscode.workspace.fs.createDirectory(e2eDir);
            await vscode.workspace.fs.createDirectory(utilsDir);

            // Save main testing framework documentation
            const testingReadmePath = vscode.Uri.file(path.join(testsDir.fsPath, 'README.md'));
            await vscode.workspace.fs.writeFile(testingReadmePath, Buffer.from(testingFrameworkContent, 'utf-8'));

            progress.report({ message: 'Testing framework generated successfully!', increment: 100 });

            // Logic Step: Show success message and offer to open directory
            const action = await vscode.window.showInformationMessage(
                'Comprehensive testing framework generated successfully!',
                'Open Tests Directory',
                'View Testing Guide'
            );

            if (action === 'Open Tests Directory') {
                await vscode.commands.executeCommand('revealInExplorer', testsDir);
            } else if (action === 'View Testing Guide') {
                await vscode.window.showTextDocument(testingReadmePath);
            }

            return testsDir;
        });
    }, 'Testing framework generation', webview);
}

/**
 * Logic Step: Generate AI prompting guide with context-rich strategies.
 * Creates comprehensive prompting strategies to minimize AI hallucinations.
 * 
 * @param message - The message object from the webview
 * @param context - The VS Code extension context
 * @param webview - The webview instance for progress updates
 * @returns Promise<vscode.Uri | undefined> - URI of generated AI prompting guide
 */
export async function handleGenerateAiPromptingGuide(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-ai-prompting-guide') {
        return undefined;
    }

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

    const openAiService = new OpenAiService(apiKey);

    return await withErrorHandling(async () => {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating AI Prompting Guide...',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Analyzing codebase patterns...', increment: 20 });

            const analysisService = new CodebaseAnalysisService();
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const codebaseAnalysis = await analysisService.analyzeWorkspace(workspaceFolder.uri.fsPath);
            
            progress.report({ message: 'Generating AI prompting strategies...', increment: 40 });

            // Logic Step: Create AI prompt for comprehensive prompting guide
            const promptingGuidePrompt = `Generate a comprehensive AI Agent Prompting Guide for this project to improve Code Comprehension Scores and minimize hallucinations.

Project Analysis:
- Languages: ${codebaseAnalysis.languages.join(', ')}
- Frameworks: ${codebaseAnalysis.hasTypeScript ? 'TypeScript' : 'JavaScript'}${codebaseAnalysis.hasTests ? ', Testing Framework' : ''}
- Architecture: ${codebaseAnalysis.maxDepth > 3 ? 'Multi-layered' : 'Simple'} (${codebaseAnalysis.maxDepth} levels deep)
- Code Quality: ${codebaseAnalysis.hasTypeScript ? 'Type-safe' : 'Dynamic'}${codebaseAnalysis.hasDocumentation ? ', Documented' : ''}

Create an AI_AGENT_PROMPTING_STRATEGY.md that includes:
1. **Context-First Development** - How AI agents should analyze existing code before making changes
2. **Documentation-Driven Implementation** - Strategies for maintaining comprehensive docs
3. **Test-First Methodology** - How to write tests that serve as living documentation
4. **Code Pattern Recognition** - How to identify and follow existing patterns
5. **Error Prevention Strategies** - Common pitfalls and how to avoid them
6. **Quality Assurance Checklists** - Pre/during/post implementation checks
7. **Integration Guidelines** - How to work with existing systems safely
8. **Performance Considerations** - How to maintain performance while adding features
9. **Security Best Practices** - Security-aware development prompts
10. **Refactoring Strategies** - Safe refactoring approaches for AI agents

Focus on creating prompting strategies that:
- Minimize hallucinations by providing clear context
- Encourage thorough analysis before implementation
- Promote consistent code quality and patterns
- Ensure comprehensive testing and documentation
- Provide specific examples and templates for common scenarios

Make this a practical guide that AI agents can follow to produce high-quality, consistent code.`;

            const promptingGuideContent = await openAiService.generateText(promptingGuidePrompt);

            progress.report({ message: 'Saving AI prompting guide...', increment: 80 });

            // Logic Step: Save AI prompting guide to workspace root
            const promptingGuidePath = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'AI_AGENT_PROMPTING_STRATEGY.md'));
            await vscode.workspace.fs.writeFile(promptingGuidePath, Buffer.from(promptingGuideContent, 'utf-8'));

            progress.report({ message: 'AI prompting guide generated successfully!', increment: 100 });

            // Logic Step: Show success message and offer to open file
            const action = await vscode.window.showInformationMessage(
                'AI Agent Prompting Guide generated successfully!',
                'Open Prompting Guide',
                'View in Explorer'
            );

            if (action === 'Open Prompting Guide') {
                await vscode.window.showTextDocument(promptingGuidePath);
            } else if (action === 'View in Explorer') {
                await vscode.commands.executeCommand('revealInExplorer', promptingGuidePath);
            }

            return promptingGuidePath;
        });
    }, 'AI prompting guide generation', webview);
}

/**
 * Logic Step: Generate all CCS documentation artifacts at once.
 * Creates comprehensive documentation suite to maximize CCS score improvements.
 * 
 * @param message - The message object from the webview
 * @param context - The VS Code extension context
 * @param webview - The webview instance for progress updates
 * @returns Promise<vscode.Uri[] | undefined> - Array of URIs for all generated files
 */
export async function handleGenerateAllCcsDocs(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri[] | undefined> {
    if (message.command !== 'generate-all-ccs-docs') {
        return undefined;
    }

    return await withErrorHandling(async () => {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating All CCS Documentation...',
            cancellable: false
        }, async (progress) => {
            const generatedFiles: vscode.Uri[] = [];

            progress.report({ message: 'Generating comprehensive README...', increment: 20 });
            const readmeUri = await handleGenerateComprehensiveReadme(
                { command: 'generate-comprehensive-readme' }, 
                context, 
                webview
            );
            if (readmeUri) generatedFiles.push(readmeUri);

            progress.report({ message: 'Generating codebase map...', increment: 40 });
            const codebaseMapUri = await handleGenerateCodebaseMap(
                { command: 'generate-codebase-map' }, 
                context, 
                webview
            );
            if (codebaseMapUri) generatedFiles.push(codebaseMapUri);

            progress.report({ message: 'Generating testing framework...', increment: 60 });
            const testingFrameworkUri = await handleGenerateTestingFramework(
                { command: 'generate-testing-framework' }, 
                context, 
                webview
            );
            if (testingFrameworkUri) generatedFiles.push(testingFrameworkUri);

            progress.report({ message: 'Generating AI prompting guide...', increment: 80 });
            const promptingGuideUri = await handleGenerateAiPromptingGuide(
                { command: 'generate-ai-prompting-guide' }, 
                context, 
                webview
            );
            if (promptingGuideUri) generatedFiles.push(promptingGuideUri);

            progress.report({ message: 'All CCS documentation generated successfully!', increment: 100 });

            // Logic Step: Show comprehensive success message
            const action = await vscode.window.showInformationMessage(
                `Successfully generated ${generatedFiles.length} CCS documentation files! Your Code Comprehension Score should be significantly improved.`,
                'Open Workspace',
                'View Files'
            );

            if (action === 'Open Workspace') {
                await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
            } else if (action === 'View Files') {
                // Open the first generated file
                if (generatedFiles.length > 0) {
                    await vscode.window.showTextDocument(generatedFiles[0]);
                }
            }

            return generatedFiles;
        });
    }, 'All CCS documentation generation', webview);
}
