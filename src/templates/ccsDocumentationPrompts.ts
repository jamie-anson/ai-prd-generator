// @ts-nocheck
/**
 * @file ccsDocumentationPrompts.ts
 * @description Centralized prompt template system for CCS documentation generation.
 * 
 * The logic of this file is to:
 * 1. Provide reusable, consistent prompt templates for all CCS documentation types
 * 2. Eliminate duplicate prompt generation code across handlers
 * 3. Enable easy maintenance and improvement of AI prompts
 * 4. Support template parameterization for different project types
 * 5. Follow DRY principles for prompt management
 */

import * as path from 'path';

/**
 * Interface for codebase analysis data used in prompt generation
 */
export interface CodebaseAnalysisData {
    totalFiles: number;
    codeFiles: number;
    languages: string[];
    maxDepth: number;
    hasTests: boolean;
    hasDocumentation: boolean;
    hasTypeScript: boolean;
    sampleFiles: Array<{
        relativePath: string;
        language: string;
        lines: number;
    }>;
}

/**
 * Base prompt template configuration
 */
export interface PromptTemplateConfig {
    /** Primary objective of the documentation */
    objective: string;
    /** Specific sections to include */
    sections: string[];
    /** Additional context or requirements */
    additionalContext?: string;
    /** Focus areas for AI agents */
    aiAgentFocus?: string[];
}

/**
 * Centralized service for generating CCS documentation prompts.
 * Provides consistent, reusable prompt templates with project-specific customization.
 */
export class CcsDocumentationPromptService {
    
    /**
     * Logic Step: Format codebase analysis data for use in AI prompts.
     * Creates standardized analysis summary that can be reused across all prompt types.
     * 
     * @param analysis - Codebase analysis results
     * @returns Formatted analysis string for prompt inclusion
     */
    private formatCodebaseAnalysis(analysis: CodebaseAnalysisData): string {
        // Ensure we have valid analysis data
        if (!analysis) {
            return 'Project Analysis: No analysis data available';
        }

        // Safely handle sample files
        const sampleFiles = analysis.sampleFiles || [];
        const mainDirectories = sampleFiles
            .filter(file => file?.relativePath) // Filter out invalid entries
            .map(f => path.dirname(f.relativePath))
            .filter((v, i, a) => v && a.indexOf(v) === i) // Ensure unique, non-null values
            .slice(0, 10)
            .join(', ');

        // Safely format languages array
        const languages = Array.isArray(analysis.languages) && analysis.languages.length > 0 
            ? analysis.languages.join(', ') 
            : 'No languages detected';

        // Safely format sample files list
        const sampleFilesList = sampleFiles.length > 0
            ? sampleFiles
                .filter(file => file?.relativePath) // Filter out invalid entries
                .map(file => `- ${file.relativePath} (${file.language || 'unknown'}) - ${file.lines || 0} lines`)
                .join('\n')
            : 'No sample files available';

        return `Project Analysis:
- Total Files: ${analysis.totalFiles || 0}
- Code Files: ${analysis.codeFiles || 0}
- Languages: ${languages}
- Directory Structure Depth: ${analysis.maxDepth || 0}
- Has Tests: ${analysis.hasTests ? 'Yes' : 'No'}
- Has Documentation: ${analysis.hasDocumentation ? 'Yes' : 'No'}
- Has TypeScript: ${analysis.hasTypeScript ? 'Yes' : 'No'}
- Main Directories: ${mainDirectories || 'None detected'}

Sample Files:
${sampleFilesList}`;
    }

    /**
     * Logic Step: Generate base prompt structure with common elements.
     * Provides consistent prompt format across all documentation types.
     * 
     * @param analysis - Codebase analysis data
     * @param config - Template configuration
     * @returns Base prompt with analysis and objective
     */
    private generateBasePrompt(analysis: CodebaseAnalysisData, config: PromptTemplateConfig): string {
        const analysisSection = this.formatCodebaseAnalysis(analysis);
        const aiAgentFocus = config.aiAgentFocus ? 
            `\n\nFocus Areas for AI Agents:\n${config.aiAgentFocus.map(focus => `- ${focus}`).join('\n')}` : '';

        return `${config.objective}

${analysisSection}${aiAgentFocus}

${config.additionalContext || ''}`;
    }

    /**
     * Logic Step: Generate comprehensive README.md prompt.
     * Creates project-specific README prompt with architecture focus.
     * 
     * @param analysis - Codebase analysis data
     * @returns Complete README generation prompt
     */
    public generateReadmePrompt(analysis: CodebaseAnalysisData): string {
        const config: PromptTemplateConfig = {
            objective: 'Generate a comprehensive README.md for this project to improve Code Comprehension Scores.',
            sections: [
                '**Project Overview** - Clear description of what this project does',
                '**Architecture Diagram** - Mermaid diagram showing system components',
                '**Quick Start Guide** - Step-by-step setup instructions',
                '**Project Structure** - Directory layout explanation',
                '**Key Features** - Main functionality highlights',
                '**Development Guide** - How to contribute and develop',
                '**API Documentation** - If applicable, API endpoints and usage',
                '**Testing** - How to run tests and coverage information',
                '**Deployment** - Production deployment instructions',
                '**Troubleshooting** - Common issues and solutions'
            ],
            aiAgentFocus: [
                'Make this README extremely helpful for AI agents and new developers',
                'Use Mermaid diagrams where appropriate for visual clarity',
                'Include specific commands and examples',
                'Make it comprehensive but well-organized with clear navigation'
            ]
        };

        const basePrompt = this.generateBasePrompt(analysis, config);
        const sectionsText = config.sections.map((section, index) => `${index + 1}. ${section}`).join('\n');

        return `${basePrompt}

Create a README.md that includes:
${sectionsText}

${config.aiAgentFocus?.join('\n') || ''}`;
    }

    /**
     * Logic Step: Generate comprehensive codebase map prompt.
     * Creates navigation-focused prompt for system architecture documentation.
     * 
     * @param analysis - Codebase analysis data
     * @returns Complete codebase map generation prompt
     */
    public generateCodebaseMapPrompt(analysis: CodebaseAnalysisData): string {
        const config: PromptTemplateConfig = {
            objective: 'Generate a comprehensive CODEBASE_MAP.md for this project to improve Code Comprehension Scores and help AI agents navigate the codebase.',
            sections: [
                '**System Overview** - High-level architecture description',
                '**Architecture Diagrams** - Mermaid diagrams showing system components, data flow, and dependency graphs',
                '**Directory Structure** - Complete breakdown of folders and their purposes',
                '**Entry Points** - Main application entry points and configuration files',
                '**Component Dependencies** - How different parts of the system connect',
                '**Integration Points** - External services and API connections',
                '**Critical Paths** - Most important code paths for AI agents to understand',
                '**Development Workflows** - Common development tasks and procedures',
                '**Navigation Guide** - How to find specific functionality',
                '**AI Agent Quick Reference** - Specific guidance for AI agents working with this codebase'
            ],
            aiAgentFocus: [
                'Create clear navigation paths and visual diagrams',
                'Help AI agents understand codebase structure and relationships',
                'Use Mermaid diagrams extensively for visual clarity',
                'Include specific file paths and component relationships',
                'Make it a comprehensive guide for understanding system architecture'
            ]
        };

        const basePrompt = this.generateBasePrompt(analysis, config);
        const sectionsText = config.sections.map((section, index) => `${index + 1}. ${section}`).join('\n');

        return `${basePrompt}

Create a CODEBASE_MAP.md that includes:
${sectionsText}

${config.aiAgentFocus?.join('\n') || ''}`;
    }

    /**
     * Logic Step: Generate comprehensive testing framework prompt.
     * Creates testing-focused prompt with framework-specific considerations.
     * 
     * @param analysis - Codebase analysis data
     * @returns Complete testing framework generation prompt
     */
    public generateTestingFrameworkPrompt(analysis: CodebaseAnalysisData): string {
        const mainFramework = analysis.hasTypeScript ? 'TypeScript/JavaScript' : 'JavaScript';
        
        const config: PromptTemplateConfig = {
            objective: 'Generate a comprehensive testing framework for this project to improve Code Comprehension Scores.',
            sections: [
                '**Testing Strategy Document** - Overall approach and philosophy',
                '**Test Structure** - Directory organization (unit, integration, e2e)',
                '**Configuration Files** - Jest/Mocha/Vitest config based on the project',
                '**Test Utilities** - Helper functions and mocks',
                '**Sample Test Files** - Examples for each type of testing',
                '**Coverage Requirements** - Minimum coverage thresholds',
                '**CI/CD Integration** - GitHub Actions or similar workflow',
                '**Testing Guidelines** - Best practices and conventions',
                '**Mock Strategies** - How to mock external dependencies',
                '**Performance Testing** - Load and performance test examples'
            ],
            additionalContext: `Main Framework: ${mainFramework}`,
            aiAgentFocus: [
                'Create a testing framework that serves as living documentation',
                'Help AI agents understand expected behavior',
                'Include specific examples and configuration for detected languages and frameworks',
                'Make it comprehensive but practical for immediate implementation'
            ]
        };

        const basePrompt = this.generateBasePrompt(analysis, config);
        const sectionsText = config.sections.map((section, index) => `${index + 1}. ${section}`).join('\n');

        return `${basePrompt}

Create a comprehensive testing framework that includes:
${sectionsText}

${config.aiAgentFocus?.join('\n') || ''}`;
    }

    /**
     * Logic Step: Generate AI prompting guide prompt.
     * Creates context-rich prompt for AI agent guidance documentation.
     * 
     * @param analysis - Codebase analysis data
     * @returns Complete AI prompting guide generation prompt
     */
    public generateAiPromptingGuidePrompt(analysis: CodebaseAnalysisData): string {
        const frameworks = [
            analysis.hasTypeScript ? 'TypeScript' : 'JavaScript',
            analysis.hasTests ? 'Testing Framework' : null
        ].filter(Boolean).join(', ');
        
        const architecture = analysis.maxDepth > 3 ? 'Multi-layered' : 'Simple';
        const codeQuality = [
            analysis.hasTypeScript ? 'Type-safe' : 'Dynamic',
            analysis.hasDocumentation ? 'Documented' : null
        ].filter(Boolean).join(', ');

        const config: PromptTemplateConfig = {
            objective: 'Generate a comprehensive AI Agent Prompting Guide for this project to improve Code Comprehension Scores and minimize hallucinations.',
            sections: [
                '**Context-First Development** - How AI agents should analyze existing code before making changes',
                '**Documentation-Driven Implementation** - Strategies for maintaining comprehensive docs',
                '**Test-First Methodology** - How to write tests that serve as living documentation',
                '**Code Pattern Recognition** - How to identify and follow existing patterns',
                '**Error Prevention Strategies** - Common pitfalls and how to avoid them',
                '**Quality Assurance Checklists** - Pre/during/post implementation checks',
                '**Integration Guidelines** - How to work with existing systems safely',
                '**Performance Considerations** - How to maintain performance while adding features',
                '**Security Best Practices** - Security-aware development prompts',
                '**Refactoring Strategies** - Safe refactoring approaches for AI agents'
            ],
            additionalContext: `Frameworks: ${frameworks}
Architecture: ${architecture} (${analysis.maxDepth} levels deep)
Code Quality: ${codeQuality}`,
            aiAgentFocus: [
                'Minimize hallucinations by providing clear context',
                'Encourage thorough analysis before implementation',
                'Promote consistent code quality and patterns',
                'Ensure comprehensive testing and documentation',
                'Provide specific examples and templates for common scenarios',
                'Make this a practical guide for producing high-quality, consistent code'
            ]
        };

        const basePrompt = this.generateBasePrompt(analysis, config);
        const sectionsText = config.sections.map((section, index) => `${index + 1}. ${section}`).join('\n');

        return `${basePrompt}

Create an AI_AGENT_PROMPTING_STRATEGY.md that includes:
${sectionsText}

Focus on creating prompting strategies that:
${config.aiAgentFocus?.map(focus => `- ${focus}`).join('\n') || ''}`;
    }

    /**
     * Logic Step: Generate prompt for any documentation type by name.
     * Provides unified interface for all prompt generation.
     * 
     * @param type - Documentation type ('readme', 'codebase-map', 'testing-framework', 'ai-prompting-guide')
     * @param analysis - Codebase analysis data
     * @returns Generated prompt for the specified type
     */
    public generatePrompt(type: string, analysis: CodebaseAnalysisData): string {
        switch (type) {
            case 'readme':
                return this.generateReadmePrompt(analysis);
            case 'codebase-map':
                return this.generateCodebaseMapPrompt(analysis);
            case 'testing-framework':
                return this.generateTestingFrameworkPrompt(analysis);
            case 'ai-prompting-guide':
                return this.generateAiPromptingGuidePrompt(analysis);
            default:
                throw new Error(`Unknown documentation type: ${type}`);
        }
    }
}
