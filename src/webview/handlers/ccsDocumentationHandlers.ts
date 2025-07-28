// @ts-nocheck
/**
 * @file ccsDocumentationHandlers.ts
 * @description Refactored CCS documentation handlers using base class to eliminate duplication.
 * 
 * The logic of this file is to:
 * 1. Implement specific CCS documentation handlers extending the base class
 * 2. Eliminate ~400 lines of duplicate code from the original implementation
 * 3. Provide clean, maintainable handlers for each documentation type
 * 4. Follow DRY principles and established architectural patterns
 * 5. Maintain the same functionality with significantly less code
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { 
    BaseCcsDocumentationHandler, 
    CcsDocumentationConfig, 
    CcsDocumentationResult 
} from './baseCcsDocumentationHandler';

/**
 * Handler for generating comprehensive README.md files.
 * Extends base class to provide README-specific content generation.
 */
class ComprehensiveReadmeHandler extends BaseCcsDocumentationHandler {
    protected async generateContent(codebaseAnalysis: any, config: CcsDocumentationConfig): Promise<string> {
        const analysisPrompt = this.formatCodebaseAnalysisForPrompt(codebaseAnalysis);
        
        const readmePrompt = `Generate a comprehensive README.md for this project to improve Code Comprehension Scores.

${analysisPrompt}

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

        return await this.openAiService.generateText(readmePrompt);
    }
}

/**
 * Handler for generating comprehensive codebase maps.
 * Extends base class to provide codebase map-specific content generation.
 */
class CodebaseMapHandler extends BaseCcsDocumentationHandler {
    protected async generateContent(codebaseAnalysis: any, config: CcsDocumentationConfig): Promise<string> {
        const analysisPrompt = this.formatCodebaseAnalysisForPrompt(codebaseAnalysis);
        const mainDirectories = codebaseAnalysis.sampleFiles
            .map(f => path.dirname(f.relativePath))
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 10)
            .join(', ');

        const codebaseMapPrompt = `Generate a comprehensive CODEBASE_MAP.md for this project to improve Code Comprehension Scores and help AI agents navigate the codebase.

${analysisPrompt}
- Main Directories: ${mainDirectories}

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

        return await this.openAiService.generateText(codebaseMapPrompt);
    }
}

/**
 * Handler for generating comprehensive testing frameworks.
 * Extends base class to provide testing framework-specific content and structure creation.
 */
class TestingFrameworkHandler extends BaseCcsDocumentationHandler {
    protected async generateContent(codebaseAnalysis: any, config: CcsDocumentationConfig): Promise<string> {
        const analysisPrompt = this.formatCodebaseAnalysisForPrompt(codebaseAnalysis);
        const mainFramework = codebaseAnalysis.hasTypeScript ? 'TypeScript/JavaScript' : 'JavaScript';

        const testingFrameworkPrompt = `Generate a comprehensive testing framework for this project to improve Code Comprehension Scores.

${analysisPrompt}
- Main Framework: ${mainFramework}

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

        return await this.openAiService.generateText(testingFrameworkPrompt);
    }

    protected async createAdditionalFiles(baseDir: vscode.Uri, mainContent: string): Promise<vscode.Uri[]> {
        const additionalFiles: vscode.Uri[] = [];

        // Create subdirectories for testing framework
        const subdirs = ['unit', 'integration', 'e2e', 'utils'];
        for (const subdir of subdirs) {
            const subdirPath = vscode.Uri.file(path.join(baseDir.fsPath, subdir));
            await vscode.workspace.fs.createDirectory(subdirPath);
            
            // Create placeholder files in each directory
            const placeholderPath = vscode.Uri.file(path.join(subdirPath.fsPath, '.gitkeep'));
            await vscode.workspace.fs.writeFile(placeholderPath, Buffer.from('', 'utf-8'));
            additionalFiles.push(placeholderPath);
        }

        return additionalFiles;
    }
}

/**
 * Handler for generating AI prompting guides.
 * Extends base class to provide AI prompting guide-specific content generation.
 */
class AiPromptingGuideHandler extends BaseCcsDocumentationHandler {
    protected async generateContent(codebaseAnalysis: any, config: CcsDocumentationConfig): Promise<string> {
        const analysisPrompt = this.formatCodebaseAnalysisForPrompt(codebaseAnalysis);
        const frameworks = [
            codebaseAnalysis.hasTypeScript ? 'TypeScript' : 'JavaScript',
            codebaseAnalysis.hasTests ? 'Testing Framework' : null
        ].filter(Boolean).join(', ');
        
        const architecture = codebaseAnalysis.maxDepth > 3 ? 'Multi-layered' : 'Simple';
        const codeQuality = [
            codebaseAnalysis.hasTypeScript ? 'Type-safe' : 'Dynamic',
            codebaseAnalysis.hasDocumentation ? 'Documented' : null
        ].filter(Boolean).join(', ');

        const promptingGuidePrompt = `Generate a comprehensive AI Agent Prompting Guide for this project to improve Code Comprehension Scores and minimize hallucinations.

${analysisPrompt}
- Frameworks: ${frameworks}
- Architecture: ${architecture} (${codebaseAnalysis.maxDepth} levels deep)
- Code Quality: ${codeQuality}

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

        return await this.openAiService.generateText(promptingGuidePrompt);
    }
}

// Factory functions for creating handlers (maintains existing API)

export async function handleGenerateComprehensiveReadme(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    const handler = new ComprehensiveReadmeHandler(context, webview);
    const config: CcsDocumentationConfig = {
        command: 'generate-comprehensive-readme',
        progressTitle: 'Generating Comprehensive README...',
        successMessage: 'Comprehensive README.md generated successfully!',
        fileName: 'README.md',
        analysisMessage: 'Analyzing codebase structure...',
        generationMessage: 'Generating README content with AI...',
        saveMessage: 'Saving README.md file...'
    };
    
    return await handler.generateDocumentation(message, config);
}

export async function handleGenerateCodebaseMap(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    const handler = new CodebaseMapHandler(context, webview);
    const config: CcsDocumentationConfig = {
        command: 'generate-codebase-map',
        progressTitle: 'Generating Codebase Map...',
        successMessage: 'Comprehensive CODEBASE_MAP.md generated successfully!',
        fileName: 'CODEBASE_MAP.md',
        analysisMessage: 'Analyzing codebase architecture...',
        generationMessage: 'Generating codebase map with AI...',
        saveMessage: 'Saving CODEBASE_MAP.md file...'
    };
    
    return await handler.generateDocumentation(message, config);
}

export async function handleGenerateTestingFramework(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    const handler = new TestingFrameworkHandler(context, webview);
    const config: CcsDocumentationConfig = {
        command: 'generate-testing-framework',
        progressTitle: 'Generating Testing Framework...',
        successMessage: 'Comprehensive testing framework generated successfully!',
        fileName: 'README.md',
        createDirectory: true,
        directoryName: 'tests',
        analysisMessage: 'Analyzing codebase for testing needs...',
        generationMessage: 'Generating testing framework with AI...',
        saveMessage: 'Creating testing framework structure...'
    };
    
    return await handler.generateDocumentation(message, config);
}

export async function handleGenerateAiPromptingGuide(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri | undefined> {
    const handler = new AiPromptingGuideHandler(context, webview);
    const config: CcsDocumentationConfig = {
        command: 'generate-ai-prompting-guide',
        progressTitle: 'Generating AI Prompting Guide...',
        successMessage: 'AI Agent Prompting Guide generated successfully!',
        fileName: 'AI_AGENT_PROMPTING_STRATEGY.md',
        analysisMessage: 'Analyzing codebase patterns...',
        generationMessage: 'Generating AI prompting strategies...',
        saveMessage: 'Saving AI prompting guide...'
    };
    
    return await handler.generateDocumentation(message, config);
}

export async function handleGenerateAllCcsDocs(
    message: any, 
    context: vscode.ExtensionContext, 
    webview: vscode.Webview
): Promise<vscode.Uri[] | undefined> {
    if (message.command !== 'generate-all-ccs-docs') {
        return undefined;
    }

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

        const action = await vscode.window.showInformationMessage(
            `Successfully generated ${generatedFiles.length} CCS documentation files! Your Code Comprehension Score should be significantly improved.`,
            'Open Workspace',
            'View Files'
        );

        if (action === 'Open Workspace') {
            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        } else if (action === 'View Files' && generatedFiles.length > 0) {
            await vscode.window.showTextDocument(generatedFiles[0]);
        }

        return generatedFiles;
    });
}
