// @ts-nocheck
/**
 * @file handleGenerateEnhancedCCS.ts
 * @description Handles the generation of enhanced Code Comprehension Score (CCS) analysis using Codebase Lens integration.
 * 
 * The logic of this file is to:
 * 1. Coordinate enhanced CCS analysis using semantic search capabilities
 * 2. Handle webview communication and progress reporting for enhanced analysis
 * 3. Save enhanced analysis results with detailed breakdowns
 * 4. Provide fallback to basic CCS when Codebase Lens is unavailable
 */

import * as vscode from 'vscode';
import { OpenAiService } from '../../utils/openai';
import { handleGenerationError, handleApiError, withErrorHandling } from '../../utils/errorHandler';
import { getCcsOutputPath, ensureOutputDirectory } from '../../utils/configManager';
import { EnhancedCcsService } from '../../services/enhancedCcsService';
import { CodebaseLensIntegrationService } from '../../services/codebaseLensIntegrationService';
import { CCSPromptTemplate } from '../../templates/ccsPromptTemplate';
import { MarkdownFormatterService } from '../../services/markdownFormatterService';
import { CCSAnalysisOptions, CCSAnalysisMode } from '../../interfaces/enhancedCodebaseAnalysis';

/**
 * Logic Step: Handles the 'generate-enhanced-ccs' message from the webview to generate an enhanced CCS analysis.
 * 
 * This function coordinates the entire enhanced CCS generation process:
 * 1. Validates prerequisites (API key, workspace)
 * 2. Checks Codebase Lens availability and handles fallback
 * 3. Uses EnhancedCcsService for comprehensive semantic analysis
 * 4. Generates detailed breakdowns and comparison reports
 * 5. Saves results and updates the webview with enhanced insights
 * 
 * @param message - The message object from the webview (must have command: 'generate-enhanced-ccs')
 * @param context - The VS Code extension context for accessing secrets and workspace
 * @param webview - The webview instance to post progress and results back to
 * @returns Promise<vscode.Uri | undefined> - The URI of the generated enhanced CCS file, or undefined if generation fails
 * 
 * @example
 * ```typescript
 * const result = await handleGenerateEnhancedCCS(message, context, webview);
 * if (result) {
 *     console.log(`Enhanced CCS analysis saved to: ${result.fsPath}`);
 * }
 * ```
 */
export async function handleGenerateEnhancedCCS(message: any, context: vscode.ExtensionContext, webview: vscode.Webview): Promise<vscode.Uri | undefined> {
    if (message.command !== 'generate-enhanced-ccs') {
        return undefined;
    }

    let generatedPath: vscode.Uri | undefined = undefined;

    await vscode.window.withProgress({ 
        location: vscode.ProgressLocation.Notification, 
        title: "Analyzing Enhanced Code Comprehension Score...", 
        cancellable: false 
    }, async (progress) => {
        // Logic Step: Validate prerequisites
        const validationResult = await validatePrerequisites(context, webview);
        if (!validationResult) {
            return;
        }

        const { apiKey, workspaceUri } = validationResult;

        // Logic Step: Use error handling wrapper for the entire generation process
        const result = await withErrorHandling(async () => {
            // Logic Step: Check Codebase Lens availability and prepare analysis options
            progress.report({ increment: 5, message: "Checking Codebase Lens availability..." });
            const analysisOptions = await prepareAnalysisOptions(message, progress);
            
            // Logic Step: Perform enhanced codebase analysis
            progress.report({ increment: 15, message: "Initializing enhanced codebase analysis..." });
            const enhancedCcsService = new EnhancedCcsService();
            
            progress.report({ increment: 25, message: "Performing semantic analysis..." });
            const enhancedAnalysis = await enhancedCcsService.analyzeWorkspaceEnhanced(workspaceUri, analysisOptions);
            
            // Logic Step: Generate detailed breakdown
            progress.report({ increment: 50, message: "Generating detailed score breakdown..." });
            const scoreBreakdown = enhancedCcsService.generateCcsBreakdown(enhancedAnalysis);
            
            // Logic Step: Generate comparison report if requested
            let comparisonReport = null;
            if (analysisOptions.includeComparison) {
                progress.report({ increment: 60, message: "Generating comparison report..." });
                comparisonReport = enhancedCcsService.generateComparisonReport(enhancedAnalysis);
            }
            
            // Logic Step: Generate AI prompt with enhanced data
            progress.report({ increment: 70, message: "Generating enhanced AI analysis prompt..." });
            const prompt = generateEnhancedPrompt(enhancedAnalysis, scoreBreakdown, comparisonReport);
            
            // Logic Step: Call AI service for enhanced analysis
            progress.report({ increment: 75, message: "Calling AI for enhanced code analysis..." });
            const openAiService = new OpenAiService(apiKey);
            const rawEnhancedAnalysis = await openAiService.generateText(prompt);
            
            if (!rawEnhancedAnalysis) {
                throw new Error('No enhanced CCS analysis generated by AI service');
            }

            // Logic Step: Format the enhanced analysis results
            progress.report({ increment: 85, message: "Formatting enhanced analysis results..." });
            const formattedAnalysis = MarkdownFormatterService.formatCCSResults(rawEnhancedAnalysis);
            
            // Logic Step: Save the enhanced analysis to file
            progress.report({ increment: 90, message: "Saving enhanced analysis to file..." });
            const savedFilePath = await saveEnhancedCcsAnalysis(workspaceUri, rawEnhancedAnalysis, enhancedAnalysis);
            
            // Logic Step: Send the enhanced analysis to the webview
            progress.report({ increment: 95, message: "Updating webview with enhanced results..." });
            await webview.postMessage({ 
                command: 'enhancedCcsGenerated', 
                analysis: formattedAnalysis,
                filePath: savedFilePath.fsPath,
                scoreBreakdown: scoreBreakdown,
                comparisonReport: comparisonReport,
                isEnhanced: enhancedAnalysis.semanticMetrics.isEnhanced,
                basicScore: enhancedAnalysis.ccsCalculation.basicScore,
                enhancedScore: enhancedAnalysis.ccsCalculation.enhancedScore
            });

            progress.report({ increment: 100, message: "Enhanced CCS analysis complete!" });
            return savedFilePath;
        }, 'Enhanced CCS generation', webview);

        if (result) {
            generatedPath = result;
        }
    });

    return generatedPath;
}

/**
 * Logic Step: Prepares analysis options based on message parameters and Codebase Lens availability.
 * 
 * Determines the appropriate analysis mode and configuration:
 * - Checks if Codebase Lens extension is available
 * - Sets analysis mode based on availability and user preferences
 * - Configures timeout and other analysis parameters
 * 
 * @param message - The webview message containing user preferences
 * @param progress - Progress reporter for user feedback
 * @returns Promise<CCSAnalysisOptions> - Configured analysis options
 */
async function prepareAnalysisOptions(message: any, progress: vscode.Progress<{ increment?: number; message?: string }>): Promise<CCSAnalysisOptions> {
    const isCodebaseLensAvailable = CodebaseLensIntegrationService.isCodebaseLensAvailable();
    
    if (!isCodebaseLensAvailable) {
        progress.report({ increment: 5, message: "Codebase Lens not available, using basic analysis..." });
        vscode.window.showWarningMessage(
            'Codebase Lens extension not found. Enhanced CCS analysis will fall back to basic mode. ' +
            'Install Codebase Lens for semantic analysis capabilities.'
        );
    } else {
        progress.report({ increment: 5, message: "Codebase Lens detected, enabling semantic analysis..." });
    }

    // Extract user preferences from message
    const userMode = message.mode as CCSAnalysisMode || 'enhanced';
    const includeComparison = message.includeComparison || false;
    const forceReindex = message.forceReindex || false;

    return {
        mode: isCodebaseLensAvailable ? userMode : 'basic',
        includeBreakdown: true,
        includeComparison: includeComparison && isCodebaseLensAvailable,
        forceReindex: forceReindex,
        semanticAnalysisTimeout: 30000,
        includeSampleResults: true,
        customSearchQueries: message.customSearchQueries || undefined
    };
}

/**
 * Logic Step: Generates an enhanced AI prompt that includes semantic analysis data.
 * 
 * Creates a comprehensive prompt that includes:
 * - Basic codebase metrics from traditional analysis
 * - Semantic metrics from Codebase Lens integration
 * - Detailed score breakdown with component analysis
 * - Comparison insights between basic and enhanced analysis
 * 
 * @param enhancedAnalysis - The enhanced analysis results
 * @param scoreBreakdown - Detailed score breakdown
 * @param comparisonReport - Comparison report (optional)
 * @returns string - Enhanced AI prompt for analysis
 */
function generateEnhancedPrompt(
    enhancedAnalysis: any, 
    scoreBreakdown: any, 
    comparisonReport: any
): string {
    const basePrompt = CCSPromptTemplate.generatePrompt(enhancedAnalysis);
    
    const enhancedSections = [];

    // Add semantic metrics section
    if (enhancedAnalysis.semanticMetrics.isEnhanced) {
        enhancedSections.push(`
## Semantic Analysis Results

### Documentation Quality Analysis
- Documentation Quality Score: ${enhancedAnalysis.semanticMetrics.documentationQualityScore}/100
- API Documentation Quality: ${enhancedAnalysis.enhancedQualityIndicators.apiDocumentationQuality}/100
- Usage Example Coverage: ${enhancedAnalysis.enhancedQualityIndicators.usageExampleCoverage}/100
- Architectural Documentation: ${enhancedAnalysis.enhancedQualityIndicators.architecturalDocumentation}/100

### Technical Debt Analysis
- Overall Technical Debt Score: ${enhancedAnalysis.semanticMetrics.technicalDebtScore}/100
- TODO/FIXME Count: ${enhancedAnalysis.technicalDebtAnalysis.todoCount}
- Known Issues Count: ${enhancedAnalysis.technicalDebtAnalysis.knownIssuesCount}
- Legacy Code Indicators: ${enhancedAnalysis.technicalDebtAnalysis.legacyCodeIndicators}

### Code Quality Indicators
- Test Coverage Indicators: ${enhancedAnalysis.semanticMetrics.codeQualityIndicators.testCoverage}/100
- Error Handling Maturity: ${enhancedAnalysis.semanticMetrics.codeQualityIndicators.errorHandling}/100
- Security Practices: ${enhancedAnalysis.semanticMetrics.codeQualityIndicators.security}/100
- Performance Considerations: ${enhancedAnalysis.semanticMetrics.codeQualityIndicators.performance}/100

### Architectural Maturity
- Overall Architectural Score: ${enhancedAnalysis.semanticMetrics.architecturalMaturityScore}/100
- Authentication Architecture: ${enhancedAnalysis.architecturalMaturity.designPatterns.authenticationArchitecture}/100
- Data Flow Architecture: ${enhancedAnalysis.architecturalMaturity.designPatterns.dataFlowArchitecture}/100
- API Design Maturity: ${enhancedAnalysis.architecturalMaturity.designPatterns.apiDesignMaturity}/100
`);
    }

    // Add score breakdown section
    enhancedSections.push(`
## Score Breakdown Analysis

### Component Scores
- Documentation Quality: ${scoreBreakdown.components.documentationQuality.score}/100 (Weight: ${scoreBreakdown.components.documentationQuality.weight})
- Code Quality: ${scoreBreakdown.components.codeQuality.score}/100 (Weight: ${scoreBreakdown.components.codeQuality.weight})
- Architectural Maturity: ${scoreBreakdown.components.architecturalMaturity.score}/100 (Weight: ${scoreBreakdown.components.architecturalMaturity.weight})
- Testing Maturity: ${scoreBreakdown.components.testingMaturity.score}/100 (Weight: ${scoreBreakdown.components.testingMaturity.weight})
- Technical Debt Impact: ${scoreBreakdown.components.technicalDebt.score}/100 (Weight: ${scoreBreakdown.components.technicalDebt.weight})

### Final Scores
- Basic CCS Score: ${scoreBreakdown.finalScores.basic}/100
- Enhanced CCS Score: ${scoreBreakdown.finalScores.enhanced}/100
- Improvement from Enhancement: +${scoreBreakdown.finalScores.improvement} points
`);

    // Add comparison insights if available
    if (comparisonReport) {
        enhancedSections.push(`
## Enhancement Insights

### Semantic Discoveries
- Discovered Patterns: ${comparisonReport.semanticInsights.discoveredPatterns.join(', ')}
- Quality Indicators Found: ${comparisonReport.semanticInsights.qualityIndicators.join(', ')}
- Technical Debt Areas: ${comparisonReport.semanticInsights.technicalDebtAreas.join(', ')}
- Improvement Opportunities: ${comparisonReport.semanticInsights.improvementOpportunities.join(', ')}

### Assessment Improvements
- Documentation: ${comparisonReport.differences.documentationAssessment.improvement}
- Code Quality: ${comparisonReport.differences.qualityAssessment.improvement}
- Architecture: ${comparisonReport.differences.architectureAssessment.improvement}
`);
    }

    return basePrompt + '\n\n' + enhancedSections.join('\n') + `

## Enhanced Analysis Instructions

Please provide a comprehensive Code Comprehension Score analysis that takes into account both the traditional metrics and the enhanced semantic analysis results. Focus on:

1. **Semantic Insights**: Analyze the semantic search results to provide deeper insights into code quality, documentation effectiveness, and architectural maturity.

2. **Weighted Scoring**: Use the component scores and weights to explain how the final CCS was calculated and why it differs from a basic analysis.

3. **Actionable Recommendations**: Provide specific, prioritized recommendations based on the semantic analysis findings.

4. **Improvement Roadmap**: Suggest a clear path for improving the CCS score, focusing on areas with the highest impact potential.

5. **Context-Aware Assessment**: Consider the project type, size, and apparent maturity level when making recommendations.

Generate a detailed analysis that leverages the rich semantic data to provide insights that wouldn't be possible with basic file scanning alone.
`;
}

/**
 * Logic Step: Validates prerequisites for enhanced CCS generation.
 * 
 * Checks for required conditions before starting analysis:
 * - OpenAI API key availability
 * - Workspace folder existence
 * - Proper error reporting if validation fails
 * 
 * @param context - VS Code extension context for accessing secrets
 * @param webview - Webview for error reporting
 * @returns Promise<{apiKey: string, workspaceUri: vscode.Uri} | null> - Validation result or null if failed
 */
async function validatePrerequisites(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<{apiKey: string, workspaceUri: vscode.Uri} | null> {
    // Logic Step: Check for API key
    const apiKey = await context.secrets.get('openAiApiKey');
    if (!apiKey) {
        handleApiError(
            new Error('OpenAI API Key not set'), 
            'OpenAI', 
            'authentication', 
            webview
        );
        return null;
    }

    // Logic Step: Check for workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        handleGenerationError(
            new Error('No workspace folder found'), 
            'Enhanced CCS generation', 
            webview
        );
        return null;
    }

    return {
        apiKey,
        workspaceUri: workspaceFolders[0].uri
    };
}

/**
 * Logic Step: Saves enhanced CCS analysis to a timestamped markdown file with additional metadata.
 * 
 * Creates a comprehensive file that includes:
 * - Raw AI analysis content
 * - Detailed score breakdown
 * - Semantic analysis metadata
 * - Comparison insights (if available)
 * 
 * @param workspaceUri - The workspace root URI for path resolution
 * @param analysisContent - The raw markdown CCS analysis content from AI
 * @param enhancedAnalysis - The complete enhanced analysis object
 * @returns Promise<vscode.Uri> - URI of the saved file
 * @throws {Error} When file saving fails
 */
async function saveEnhancedCcsAnalysis(
    workspaceUri: vscode.Uri, 
    analysisContent: string, 
    enhancedAnalysis: any
): Promise<vscode.Uri> {
    try {
        // Logic Step: Ensure output directory exists
        const outputDir = getCcsOutputPath(workspaceUri);
        await ensureOutputDirectory(outputDir);
        
        // Logic Step: Generate unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const analysisType = enhancedAnalysis.semanticMetrics.isEnhanced ? 'enhanced' : 'basic';
        const ccsFilePath = vscode.Uri.joinPath(outputDir, `ccs-analysis-${analysisType}-${timestamp}.md`);
        
        // Logic Step: Prepare comprehensive content
        const comprehensiveContent = `# Enhanced Code Comprehension Score Analysis

Generated on: ${new Date().toISOString()}
Analysis Type: ${analysisType}
Scoring Method: ${enhancedAnalysis.ccsCalculation.scoringMethod}

## Score Summary

- **Basic CCS Score**: ${enhancedAnalysis.ccsCalculation.basicScore}/100
- **Enhanced CCS Score**: ${enhancedAnalysis.ccsCalculation.enhancedScore}/100
- **Improvement**: +${enhancedAnalysis.ccsCalculation.enhancedScore - enhancedAnalysis.ccsCalculation.basicScore} points
- **Confidence Level**: ${enhancedAnalysis.ccsCalculation.confidenceLevel}/100

## Quick Recommendations

${enhancedAnalysis.ccsCalculation.recommendedActions.map((action: string) => `- ${action}`).join('\n')}

---

${analysisContent}

---

## Technical Metadata

### Analysis Configuration
- Semantic Analysis Available: ${enhancedAnalysis.semanticMetrics.isEnhanced}
- Total Files Analyzed: ${enhancedAnalysis.totalFiles}
- Total Lines of Code: ${enhancedAnalysis.totalLines}
- Analysis Duration: ${enhancedAnalysis.metadata.durationMs}ms

### Semantic Metrics Summary
- Documentation Quality: ${enhancedAnalysis.semanticMetrics.documentationQualityScore}/100
- Technical Debt Level: ${enhancedAnalysis.semanticMetrics.technicalDebtScore}/100
- Architectural Maturity: ${enhancedAnalysis.semanticMetrics.architecturalMaturityScore}/100
- Test Coverage Indicators: ${enhancedAnalysis.semanticMetrics.codeQualityIndicators.testCoverage}/100

### File Type Distribution
${Object.entries(enhancedAnalysis.fileTypes).map(([ext, count]) => `- ${ext}: ${count} files`).join('\n')}
`;
        
        // Logic Step: Write comprehensive content to file
        await vscode.workspace.fs.writeFile(ccsFilePath, Buffer.from(comprehensiveContent, 'utf-8'));
        
        return ccsFilePath;
    } catch (error) {
        throw new Error(`Failed to save enhanced CCS analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
