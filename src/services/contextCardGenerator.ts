import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystemUtils } from '../utils/fileSystemUtils';
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
        await this.generateIntelligentSummary(contextFiles);
    }

    /**
     * Find all TypeScript and JavaScript source files in the workspace
     */
    private async findSourceFiles(): Promise<vscode.Uri[]> {
        console.log(`[ContextCardGenerator] Searching for source files in workspace: ${this.workspaceUri.fsPath}`);
        
        const patterns = [
            '**/*.ts',
            '**/*.tsx', 
            '**/*.js',
            '**/*.jsx'
        ];

        const excludePatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/out/**',
            '**/build/**',
            '**/*.d.ts',
            '**/test/**',
            '**/tests/**',
            '**/*.test.*',
            '**/*.spec.*'
        ];

        const files: vscode.Uri[] = [];
        
        for (const pattern of patterns) {
            console.log(`[ContextCardGenerator] Searching for pattern: ${pattern}`);
            const foundFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(this.workspaceUri, pattern),
                `{${excludePatterns.join(',')}}`
            );
            console.log(`[ContextCardGenerator] Found ${foundFiles.length} files for pattern ${pattern}:`, foundFiles.map(f => f.fsPath));
            files.push(...foundFiles);
        }

        console.log(`[ContextCardGenerator] Total files found: ${files.length}`);
        return files;
    }

    /**
     * Analyze a single file using TypeScript Language Service
     */
    private async analyzeFile(fileUri: vscode.Uri): Promise<AnalysisResult | null> {
        try {
            // Open the document to get access to TypeScript Language Service
            const document = await vscode.workspace.openTextDocument(fileUri);
            
            // Get all symbols in the document
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                fileUri
            );

            if (!symbols || symbols.length === 0) {
                return null;
            }

            const functions: FunctionInfo[] = [];
            const classes: ClassInfo[] = [];
            const interfaces: InterfaceInfo[] = [];
            const dependencies = new Set<string>();

            // Process each symbol
            for (const symbol of symbols) {
                await this.processSymbol(symbol, document, functions, classes, interfaces, dependencies);
            }

            // Extract import dependencies
            const importDeps = await this.extractImportDependencies(document);
            importDeps.forEach(dep => dependencies.add(dep));

            return {
                functions,
                classes,
                interfaces,
                dependencies: Array.from(dependencies),
                filePath: fileUri.fsPath
            };

        } catch (error) {
            console.warn(`[ContextCardGenerator] Error analyzing file ${fileUri.fsPath}:`, error);
            return null;
        }
    }

    /**
     * Process a document symbol and extract relevant information
     */
    private async processSymbol(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument,
        functions: FunctionInfo[],
        classes: ClassInfo[],
        interfaces: InterfaceInfo[],
        dependencies: Set<string>
    ): Promise<void> {
        const location = {
            file: document.fileName,
            line: symbol.range.start.line,
            character: symbol.range.start.character
        };

        switch (symbol.kind) {
            case vscode.SymbolKind.Function:
            case vscode.SymbolKind.Method:
                const functionInfo = await this.extractFunctionInfo(symbol, document, location);
                if (functionInfo) {
                    functions.push(functionInfo);
                    functionInfo.dependencies.forEach(dep => dependencies.add(dep));
                }
                break;

            case vscode.SymbolKind.Class:
                const classInfo = await this.extractClassInfo(symbol, document, location);
                if (classInfo) {
                    classes.push(classInfo);
                    classInfo.dependencies.forEach(dep => dependencies.add(dep));
                }
                break;

            case vscode.SymbolKind.Interface:
                const interfaceInfo = await this.extractInterfaceInfo(symbol, document, location);
                if (interfaceInfo) {
                    interfaces.push(interfaceInfo);
                    interfaceInfo.dependencies.forEach(dep => dependencies.add(dep));
                }
                break;
        }

        // Process child symbols recursively
        if (symbol.children) {
            for (const child of symbol.children) {
                await this.processSymbol(child, document, functions, classes, interfaces, dependencies);
            }
        }
    }

    /**
     * Extract detailed function information using TypeScript Language Service
     */
    private async extractFunctionInfo(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument,
        location: { file: string; line: number; character: number }
    ): Promise<FunctionInfo | null> {
        try {
            const position = new vscode.Position(symbol.range.start.line, symbol.range.start.character);
            
            // Get hover information for detailed type data
            const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                document.uri,
                position
            );

            const signature = this.extractSignatureFromHover(hover) || symbol.detail || symbol.name;
            const documentation = this.extractDocumentationFromHover(hover);
            
            // Extract parameters and return type from signature
            const { parameters, returnType } = this.parseSignature(signature);
            
            // Get dependencies by analyzing the function body
            const dependencies = await this.extractFunctionDependencies(symbol, document);

            return {
                name: symbol.name,
                signature,
                documentation,
                parameters,
                returnType,
                dependencies,
                location
            };

        } catch (error) {
            console.warn(`[ContextCardGenerator] Error extracting function info for ${symbol.name}:`, error);
            return null;
        }
    }

    /**
     * Extract detailed class information using TypeScript Language Service
     */
    private async extractClassInfo(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument,
        location: { file: string; line: number; character: number }
    ): Promise<ClassInfo | null> {
        try {
            const position = new vscode.Position(symbol.range.start.line, symbol.range.start.character);
            
            // Get hover information for detailed type data
            const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                document.uri,
                position
            );

            const documentation = this.extractDocumentationFromHover(hover);
            
            // Extract methods and properties from children
            const methods: FunctionInfo[] = [];
            const properties: PropertyInfo[] = [];
            const dependencies = new Set<string>();

            if (symbol.children) {
                for (const child of symbol.children) {
                    if (child.kind === vscode.SymbolKind.Method || child.kind === vscode.SymbolKind.Function) {
                        const methodInfo = await this.extractFunctionInfo(child, document, {
                            file: location.file,
                            line: child.range.start.line,
                            character: child.range.start.character
                        });
                        if (methodInfo) {
                            methods.push(methodInfo);
                            methodInfo.dependencies.forEach(dep => dependencies.add(dep));
                        }
                    } else if (child.kind === vscode.SymbolKind.Property || child.kind === vscode.SymbolKind.Field) {
                        const propertyInfo = this.extractPropertyInfo(child);
                        if (propertyInfo) {
                            properties.push(propertyInfo);
                        }
                    }
                }
            }

            // Parse class declaration for extends/implements
            const { extends: extendsClass, implements: implementsInterfaces } = 
                await this.parseClassDeclaration(symbol, document);

            if (extendsClass) dependencies.add(extendsClass);
            implementsInterfaces.forEach(impl => dependencies.add(impl));

            return {
                name: symbol.name,
                documentation,
                extends: extendsClass,
                implements: implementsInterfaces,
                methods,
                properties,
                dependencies: Array.from(dependencies),
                location
            };

        } catch (error) {
            console.warn(`[ContextCardGenerator] Error extracting class info for ${symbol.name}:`, error);
            return null;
        }
    }

    /**
     * Extract detailed interface information using TypeScript Language Service
     */
    private async extractInterfaceInfo(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument,
        location: { file: string; line: number; character: number }
    ): Promise<InterfaceInfo | null> {
        try {
            const position = new vscode.Position(symbol.range.start.line, symbol.range.start.character);
            
            // Get hover information for detailed type data
            const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                document.uri,
                position
            );

            const documentation = this.extractDocumentationFromHover(hover);
            
            // Extract methods and properties from children
            const methods: FunctionInfo[] = [];
            const properties: PropertyInfo[] = [];
            const dependencies = new Set<string>();

            if (symbol.children) {
                for (const child of symbol.children) {
                    if (child.kind === vscode.SymbolKind.Method || child.kind === vscode.SymbolKind.Function) {
                        const methodInfo = await this.extractFunctionInfo(child, document, {
                            file: location.file,
                            line: child.range.start.line,
                            character: child.range.start.character
                        });
                        if (methodInfo) {
                            methods.push(methodInfo);
                            methodInfo.dependencies.forEach(dep => dependencies.add(dep));
                        }
                    } else if (child.kind === vscode.SymbolKind.Property || child.kind === vscode.SymbolKind.Field) {
                        const propertyInfo = this.extractPropertyInfo(child);
                        if (propertyInfo) {
                            properties.push(propertyInfo);
                        }
                    }
                }
            }

            // Parse interface declaration for extends
            const extendsInterfaces = await this.parseInterfaceDeclaration(symbol, document);
            extendsInterfaces.forEach(ext => dependencies.add(ext));

            return {
                name: symbol.name,
                documentation,
                extends: extendsInterfaces,
                methods,
                properties,
                dependencies: Array.from(dependencies),
                location
            };

        } catch (error) {
            console.warn(`[ContextCardGenerator] Error extracting interface info for ${symbol.name}:`, error);
            return null;
        }
    }

    /**
     * Extract property information from a symbol
     */
    private extractPropertyInfo(symbol: vscode.DocumentSymbol): PropertyInfo | null {
        try {
            const type = symbol.detail || 'any';
            const optional = symbol.name.includes('?');
            const readonly = symbol.name.includes('readonly');

            return {
                name: symbol.name.replace(/[?:].*$/, ''), // Remove type annotations
                type,
                optional,
                readonly,
                documentation: undefined // Could be enhanced with hover info
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Parse function signature to extract parameters and return type
     */
    private parseSignature(signature: string): { parameters: ParameterInfo[]; returnType: string } {
        const parameters: ParameterInfo[] = [];
        let returnType = 'void';

        try {
            // Extract parameters from signature
            const paramMatch = signature.match(/\(([^)]*)\)/);
            if (paramMatch && paramMatch[1]) {
                const paramString = paramMatch[1];
                const params = paramString.split(',').map(p => p.trim()).filter(p => p);
                
                for (const param of params) {
                    const optional = param.includes('?');
                    const [name, type] = param.split(':').map(p => p.trim());
                    
                    parameters.push({
                        name: name.replace('?', ''),
                        type: type || 'any',
                        optional,
                        documentation: undefined
                    });
                }
            }

            // Extract return type
            const returnMatch = signature.match(/:\s*([^{]+)(?:\s*{|$)/);
            if (returnMatch && returnMatch[1]) {
                returnType = returnMatch[1].trim();
            }

        } catch (error) {
            console.warn('[ContextCardGenerator] Error parsing signature:', error);
        }

        return { parameters, returnType };
    }

    /**
     * Extract signature from hover information
     */
    private extractSignatureFromHover(hovers: vscode.Hover[] | undefined): string | undefined {
        if (!hovers || hovers.length === 0) return undefined;

        for (const hover of hovers) {
            for (const content of hover.contents) {
                if (typeof content === 'string') {
                    return content;
                } else if (content && typeof content === 'object' && 'value' in content) {
                    return (content as vscode.MarkdownString).value;
                }
            }
        }

        return undefined;
    }

    /**
     * Extract documentation from hover information
     */
    private extractDocumentationFromHover(hovers: vscode.Hover[] | undefined): string | undefined {
        if (!hovers || hovers.length === 0) return undefined;

        for (const hover of hovers) {
            for (const content of hover.contents) {
                if (typeof content === 'string' && content.includes('*')) {
                    return content;
                } else if (content && typeof content === 'object' && 'value' in content) {
                    const markdownContent = (content as vscode.MarkdownString).value;
                    if (markdownContent && markdownContent.includes('*')) {
                        return markdownContent;
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Extract dependencies from function body by analyzing references
     */
    private async extractFunctionDependencies(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument
    ): Promise<string[]> {
        const dependencies = new Set<string>();

        try {
            // Get the function body text
            const functionText = document.getText(symbol.range);
            
            // Simple regex-based dependency extraction
            // This could be enhanced with more sophisticated analysis
            const identifierRegex = /\b[A-Z][a-zA-Z0-9]*\b/g;
            const matches = functionText.match(identifierRegex);
            
            if (matches) {
                matches.forEach(match => {
                    if (match !== symbol.name) {
                        dependencies.add(match);
                    }
                });
            }

        } catch (error) {
            console.warn('[ContextCardGenerator] Error extracting function dependencies:', error);
        }

        return Array.from(dependencies);
    }

    /**
     * Parse class declaration to extract extends and implements clauses
     */
    private async parseClassDeclaration(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument
    ): Promise<{ extends?: string; implements: string[] }> {
        try {
            const classText = document.getText(symbol.range);
            const firstLine = classText.split('\n')[0];

            let extendsClass: string | undefined;
            const implementsInterfaces: string[] = [];

            // Extract extends
            const extendsMatch = firstLine.match(/extends\s+([A-Za-z0-9_]+)/);
            if (extendsMatch) {
                extendsClass = extendsMatch[1];
            }

            // Extract implements
            const implementsMatch = firstLine.match(/implements\s+([^{]+)/);
            if (implementsMatch) {
                const implementsList = implementsMatch[1].split(',').map(i => i.trim());
                implementsInterfaces.push(...implementsList);
            }

            return { extends: extendsClass, implements: implementsInterfaces };

        } catch (error) {
            return { implements: [] };
        }
    }

    /**
     * Parse interface declaration to extract extends clauses
     */
    private async parseInterfaceDeclaration(
        symbol: vscode.DocumentSymbol,
        document: vscode.TextDocument
    ): Promise<string[]> {
        try {
            const interfaceText = document.getText(symbol.range);
            const firstLine = interfaceText.split('\n')[0];

            const extendsInterfaces: string[] = [];

            // Extract extends
            const extendsMatch = firstLine.match(/extends\s+([^{]+)/);
            if (extendsMatch) {
                const extendsList = extendsMatch[1].split(',').map(i => i.trim());
                extendsInterfaces.push(...extendsList);
            }

            return extendsInterfaces;

        } catch (error) {
            return [];
        }
    }

    /**
     * Extract import dependencies from the document
     */
    private async extractImportDependencies(document: vscode.TextDocument): Promise<string[]> {
        const dependencies = new Set<string>();

        try {
            const text = document.getText();
            const lines = text.split('\n');

            for (const line of lines) {
                // Match import statements
                const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    dependencies.add(importMatch[1]);
                }

                // Match require statements
                const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
                if (requireMatch) {
                    dependencies.add(requireMatch[1]);
                }
            }

        } catch (error) {
            console.warn('[ContextCardGenerator] Error extracting import dependencies:', error);
        }

        return Array.from(dependencies);
    }

    /**
     * Generate context cards from analysis results
     */
    private async generateContextCards(analysisResults: AnalysisResult[]): Promise<void> {
        const outputPath = getContextCardOutputPath(this.workspaceUri);
        
        // Ensure output directory exists
        try {
            await vscode.workspace.fs.createDirectory(outputPath);
        } catch (error) {
            // Directory might already exist, which is fine
        }

        // Generate individual context cards for each file
        for (const result of analysisResults) {
            await this.generateContextCardForFile(result, outputPath);
        }

        // Generate summary context card
        await this.generateSummaryContextCard(analysisResults, outputPath);
    }

    /**
     * Generate a context card for a single file
     */
    private async generateContextCardForFile(result: AnalysisResult, outputPath: vscode.Uri): Promise<void> {
        const fileName = path.basename(result.filePath, path.extname(result.filePath));
        const cardPath = vscode.Uri.joinPath(outputPath, `${fileName}-context.md`);

        const content = this.formatContextCardContent(result);
        
        await vscode.workspace.fs.writeFile(cardPath, Buffer.from(content, 'utf8'));
    }

    /**
     * Generate a summary context card for all analyzed files
     */
    private async generateSummaryContextCard(results: AnalysisResult[], outputPath: vscode.Uri): Promise<void> {
        const cardPath = vscode.Uri.joinPath(outputPath, 'context-summary.md');

        let content = '# Context Cards Summary\n\n';
        content += `Generated on: ${new Date().toISOString()}\n\n`;
        content += `Total files analyzed: ${results.length}\n\n`;

        // Summary statistics
        const totalFunctions = results.reduce((sum, r) => sum + r.functions.length, 0);
        const totalClasses = results.reduce((sum, r) => sum + r.classes.length, 0);
        const totalInterfaces = results.reduce((sum, r) => sum + r.interfaces.length, 0);

        content += `## Summary Statistics\n\n`;
        content += `- **Functions**: ${totalFunctions}\n`;
        content += `- **Classes**: ${totalClasses}\n`;
        content += `- **Interfaces**: ${totalInterfaces}\n\n`;

        // File index
        content += `## File Index\n\n`;
        for (const result of results) {
            const fileName = path.basename(result.filePath);
            content += `- [${fileName}](${fileName.replace(/\.[^.]+$/, '-context.md')})\n`;
        }

        await vscode.workspace.fs.writeFile(cardPath, Buffer.from(content, 'utf8'));
    }

    /**
     * Format the content for a context card
     */
    private formatContextCardContent(result: AnalysisResult): string {
        const fileName = path.basename(result.filePath);
        let content = `# Context Card: ${fileName}\n\n`;
        content += `**File Path**: \`${result.filePath}\`\n\n`;
        content += `**Generated**: ${new Date().toISOString()}\n\n`;

        // Dependencies section
        if (result.dependencies.length > 0) {
            content += `## Dependencies\n\n`;
            for (const dep of result.dependencies) {
                content += `- \`${dep}\`\n`;
            }
            content += '\n';
        }

        // Functions section
        if (result.functions.length > 0) {
            content += `## Functions\n\n`;
            for (const func of result.functions) {
                content += `### ${func.name}\n\n`;
                content += `**Signature**: \`${func.signature}\`\n\n`;
                if (func.documentation) {
                    content += `**Documentation**: ${func.documentation}\n\n`;
                }
                content += `**Return Type**: \`${func.returnType}\`\n\n`;
                
                if (func.parameters.length > 0) {
                    content += `**Parameters**:\n`;
                    for (const param of func.parameters) {
                        content += `- \`${param.name}\`: \`${param.type}\`${param.optional ? ' (optional)' : ''}\n`;
                    }
                    content += '\n';
                }

                if (func.dependencies.length > 0) {
                    content += `**Dependencies**: ${func.dependencies.map(d => `\`${d}\``).join(', ')}\n\n`;
                }

                content += `**Location**: Line ${func.location.line + 1}\n\n`;
                content += '---\n\n';
            }
        }

        // Classes section
        if (result.classes.length > 0) {
            content += `## Classes\n\n`;
            for (const cls of result.classes) {
                content += `### ${cls.name}\n\n`;
                if (cls.documentation) {
                    content += `**Documentation**: ${cls.documentation}\n\n`;
                }
                if (cls.extends) {
                    content += `**Extends**: \`${cls.extends}\`\n\n`;
                }
                if (cls.implements.length > 0) {
                    content += `**Implements**: ${cls.implements.map(i => `\`${i}\``).join(', ')}\n\n`;
                }

                if (cls.properties.length > 0) {
                    content += `**Properties**:\n`;
                    for (const prop of cls.properties) {
                        content += `- \`${prop.name}\`: \`${prop.type}\`${prop.optional ? ' (optional)' : ''}${prop.readonly ? ' (readonly)' : ''}\n`;
                    }
                    content += '\n';
                }

                if (cls.methods.length > 0) {
                    content += `**Methods**:\n`;
                    for (const method of cls.methods) {
                        content += `- \`${method.name}(${method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${method.returnType}\`\n`;
                    }
                    content += '\n';
                }

                if (cls.dependencies.length > 0) {
                    content += `**Dependencies**: ${cls.dependencies.map(d => `\`${d}\``).join(', ')}\n\n`;
                }

                content += `**Location**: Line ${cls.location.line + 1}\n\n`;
                content += '---\n\n';
            }
        }

        // Interfaces section
        if (result.interfaces.length > 0) {
            content += `## Interfaces\n\n`;
            for (const iface of result.interfaces) {
                content += `### ${iface.name}\n\n`;
                if (iface.documentation) {
                    content += `**Documentation**: ${iface.documentation}\n\n`;
                }
                if (iface.extends.length > 0) {
                    content += `**Extends**: ${iface.extends.map(e => `\`${e}\``).join(', ')}\n\n`;
                }

                if (iface.properties.length > 0) {
                    content += `**Properties**:\n`;
                    for (const prop of iface.properties) {
                        content += `- \`${prop.name}\`: \`${prop.type}\`${prop.optional ? ' (optional)' : ''}\n`;
                    }
                    content += '\n';
                }

                if (iface.methods.length > 0) {
                    content += `**Methods**:\n`;
                    for (const method of iface.methods) {
                        content += `- \`${method.name}(${method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${method.returnType}\`\n`;
                    }
                    content += '\n';
                }

                if (iface.dependencies.length > 0) {
                    content += `**Dependencies**: ${iface.dependencies.map(d => `\`${d}\``).join(', ')}\n\n`;
                }

                content += `**Location**: Line ${iface.location.line + 1}\n\n`;
                content += '---\n\n';
            }
        }

        return content;
    }

    /**
     * Generate architecture overview context file
     */
    private generateArchitectureOverview(): string {
        return `# Architecture Overview

## Purpose
This document provides a high-level overview of the system architecture, helping developers understand the overall structure and design decisions.

## System Architecture

### High-Level Components
- **Frontend**: User interface and client-side logic
- **Backend**: Server-side logic and API endpoints
- **Database**: Data storage and management
- **External Services**: Third-party integrations

### Technology Stack
- Frontend: [To be determined based on requirements]
- Backend: [To be determined based on requirements]
- Database: [To be determined based on requirements]
- Deployment: [To be determined based on requirements]

### Design Patterns
- **MVC/MVVM**: Separation of concerns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation

### Key Architectural Decisions
1. **Modularity**: System is designed with clear separation of concerns
2. **Scalability**: Architecture supports horizontal and vertical scaling
3. **Maintainability**: Code is organized for easy maintenance and updates
4. **Security**: Security considerations are built into the architecture

## Next Steps
- Define specific technology choices
- Create detailed component diagrams
- Establish coding standards and conventions
`;
    }

    /**
     * Generate data models guide
     */
    private generateDataModelsGuide(): string {
        return `# Data Models Guide

## Purpose
This document defines the data structures and models used throughout the application.

## Core Entities

### User
\`\`\`typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### [Entity Name]
\`\`\`typescript
interface EntityName {
  id: string;
  // Add relevant fields based on requirements
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

## Relationships
- Define relationships between entities
- Specify foreign keys and constraints
- Document cascade behaviors

## Validation Rules
- Field validation requirements
- Business rule constraints
- Data integrity checks

## Database Schema
- Table structures
- Indexes for performance
- Migration strategies

## API Data Transfer Objects (DTOs)
- Request/response formats
- Data transformation rules
- Serialization considerations
`;
    }

    /**
     * Generate API specification
     */
    private generateAPISpecification(): string {
        return `# API Specification

## Purpose
This document defines the API endpoints, request/response formats, and integration guidelines.

## Base Configuration
- **Base URL**: \`https://api.example.com/v1\`
- **Authentication**: Bearer Token / API Key
- **Content Type**: \`application/json\`

## Authentication
\`\`\`http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

## Core Endpoints

### Users
\`\`\`http
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
\`\`\`

### [Resource Name]
\`\`\`http
GET /resource
GET /resource/:id
POST /resource
PUT /resource/:id
DELETE /resource/:id
\`\`\`

## Error Handling
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  }
}
\`\`\`

## Rate Limiting
- Requests per minute: 1000
- Burst limit: 100
- Headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`

## Pagination
\`\`\`json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
\`\`\`
`;
    }

    /**
     * Generate user flows guide
     */
    private generateUserFlowsGuide(): string {
        return `# User Flows Guide

## Purpose
This document maps out the key user journeys and interactions within the application.

## Primary User Flows

### 1. User Registration
1. User visits registration page
2. Fills out registration form
3. Receives email verification
4. Confirms email address
5. Account is activated

### 2. User Login
1. User visits login page
2. Enters credentials
3. System validates credentials
4. User is redirected to dashboard

### 3. [Core Feature Flow]
1. User navigates to feature
2. Performs primary action
3. System processes request
4. User receives feedback
5. Flow completes or continues

## Error Flows

### Invalid Input
1. User submits invalid data
2. System validates input
3. Error messages are displayed
4. User corrects input
5. Flow continues

### Network Errors
1. Network request fails
2. System detects failure
3. Retry mechanism activates
4. User is notified if persistent
5. Graceful degradation

## User Experience Considerations
- Clear navigation paths
- Consistent interaction patterns
- Helpful error messages
- Loading states and feedback
- Accessibility compliance

## Flow Diagrams
[Include Mermaid diagrams or flowcharts for complex flows]
`;
    }

    /**
     * Generate component structure guide
     */
    private generateComponentStructureGuide(): string {
        return `# Component Structure Guide

## Purpose
This document defines the component architecture and organization patterns.

## Component Hierarchy

### Layout Components
- **App**: Root application component
- **Layout**: Main layout wrapper
- **Header**: Navigation and branding
- **Footer**: Site information and links
- **Sidebar**: Secondary navigation

### Page Components
- **HomePage**: Landing page
- **DashboardPage**: User dashboard
- **ProfilePage**: User profile management
- **[FeaturePage]**: Feature-specific pages

### Feature Components
- **[FeatureName]Container**: Feature logic container
- **[FeatureName]List**: List view component
- **[FeatureName]Item**: Individual item component
- **[FeatureName]Form**: Form component

### Shared Components
- **Button**: Reusable button component
- **Input**: Form input component
- **Modal**: Modal dialog component
- **Loading**: Loading indicator
- **ErrorBoundary**: Error handling wrapper

## Component Guidelines

### Naming Conventions
- PascalCase for component names
- Descriptive and specific names
- Consistent prefixes for related components

### Props Interface
\`\`\`typescript
interface ComponentProps {
  // Required props
  id: string;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  
  // Event handlers
  onClick?: () => void;
  
  // Children
  children?: React.ReactNode;
}
\`\`\`

### File Structure
\`\`\`
src/
  components/
    common/
      Button/
        Button.tsx
        Button.test.tsx
        Button.stories.tsx
        index.ts
    features/
      [FeatureName]/
        components/
        hooks/
        types/
        index.ts
\`\`\`

## State Management
- Local state for component-specific data
- Context for shared state
- External state management for complex state

## Testing Strategy
- Unit tests for individual components
- Integration tests for component interactions
- Visual regression tests for UI consistency
`;
    }

    /**
     * Generate security considerations guide
     */
    private generateSecurityGuide(): string {
        return `# Security Considerations

## Purpose
This document outlines security best practices and considerations for the application.

## Authentication & Authorization

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Token Expiry**: Short-lived access tokens with refresh tokens
- **Password Security**: Strong password requirements and hashing
- **Multi-Factor Authentication**: Optional 2FA for enhanced security

### Authorization
- **Role-Based Access Control (RBAC)**: User roles and permissions
- **Resource-Level Permissions**: Fine-grained access control
- **API Endpoint Protection**: Secure all API endpoints

## Data Protection

### Data Encryption
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Database encryption for sensitive data
- **API Keys**: Secure storage and rotation

### Personal Data
- **GDPR Compliance**: Data protection regulations
- **Data Minimization**: Collect only necessary data
- **Right to Deletion**: User data removal capabilities

## Input Validation

### Client-Side
- Form validation and sanitization
- XSS prevention measures
- Content Security Policy (CSP)

### Server-Side
- Input validation and sanitization
- SQL injection prevention
- Rate limiting and DDoS protection

## Security Headers
\`\`\`
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
\`\`\`

## Monitoring & Logging
- Security event logging
- Failed authentication attempts
- Suspicious activity detection
- Regular security audits

## Incident Response
- Security incident response plan
- Breach notification procedures
- Recovery and remediation steps
`;
    }

    /**
     * Generate deployment guide
     */
    private generateDeploymentGuide(): string {
        return `# Deployment Guide

## Purpose
This document provides instructions for deploying the application to various environments.

## Environment Configuration

### Development
- Local development setup
- Hot reloading and debugging
- Test data and mock services

### Staging
- Production-like environment
- Integration testing
- Performance testing

### Production
- Live environment
- High availability setup
- Monitoring and alerting

## Deployment Process

### Prerequisites
- Node.js version requirements
- Database setup
- Environment variables
- SSL certificates

### Build Process
\`\`\`bash
# Install dependencies
npm install

# Run tests
npm test

# Build application
npm run build

# Deploy to target environment
npm run deploy
\`\`\`

### Environment Variables
\`\`\`env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# API Keys
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret

# Environment
NODE_ENV=production
PORT=3000
\`\`\`

## Infrastructure

### Cloud Providers
- AWS, Google Cloud, or Azure
- Container orchestration (Docker/Kubernetes)
- Load balancing and auto-scaling

### Database
- Database hosting and backups
- Connection pooling
- Performance monitoring

### CDN & Static Assets
- Content delivery network
- Asset optimization
- Caching strategies

## Monitoring
- Application performance monitoring
- Error tracking and alerting
- Log aggregation and analysis
- Health checks and uptime monitoring

## Rollback Procedures
- Blue-green deployment
- Database migration rollbacks
- Emergency response procedures
`;
    }

    /**
     * Generate testing strategy
     */
    private generateTestingStrategy(): string {
        return `# Testing Strategy

## Purpose
This document outlines the testing approach and methodologies for ensuring code quality.

## Testing Pyramid

### Unit Tests (70%)
- Individual function and component testing
- Fast execution and isolated testing
- High code coverage target (>90%)

### Integration Tests (20%)
- Component interaction testing
- API endpoint testing
- Database integration testing

### End-to-End Tests (10%)
- Complete user flow testing
- Cross-browser compatibility
- Performance and load testing

## Testing Tools

### Frontend Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing
- **Storybook**: Component documentation and testing

### Backend Testing
- **Jest**: Unit and integration testing
- **Supertest**: API endpoint testing
- **Test Containers**: Database testing

## Test Organization

### File Structure
\`\`\`
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  utils/
    helpers.ts
    helpers.test.ts
  __tests__/
    integration/
    e2e/
\`\`\`

### Naming Conventions
- \`*.test.ts\` for unit tests
- \`*.integration.test.ts\` for integration tests
- \`*.e2e.test.ts\` for end-to-end tests

## Test Data Management
- Test fixtures and factories
- Database seeding for tests
- Mock data generation

## Continuous Integration
- Automated test execution
- Code coverage reporting
- Quality gates and branch protection

## Performance Testing
- Load testing scenarios
- Performance benchmarks
- Memory leak detection

## Testing Best Practices
- Write tests before or alongside code
- Keep tests simple and focused
- Use descriptive test names
- Maintain test independence
- Regular test maintenance and updates
`;
    }

    /**
     * Generate code standards
     */
    private generateCodeStandards(): string {
        return `# Code Standards

## Purpose
This document establishes coding conventions and best practices for consistent code quality.

## General Principles

### Code Quality
- **Readability**: Code should be self-documenting
- **Consistency**: Follow established patterns
- **Simplicity**: Prefer simple solutions over complex ones
- **Maintainability**: Write code that's easy to modify

### SOLID Principles
- **Single Responsibility**: One reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Many specific interfaces
- **Dependency Inversion**: Depend on abstractions

## Naming Conventions

### Variables and Functions
\`\`\`typescript
// Use camelCase
const userName = 'john_doe';
const calculateTotalPrice = () => {};

// Use descriptive names
const isUserAuthenticated = true;
const fetchUserProfile = async () => {};
\`\`\`

### Constants
\`\`\`typescript
// Use SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
\`\`\`

### Classes and Interfaces
\`\`\`typescript
// Use PascalCase
class UserService {}
interface UserProfile {}
type ApiResponse<T> = {};
\`\`\`

## Code Organization

### File Structure
- Group related functionality
- Use index files for clean imports
- Separate concerns into different files

### Import Organization
\`\`\`typescript
// 1. Node modules
import React from 'react';
import axios from 'axios';

// 2. Internal modules
import { UserService } from '../services';
import { Button } from '../components';

// 3. Relative imports
import './Component.css';
\`\`\`

## Function Guidelines

### Function Size
- Keep functions small and focused
- Single responsibility per function
- Maximum 20-30 lines when possible

### Parameters
- Limit function parameters (max 3-4)
- Use objects for multiple parameters
- Provide default values when appropriate

## Error Handling

### Try-Catch Blocks
\`\`\`typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new CustomError('Operation failed', error);
}
\`\`\`

### Error Types
- Use specific error types
- Provide meaningful error messages
- Include context information

## Documentation

### JSDoc Comments
\`\`\`typescript
/**
 * Calculates the total price including tax
 * @param basePrice - The base price before tax
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total price including tax
 */
function calculateTotalPrice(basePrice: number, taxRate: number): number {
  return basePrice * (1 + taxRate);
}
\`\`\`

## Code Review Checklist
- [ ] Code follows naming conventions
- [ ] Functions are small and focused
- [ ] Error handling is appropriate
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No code duplication
- [ ] Performance considerations addressed
`;
    }

    /**
     * Generate project glossary
     */
    private generateProjectGlossary(): string {
        return `# Project Glossary

## Purpose
This document defines key terms, concepts, and acronyms used throughout the project.

## Business Terms

### [Domain-Specific Term]
**Definition**: Explanation of the term in the context of this project.
**Usage**: How and where this term is used.
**Related Terms**: Other terms that are related or similar.

### User
**Definition**: An individual who interacts with the application.
**Types**: Admin, Regular User, Guest
**Permissions**: Varies by user type

## Technical Terms

### API (Application Programming Interface)
**Definition**: Set of protocols and tools for building software applications.
**Usage**: Communication between frontend and backend.
**Standards**: RESTful API design principles.

### JWT (JSON Web Token)
**Definition**: Compact, URL-safe means of representing claims between parties.
**Usage**: Authentication and authorization.
**Structure**: Header.Payload.Signature

### CRUD (Create, Read, Update, Delete)
**Definition**: Basic operations for persistent storage.
**Usage**: Standard database operations.
**Implementation**: HTTP methods (POST, GET, PUT, DELETE)

## Acronyms

- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **SPA**: Single Page Application
- **SSR**: Server-Side Rendering
- **CSR**: Client-Side Rendering
- **CDN**: Content Delivery Network
- **CI/CD**: Continuous Integration/Continuous Deployment

## Project-Specific Terms

### [Feature Name]
**Definition**: Description of the feature.
**Components**: Related components and modules.
**Workflow**: How the feature works.

### [Business Process]
**Definition**: Description of the business process.
**Steps**: Sequential steps in the process.
**Stakeholders**: Who is involved in the process.

## Data Entities

### [Entity Name]
**Definition**: What this entity represents.
**Attributes**: Key properties and fields.
**Relationships**: How it relates to other entities.
**Business Rules**: Constraints and validation rules.

## Conventions

### Naming Conventions
- **Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Classes**: PascalCase
- **Files**: kebab-case

### Status Values
- **Active**: Entity is currently in use
- **Inactive**: Entity is disabled but not deleted
- **Pending**: Entity is awaiting approval or processing
- **Archived**: Entity is no longer active but preserved

## References
- Link to external documentation
- Industry standards and specifications
- Related project documentation
`;
    }

    /**
     * Generate intelligent summary of created context files
     */
    private async generateIntelligentSummary(contextFiles: Array<{name: string, content: string}>): Promise<void> {
        const outputPath = getContextCardOutputPath(this.workspaceUri);
        const summaryPath = vscode.Uri.joinPath(outputPath, 'context-summary.md');
        
        const summary = `# Context Cards Summary

Generated on: ${new Date().toISOString()}

Total context files generated: ${contextFiles.length}

## Generated Context Files

${contextFiles.map(file => `- **${file.name}**: ${this.getFileDescription(file.name)}`).join('\n')}

## Purpose

These context files provide comprehensive guidance for developers working on this project. They establish:

- **Architecture Guidelines**: How the system should be structured
- **Development Standards**: Coding conventions and best practices
- **Security Considerations**: Important security requirements
- **Testing Strategy**: How to ensure code quality
- **Deployment Process**: How to deploy the application

## Usage

Each context file serves as a reference document for specific aspects of development:

1. **Start with Architecture Overview** to understand the system design
2. **Review Code Standards** before writing code
3. **Follow Testing Strategy** for quality assurance
4. **Consult Security Guide** for security implementations
5. **Use Deployment Guide** for environment setup

## Next Steps

1. Review and customize each context file for your specific project needs
2. Update the files as the project evolves
3. Ensure all team members are familiar with the guidelines
4. Integrate these guidelines into your development workflow

## Maintenance

These context files should be:
- Updated regularly as the project evolves
- Reviewed during code reviews
- Referenced during onboarding new team members
- Used as the foundation for project documentation
`;

        await vscode.workspace.fs.writeFile(summaryPath, Buffer.from(summary, 'utf8'));
    }

    /**
     * Get description for a context file
     */
    private getFileDescription(fileName: string): string {
        const descriptions: Record<string, string> = {
            'architecture-overview.md': 'High-level system architecture and design decisions',
            'data-models.md': 'Data structures, entities, and database schema',
            'api-specification.md': 'API endpoints, request/response formats, and integration guidelines',
            'user-flows.md': 'User journeys and interaction patterns',
            'component-structure.md': 'Frontend component organization and patterns',
            'security-considerations.md': 'Security best practices and requirements',
            'deployment-guide.md': 'Environment setup and deployment procedures',
            'testing-strategy.md': 'Testing approach and quality assurance guidelines',
            'code-standards.md': 'Coding conventions and best practices',
            'project-glossary.md': 'Key terms, concepts, and project-specific definitions'
        };
        
        return descriptions[fileName] || 'Project guidance document';
    }
}
