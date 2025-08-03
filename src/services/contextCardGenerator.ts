import * as vscode from 'vscode';
import * as path from 'path';
import { getContextCardOutputPath } from '../utils/configManager';

/**
 * Represents extracted information for a function or method using TypeScript Language Service
 */
export interface FunctionInfo {
    name: string;
    signature: string;
    documentation?: string;
    parameters: ParameterInfo[];
    returnType: string;
    dependencies: string[];
    location: {
        file: string;
        line: number;
        character: number;
    };
}

/**
 * Represents parameter information extracted from TypeScript Language Service
 */
export interface ParameterInfo {
    name: string;
    type: string;
    optional: boolean;
    documentation?: string;
}

/**
 * Represents extracted information for a class using TypeScript Language Service
 */
export interface ClassInfo {
    name: string;
    documentation?: string;
    extends?: string;
    implements: string[];
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    dependencies: string[];
    location: {
        file: string;
        line: number;
        character: number;
    };
}

/**
 * Represents property information extracted from TypeScript Language Service
 */
export interface PropertyInfo {
    name: string;
    type: string;
    optional: boolean;
    readonly: boolean;
    documentation?: string;
}

/**
 * Represents extracted information for an interface using TypeScript Language Service
 */
export interface InterfaceInfo {
    name: string;
    documentation?: string;
    extends: string[];
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    dependencies: string[];
    location: {
        file: string;
        line: number;
        character: number;
    };
}

/**
 * The result of TypeScript Language Service code analysis
 */
export interface AnalysisResult {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    dependencies: string[];
    filePath: string;
}

/**
 * Project structure analysis for intelligent context generation
 */
export interface ProjectAnalysis {
    hasManifest: boolean;
    manifestContent?: any;
    hasPRD: boolean;
    prdContent?: string;
    hasContextTemplates: boolean;
    existingContextFiles: string[];
    projectType: 'web-app' | 'mobile-app' | 'api' | 'library' | 'unknown';
    domain: string;
    features: string[];
    techStack: string[];
}

/**
 * Recommended context files to generate
 */
export interface ContextNeeds {
    architectureOverview: boolean;
    dataModels: boolean;
    apiSpecification: boolean;
    userFlows: boolean;
    componentStructure: boolean;
    securityConsiderations: boolean;
    deploymentGuide: boolean;
    testingStrategy: boolean;
    codeStandards: boolean;
    projectGlossary: boolean;
}

/**
 * Context card generator using VS Code's TypeScript Language Service
 * This provides rich semantic analysis without requiring external dependencies
 */
export class TypeScriptContextCardGenerator {
    private workspaceUri: vscode.Uri;
    private context: vscode.ExtensionContext;

    constructor(workspaceUri: vscode.Uri, context: vscode.ExtensionContext) {
        this.workspaceUri = workspaceUri;
        this.context = context;
    }

    /**
     * Generate intelligent context cards based on project analysis and PRD
     */
    async generateAndSaveContextCards(): Promise<void> {
        try {
            console.log('[ContextCardGenerator] Starting intelligent context card generation...');
            
            // Step 1: Analyze project structure and existing artifacts
            const projectAnalysis = await this.analyzeProjectStructure();
            console.log('[ContextCardGenerator] Project analysis complete:', projectAnalysis);
            
            // Step 2: Determine what context files would be most valuable
            const contextNeeds = await this.determineContextNeeds(projectAnalysis);
            console.log('[ContextCardGenerator] Determined context needs:', contextNeeds);
            
            // Step 3: Generate the recommended context files
            await this.generateRecommendedContextFiles(contextNeeds);
            
            console.log('[ContextCardGenerator] Successfully generated intelligent context cards');
            
        } catch (error) {
            console.error('[ContextCardGenerator] Error during context card generation:', error);
            throw error;
        }
    }

    /**
     * Analyze the project structure to understand what context files would be valuable
     */
    private async analyzeProjectStructure(): Promise<ProjectAnalysis> {
        const analysis: ProjectAnalysis = {
            hasManifest: false,
            hasPRD: false,
            hasContextTemplates: false,
            existingContextFiles: [],
            projectType: 'unknown',
            domain: '',
            features: [],
            techStack: []
        };

        try {
            // Check for manifest.json
            const manifestUri = vscode.Uri.joinPath(this.workspaceUri, 'manifest.json');
            try {
                const manifestContent = await vscode.workspace.fs.readFile(manifestUri);
                analysis.hasManifest = true;
                analysis.manifestContent = JSON.parse(manifestContent.toString());
                
                // Extract project info from manifest
                if (analysis.manifestContent.name) {
                    analysis.domain = analysis.manifestContent.name;
                }
                if (analysis.manifestContent.description) {
                    analysis.features = [analysis.manifestContent.description];
                }
            } catch {
                // Manifest doesn't exist or is invalid
            }

            // Check for PRD files
            const prdFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(this.workspaceUri, '**/prd/**/*.md')
            );
            if (prdFiles.length > 0) {
                analysis.hasPRD = true;
                try {
                    const prdContent = await vscode.workspace.fs.readFile(prdFiles[0]);
                    analysis.prdContent = prdContent.toString();
                    
                    // Extract features and domain from PRD
                    const content = analysis.prdContent?.toLowerCase() || '';
                    if (content.includes('web') || content.includes('website') || content.includes('browser')) {
                        analysis.projectType = 'web-app';
                    } else if (content.includes('mobile') || content.includes('ios') || content.includes('android')) {
                        analysis.projectType = 'mobile-app';
                    } else if (content.includes('api') || content.includes('backend') || content.includes('server')) {
                        analysis.projectType = 'api';
                    }
                    
                    // Extract tech stack mentions
                    const techKeywords = ['react', 'vue', 'angular', 'node', 'python', 'java', 'typescript', 'javascript'];
                    analysis.techStack = techKeywords.filter(tech => content.includes(tech));
                } catch {
                    // Could not read PRD content
                }
            }

            // Check for existing context templates
            const contextTemplateFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(this.workspaceUri, '**/context-templates/**/*.md')
            );
            analysis.hasContextTemplates = contextTemplateFiles.length > 0;

            // List existing context files
            const contextFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(this.workspaceUri, '**/mise-en-place-output/**/*.md')
            );
            analysis.existingContextFiles = contextFiles.map(f => path.basename(f.fsPath));

        } catch (error) {
            console.warn('[ContextCardGenerator] Error analyzing project structure:', error);
        }

        return analysis;
    }

    /**
     * Determine what context files would be most valuable for this project
     */
    private async determineContextNeeds(analysis: ProjectAnalysis): Promise<ContextNeeds> {
        const needs: ContextNeeds = {
            architectureOverview: false,
            dataModels: false,
            apiSpecification: false,
            userFlows: false,
            componentStructure: false,
            securityConsiderations: false,
            deploymentGuide: false,
            testingStrategy: false,
            codeStandards: false,
            projectGlossary: false
        };

        // Always recommend architecture overview for new projects
        needs.architectureOverview = true;
        needs.projectGlossary = true;

        // Recommendations based on project type
        switch (analysis.projectType) {
            case 'web-app':
                needs.componentStructure = true;
                needs.userFlows = true;
                needs.deploymentGuide = true;
                needs.securityConsiderations = true;
                break;
            case 'mobile-app':
                needs.componentStructure = true;
                needs.userFlows = true;
                needs.deploymentGuide = true;
                break;
            case 'api':
                needs.apiSpecification = true;
                needs.dataModels = true;
                needs.securityConsiderations = true;
                needs.deploymentGuide = true;
                break;
            default:
                // For unknown projects, provide general guidance
                needs.dataModels = true;
                needs.componentStructure = true;
                break;
        }

        // Always recommend testing and code standards for any project
        needs.testingStrategy = true;
        needs.codeStandards = true;

        return needs;
    }

    /**
     * Generate the recommended context files based on determined needs
     */
    private async generateRecommendedContextFiles(needs: ContextNeeds): Promise<void> {
        const outputPath = getContextCardOutputPath(this.workspaceUri);

        if (!outputPath) {
            console.error('[ContextCardGenerator] Could not determine context card output path. Is a workspace open?');
            return;
        }
        
        // Ensure output directory exists
        try {
            await vscode.workspace.fs.createDirectory(outputPath);
        } catch (error) {
            // Directory might already exist, which is fine
        }

        const contextFiles: Array<{name: string, content: string}> = [];

        if (needs.architectureOverview) {
            contextFiles.push({
                name: 'architecture-overview.md',
                content: this.generateArchitectureOverview()
            });
        }

        if (needs.dataModels) {
            contextFiles.push({
                name: 'data-models.md',
                content: this.generateDataModelsGuide()
            });
        }

        if (needs.apiSpecification) {
            contextFiles.push({
                name: 'api-specification.md',
                content: this.generateAPISpecification()
            });
        }

        if (needs.userFlows) {
            contextFiles.push({
                name: 'user-flows.md',
                content: this.generateUserFlowsGuide()
            });
        }

        if (needs.componentStructure) {
            contextFiles.push({
                name: 'component-structure.md',
                content: this.generateComponentStructureGuide()
            });
        }

        if (needs.securityConsiderations) {
            contextFiles.push({
                name: 'security-considerations.md',
                content: this.generateSecurityGuide()
            });
        }

        if (needs.deploymentGuide) {
            contextFiles.push({
                name: 'deployment-guide.md',
                content: this.generateDeploymentGuide()
            });
        }

        if (needs.testingStrategy) {
            contextFiles.push({
                name: 'testing-strategy.md',
                content: this.generateTestingStrategy()
            });
        }

        if (needs.codeStandards) {
            contextFiles.push({
                name: 'code-standards.md',
                content: this.generateCodeStandards()
            });
        }

        if (needs.projectGlossary) {
            contextFiles.push({
                name: 'project-glossary.md',
                content: this.generateProjectGlossary()
            });
        }

        // Write all context files
        for (const file of contextFiles) {
            const filePath = vscode.Uri.joinPath(outputPath, file.name);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(file.content, 'utf8'));
        }

        // Generate summary
        await this.generateIntelligentSummary(contextFiles, outputPath);
    }

    private async generateIntelligentSummary(contextFiles: Array<{name: string, content: string}>, outputPath: vscode.Uri): Promise<void> {
        const summaryPath = vscode.Uri.joinPath(outputPath, 'context-summary.md');
        
        let summaryContent = '# Intelligent Context Summary\n\n';
        summaryContent += `Generated on: ${new Date().toISOString()}\n\n`;
        summaryContent += 'The following context files were generated to help you understand the project:\n\n';

        for (const file of contextFiles) {
            summaryContent += `- [${file.name}](${file.name})\n`;
        }

        summaryContent += '\n---\n*This summary was generated by the Mise-en-place AI PRD Generator.*';

        await vscode.workspace.fs.writeFile(summaryPath, Buffer.from(summaryContent, 'utf8'));
    }
    
    private generateArchitectureOverview(): string {
        return '## Architecture Overview...';
    }

    private generateDataModelsGuide(): string {
        return '## Data Models Guide...';
    }

    private generateAPISpecification(): string {
        return '## API Specification...';
    }

    private generateUserFlowsGuide(): string {
        return '## User Flows Guide...';
    }

    private generateComponentStructureGuide(): string {
        return '## Component Structure Guide...';
    }

    private generateSecurityGuide(): string {
        return '## Security Guide...';
    }

    private generateDeploymentGuide(): string {
        return '## Deployment Guide...';
    }

    private generateTestingStrategy(): string {
        return '## Testing Strategy...';
    }

    private generateCodeStandards(): string {
        return '## Code Standards...';
    }

    private generateProjectGlossary(): string {
        return '## Project Glossary...';
    }
}
