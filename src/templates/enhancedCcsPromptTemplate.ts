// @ts-nocheck
/**
 * @file enhancedCcsPromptTemplate.ts
 * @description Provides enhanced AI prompt generation for CCS analysis that incorporates semantic search results.
 * 
 * The logic of this file is to:
 * 1. Generate comprehensive AI prompts that include semantic analysis data
 * 2. Structure prompts to leverage Codebase Lens search results for deeper insights
 * 3. Provide context-aware scoring guidance based on semantic metrics
 * 4. Enable AI to generate more accurate and actionable CCS assessments
 */

import { EnhancedCodebaseAnalysis, CCSScoreBreakdown } from '../interfaces/enhancedCodebaseAnalysis';
import { SearchResultSummary } from '../services/codebaseLensIntegrationService';

/**
 * @class EnhancedCCSPromptTemplate
 * @description Template generator for enhanced CCS analysis prompts that include semantic search data.
 */
export class EnhancedCCSPromptTemplate {

    /**
     * @method generateEnhancedPrompt
     * @description Generates a comprehensive AI prompt for enhanced CCS analysis.
     * @param {EnhancedCodebaseAnalysis} analysis - The enhanced codebase analysis results.
     * @param {CCSScoreBreakdown} scoreBreakdown - Detailed score breakdown with component analysis.
     * @returns {string} Complete AI prompt for enhanced CCS generation.
     */
    static generateEnhancedPrompt(analysis: EnhancedCodebaseAnalysis, scoreBreakdown: CCSScoreBreakdown): string {
        const sections = [
            this.generateHeader(),
            this.generateBasicMetrics(analysis),
            this.generateSemanticAnalysisSection(analysis),
            this.generateScoreBreakdownSection(scoreBreakdown),
            this.generateSearchResultsSection(analysis.semanticMetrics.semanticSearchResults),
            this.generateScoringGuidelines(),
            this.generateOutputInstructions()
        ];

        return sections.join('\n\n');
    }

    /**
     * @method generateHeader
     * @description Generates the header section of the enhanced CCS prompt.
     * @returns {string} Header section with context and objectives.
     * @private
     */
    private static generateHeader(): string {
        return `# Enhanced Code Comprehension Score (CCS) Analysis

You are an expert code analyst tasked with generating a comprehensive Code Comprehension Score for a software project. This analysis uses both traditional file-based metrics and advanced semantic search results to provide a nuanced assessment of code quality, documentation, and architectural maturity.

## Analysis Objectives

1. **Comprehensive Assessment**: Evaluate the codebase across multiple dimensions including documentation quality, code structure, technical debt, and architectural maturity.

2. **Semantic Insights**: Leverage semantic search results to understand the actual quality and completeness of documentation, not just its existence.

3. **Actionable Recommendations**: Provide specific, prioritized recommendations for improving the Code Comprehension Score.

4. **Context-Aware Scoring**: Consider the project type, size, and apparent maturity level when making assessments.

5. **Evidence-Based Analysis**: Base all conclusions on the provided semantic search results and quantitative metrics.`;
    }

    /**
     * @method generateBasicMetrics
     * @description Generates the basic codebase metrics section.
     * @param {EnhancedCodebaseAnalysis} analysis - The analysis results.
     * @returns {string} Basic metrics section.
     * @private
     */
    private static generateBasicMetrics(analysis: EnhancedCodebaseAnalysis): string {
        const topFileTypes = Object.entries(analysis.fileTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([ext, count]) => `  - ${ext}: ${count} files`)
            .join('\n');

        return `## Basic Codebase Metrics

### Project Overview
- **Total Files**: ${analysis.totalFiles}
- **Total Lines of Code**: ${analysis.totalLines.toLocaleString()}
- **Analysis Duration**: ${analysis.metadata.durationMs}ms
- **Files Analyzed**: ${analysis.sampleFiles.length} sample files

### File Type Distribution
${topFileTypes}

### Traditional Quality Indicators
- **Has README**: ${analysis.hasReadme ? '✅ Yes' : '❌ No'}
- **Has Tests**: ${analysis.hasTests ? '✅ Yes' : '❌ No'}
- **Has Type Definitions**: ${analysis.hasTypeDefinitions ? '✅ Yes' : '❌ No'}
- **Has Documentation**: ${analysis.hasDocumentation ? '✅ Yes' : '❌ No'}

### Project Structure
- **Directories**: ${analysis.directories.length}
- **Max Depth Reached**: ${analysis.metadata.maxDepthReached}
- **Files Skipped**: ${analysis.metadata.filesSkipped}
- **Analysis Warnings**: ${analysis.metadata.warnings.length}`;
    }

    /**
     * @method generateSemanticAnalysisSection
     * @description Generates the semantic analysis results section.
     * @param {EnhancedCodebaseAnalysis} analysis - The analysis results.
     * @returns {string} Semantic analysis section.
     * @private
     */
    private static generateSemanticAnalysisSection(analysis: EnhancedCodebaseAnalysis): string {
        if (!analysis.semanticMetrics.isEnhanced) {
            return `## Semantic Analysis Results

**Note**: Enhanced semantic analysis was not available for this codebase. The analysis below is based on traditional file scanning methods only.

### Analysis Limitations
- No semantic search capabilities available
- Documentation quality cannot be assessed beyond file existence
- Technical debt analysis limited to basic heuristics
- Architectural pattern detection not available

**Recommendation**: Install and configure Codebase Lens extension for enhanced semantic analysis capabilities.`;
        }

        return `## Enhanced Semantic Analysis Results

### Documentation Quality Assessment
- **Overall Documentation Score**: ${analysis.semanticMetrics.documentationQualityScore}/100
- **API Documentation Quality**: ${analysis.enhancedQualityIndicators.apiDocumentationQuality}/100
- **Usage Example Coverage**: ${analysis.enhancedQualityIndicators.usageExampleCoverage}/100
- **Architectural Documentation**: ${analysis.enhancedQualityIndicators.architecturalDocumentation}/100
- **Troubleshooting Support**: ${analysis.enhancedQualityIndicators.troubleshootingSupport}/100

### Technical Debt Analysis
- **Overall Technical Debt Score**: ${analysis.semanticMetrics.technicalDebtScore}/100 (lower is better)
- **TODO/FIXME Items**: ${analysis.technicalDebtAnalysis.todoCount}
- **Known Issues**: ${analysis.technicalDebtAnalysis.knownIssuesCount}
- **Legacy Code Indicators**: ${analysis.technicalDebtAnalysis.legacyCodeIndicators}
- **Refactoring Needs**: ${analysis.technicalDebtAnalysis.refactoringNeeds}

### Code Quality Indicators
- **Testing Maturity**: ${analysis.semanticMetrics.codeQualityIndicators.testCoverage}/100
- **Error Handling**: ${analysis.semanticMetrics.codeQualityIndicators.errorHandling}/100
- **Security Practices**: ${analysis.semanticMetrics.codeQualityIndicators.security}/100
- **Performance Considerations**: ${analysis.semanticMetrics.codeQualityIndicators.performance}/100

### Architectural Maturity
- **Overall Architecture Score**: ${analysis.semanticMetrics.architecturalMaturityScore}/100
- **Authentication Architecture**: ${analysis.architecturalMaturity.designPatterns.authenticationArchitecture}/100
- **Data Flow Architecture**: ${analysis.architecturalMaturity.designPatterns.dataFlowArchitecture}/100
- **API Design Maturity**: ${analysis.architecturalMaturity.designPatterns.apiDesignMaturity}/100
- **Database Design**: ${analysis.architecturalMaturity.designPatterns.databaseDesignMaturity}/100
- **Configuration Management**: ${analysis.architecturalMaturity.designPatterns.configurationManagement}/100`;
    }

    /**
     * @method generateScoreBreakdownSection
     * @description Generates the score breakdown section showing component contributions.
     * @param {CCSScoreBreakdown} scoreBreakdown - The detailed score breakdown.
     * @returns {string} Score breakdown section.
     * @private
     */
    private static generateScoreBreakdownSection(scoreBreakdown: CCSScoreBreakdown): string {
        return `## Score Breakdown Analysis

### Component Scores and Weights
- **Documentation Quality**: ${scoreBreakdown.components.documentationQuality.score}/100 (Weight: ${scoreBreakdown.components.documentationQuality.weight})
- **Code Quality**: ${scoreBreakdown.components.codeQuality.score}/100 (Weight: ${scoreBreakdown.components.codeQuality.weight})
- **Architectural Maturity**: ${scoreBreakdown.components.architecturalMaturity.score}/100 (Weight: ${scoreBreakdown.components.architecturalMaturity.weight})
- **Testing Maturity**: ${scoreBreakdown.components.testingMaturity.score}/100 (Weight: ${scoreBreakdown.components.testingMaturity.weight})
- **Technical Debt Impact**: ${scoreBreakdown.components.technicalDebt.score}/100 (Weight: ${scoreBreakdown.components.technicalDebt.weight})

### Final Calculated Scores
- **Basic CCS Score**: ${scoreBreakdown.finalScores.basic}/100
- **Enhanced CCS Score**: ${scoreBreakdown.finalScores.enhanced}/100
- **Improvement from Enhancement**: ${scoreBreakdown.finalScores.improvement > 0 ? '+' : ''}${scoreBreakdown.finalScores.improvement} points

### Scoring Methodology
- **Scoring Version**: ${scoreBreakdown.methodology.scoringVersion}
- **Analysis Timestamp**: ${scoreBreakdown.methodology.analysisTimestamp.toISOString()}
- **Semantic Analysis Available**: ${scoreBreakdown.methodology.semanticAnalysisAvailable ? 'Yes' : 'No'}`;
    }

    /**
     * @method generateSearchResultsSection
     * @description Generates a section showing key semantic search results.
     * @param {SearchResultSummary[]} searchResults - The semantic search results.
     * @returns {string} Search results section.
     * @private
     */
    private static generateSearchResultsSection(searchResults: SearchResultSummary[]): string {
        if (!searchResults || searchResults.length === 0) {
            return `## Semantic Search Results

No semantic search results available. Analysis is based on traditional file scanning only.`;
        }

        const categorizedResults = this.categorizeSearchResults(searchResults);

        const sections = [];

        if (categorizedResults.documentation.length > 0) {
            sections.push(`### Documentation Analysis
${categorizedResults.documentation.map(result => 
    `- **${result.query}**: ${result.resultCount} matches (Score: ${result.score}/100)`
).join('\n')}`);
        }

        if (categorizedResults.quality.length > 0) {
            sections.push(`### Code Quality Analysis
${categorizedResults.quality.map(result => 
    `- **${result.query}**: ${result.resultCount} matches (Score: ${result.score}/100)`
).join('\n')}`);
        }

        if (categorizedResults.architecture.length > 0) {
            sections.push(`### Architecture Analysis
${categorizedResults.architecture.map(result => 
    `- **${result.query}**: ${result.resultCount} matches (Score: ${result.score}/100)`
).join('\n')}`);
        }

        if (categorizedResults.technical_debt.length > 0) {
            sections.push(`### Technical Debt Analysis
${categorizedResults.technical_debt.map(result => 
    `- **${result.query}**: ${result.resultCount} matches (Score: ${result.score}/100)`
).join('\n')}`);
        }

        return `## Semantic Search Results

${sections.join('\n\n')}

### Key Insights from Search Results
${this.generateSearchInsights(searchResults)}`;
    }

    /**
     * @method generateScoringGuidelines
     * @description Generates scoring guidelines for the AI analysis.
     * @returns {string} Scoring guidelines section.
     * @private
     */
    private static generateScoringGuidelines(): string {
        return `## Scoring Guidelines

### Enhanced CCS Scoring Criteria

**90-100 (Excellent)**
- Comprehensive documentation with examples and architectural guides
- Extensive test coverage with clear testing strategies
- Minimal technical debt with proactive maintenance
- Mature architectural patterns with clear separation of concerns
- Strong security and performance considerations

**75-89 (Good)**
- Good documentation covering most functionality
- Solid test coverage with some gaps
- Manageable technical debt with improvement plans
- Clear architectural patterns with minor inconsistencies
- Basic security and performance practices

**60-74 (Fair)**
- Basic documentation with significant gaps
- Limited test coverage or testing strategy
- Noticeable technical debt requiring attention
- Some architectural patterns but lacks consistency
- Minimal security and performance considerations

**45-59 (Poor)**
- Minimal or outdated documentation
- Very limited testing infrastructure
- Significant technical debt impacting maintainability
- Ad-hoc architecture with little structure
- No evident security or performance practices

**Below 45 (Critical)**
- Little to no documentation
- No testing strategy or infrastructure
- Overwhelming technical debt
- No clear architectural patterns
- Security and performance not considered

### Weighting Guidelines
- **Documentation Quality (25%)**: Emphasize completeness, accuracy, and usefulness
- **Code Quality (20%)**: Focus on testing, error handling, and best practices
- **Architectural Maturity (15%)**: Assess design patterns and system organization
- **Testing Maturity (20%)**: Evaluate test coverage and testing strategy
- **Technical Debt Penalty (10%)**: Deduct for unaddressed issues and maintenance needs
- **Project Structure (10%)**: Consider organization and discoverability`;
    }

    /**
     * @method generateOutputInstructions
     * @description Generates instructions for the AI output format.
     * @returns {string} Output instructions section.
     * @private
     */
    private static generateOutputInstructions(): string {
        return `## Output Instructions

Please provide a comprehensive Code Comprehension Score analysis in the following format:

### 1. Executive Summary
- Final CCS Score with clear justification
- Key strengths and weaknesses
- Overall assessment of codebase maturity

### 2. Detailed Analysis
- **Documentation Assessment**: Quality, completeness, and usefulness
- **Code Quality Assessment**: Testing, practices, and maintainability
- **Architecture Assessment**: Design patterns and system organization
- **Technical Debt Assessment**: Issues and maintenance needs

### 3. Semantic Insights
- Key findings from semantic search analysis
- Patterns discovered that wouldn't be visible in basic analysis
- Evidence-based observations about code quality

### 4. Improvement Recommendations
- **High Priority**: Critical improvements needed immediately
- **Medium Priority**: Important improvements for the next iteration
- **Low Priority**: Nice-to-have improvements for future consideration
- **Quick Wins**: Easy improvements with high impact

### 5. Scoring Justification
- Explanation of how the final score was calculated
- Breakdown of component contributions
- Comparison with basic analysis (if applicable)

### 6. Action Plan
- Specific steps to improve the CCS score
- Estimated effort and impact for each recommendation
- Prioritized roadmap for codebase improvements

**Important**: Base all assessments on the provided data and semantic search results. Avoid making assumptions about code quality that aren't supported by the evidence.`;
    }

    /**
     * @method categorizeSearchResults
     * @description Categorizes search results by type for better organization.
     * @param {SearchResultSummary[]} searchResults - The search results to categorize.
     * @returns {Object} Categorized search results.
     * @private
     */
    private static categorizeSearchResults(searchResults: SearchResultSummary[]): {
        documentation: SearchResultSummary[];
        quality: SearchResultSummary[];
        architecture: SearchResultSummary[];
        technical_debt: SearchResultSummary[];
    } {
        return {
            documentation: searchResults.filter(r => r.category === 'documentation'),
            quality: searchResults.filter(r => r.category === 'quality'),
            architecture: searchResults.filter(r => r.category === 'architecture'),
            technical_debt: searchResults.filter(r => r.category === 'technical_debt')
        };
    }

    /**
     * @method generateSearchInsights
     * @description Generates key insights from search results.
     * @param {SearchResultSummary[]} searchResults - The search results to analyze.
     * @returns {string} Generated insights.
     * @private
     */
    private static generateSearchInsights(searchResults: SearchResultSummary[]): string {
        const insights = [];

        // Find highest and lowest scoring categories
        const sortedResults = searchResults.sort((a, b) => b.score - a.score);
        const highest = sortedResults[0];
        const lowest = sortedResults[sortedResults.length - 1];

        if (highest) {
            insights.push(`- **Strongest Area**: ${highest.category} (${highest.query}) with ${highest.resultCount} matches`);
        }

        if (lowest && lowest.score < 50) {
            insights.push(`- **Weakest Area**: ${lowest.category} (${lowest.query}) with only ${lowest.resultCount} matches`);
        }

        // Count total matches across categories
        const totalMatches = searchResults.reduce((sum, result) => sum + result.resultCount, 0);
        insights.push(`- **Total Semantic Matches**: ${totalMatches} across ${searchResults.length} search queries`);

        // Identify categories with no matches
        const emptyCategories = searchResults.filter(r => r.resultCount === 0);
        if (emptyCategories.length > 0) {
            insights.push(`- **Missing Areas**: ${emptyCategories.length} search categories returned no results`);
        }

        return insights.length > 0 ? insights.join('\n') : '- No specific insights available from search results';
    }
}
