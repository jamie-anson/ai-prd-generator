// @ts-nocheck
/**
 * @file enhancedCodebaseAnalysis.ts
 * @description Defines enhanced interfaces for codebase analysis that include semantic metrics from Codebase Lens integration.
 * 
 * The logic of this file is to:
 * 1. Extend the base CodebaseAnalysis interface with semantic capabilities
 * 2. Provide backward compatibility with existing analysis systems
 * 3. Define comprehensive semantic scoring structures
 * 4. Support both basic and enhanced CCS calculation modes
 */

import { CodebaseAnalysis, SampleFile, AnalysisMetadata } from '../services/codebaseAnalysisService';
import { SemanticMetrics } from '../services/codebaseLensIntegrationService';

/**
 * @interface EnhancedCodebaseAnalysis
 * @description Extended codebase analysis that includes semantic metrics for enhanced CCS calculation.
 * Maintains full backward compatibility with the base CodebaseAnalysis interface.
 */
export interface EnhancedCodebaseAnalysis extends CodebaseAnalysis {
    /** Semantic analysis metrics from Codebase Lens integration */
    semanticMetrics: SemanticMetrics;
    
    /** Enhanced quality indicators beyond basic file existence checks */
    enhancedQualityIndicators: {
        documentationCoverage: number;          // 0-100: Percentage of functions/classes with docs
        apiDocumentationQuality: number;       // 0-100: Quality of API documentation
        usageExampleCoverage: number;          // 0-100: Availability of usage examples
        architecturalDocumentation: number;    // 0-100: Architecture and design docs
        troubleshootingSupport: number;        // 0-100: Support and FAQ documentation
    };
    
    /** Technical debt analysis */
    technicalDebtAnalysis: {
        todoCount: number;                     // Number of TODO/FIXME items
        knownIssuesCount: number;              // Number of documented bugs/issues
        legacyCodeIndicators: number;          // Number of deprecated/legacy markers
        refactoringNeeds: number;              // Number of refactoring suggestions
        overallDebtScore: number;              // 0-100: Overall technical debt level
    };
    
    /** Code quality deep analysis */
    codeQualityAnalysis: {
        testingMaturity: {
            testFileCount: number;             // Number of test files found
            testCoverageIndicators: number;    // References to coverage tools/metrics
            testingFrameworkUsage: number;     // Usage of testing frameworks
            testDocumentation: number;         // Documentation of testing approaches
            overallTestingScore: number;       // 0-100: Overall testing maturity
        };
        securityPractices: {
            validationPatterns: number;        // Input validation patterns
            securityDocumentation: number;     // Security-related documentation
            authenticationPatterns: number;    // Auth/authorization patterns
            securityToolsUsage: number;        // Security scanning/tools references
            overallSecurityScore: number;      // 0-100: Overall security practices
        };
        performanceConsiderations: {
            optimizationPatterns: number;      // Performance optimization code
            cachingStrategies: number;         // Caching implementation patterns
            performanceDocumentation: number;  // Performance-related docs
            monitoringSetup: number;           // Performance monitoring setup
            overallPerformanceScore: number;   // 0-100: Overall performance maturity
        };
        errorHandling: {
            exceptionHandlingPatterns: number; // Try-catch and error handling
            errorDocumentation: number;        // Error handling documentation
            loggingImplementation: number;     // Logging and monitoring setup
            recoveryMechanisms: number;        // Error recovery patterns
            overallErrorHandlingScore: number; // 0-100: Overall error handling
        };
    };
    
    /** Architectural maturity assessment */
    architecturalMaturity: {
        designPatterns: {
            authenticationArchitecture: number; // Auth system design
            dataFlowArchitecture: number;      // Data flow and state management
            apiDesignMaturity: number;         // API design and documentation
            databaseDesignMaturity: number;    // Database schema and modeling
            configurationManagement: number;   // Configuration and environment setup
            extensibilityPatterns: number;     // Plugin/middleware patterns
            dependencyManagement: number;      // Dependency injection and management
        };
        overallArchitecturalScore: number;     // 0-100: Overall architectural maturity
    };
    
    /** CCS calculation metadata */
    ccsCalculation: {
        basicScore: number;                    // 0-100: Score using basic analysis only
        enhancedScore: number;                 // 0-100: Score using semantic analysis
        improvementPotential: number;         // 0-100: Potential for improvement
        scoringMethod: 'basic' | 'enhanced';   // Which scoring method was used
        confidenceLevel: number;              // 0-100: Confidence in the analysis
        recommendedActions: string[];         // Specific improvement recommendations
    };
}

/**
 * @interface CCSScoreBreakdown
 * @description Detailed breakdown of how the CCS score was calculated.
 */
export interface CCSScoreBreakdown {
    /** Component scores that make up the final CCS */
    components: {
        documentationQuality: {
            score: number;
            weight: number;
            contribution: number;
            details: string[];
        };
        codeQuality: {
            score: number;
            weight: number;
            contribution: number;
            details: string[];
        };
        architecturalMaturity: {
            score: number;
            weight: number;
            contribution: number;
            details: string[];
        };
        technicalDebt: {
            score: number;
            weight: number;
            contribution: number;
            details: string[];
        };
        testingMaturity: {
            score: number;
            weight: number;
            contribution: number;
            details: string[];
        };
    };
    
    /** Final calculated scores */
    finalScores: {
        basic: number;                         // Basic CCS score (0-100)
        enhanced: number;                      // Enhanced CCS score (0-100)
        improvement: number;                   // Improvement from basic to enhanced
    };
    
    /** Scoring methodology information */
    methodology: {
        scoringVersion: string;                // Version of scoring algorithm used
        analysisTimestamp: Date;               // When analysis was performed
        semanticAnalysisAvailable: boolean;    // Whether semantic analysis was used
        totalWeightedScore: number;            // Raw weighted score before normalization
        normalizationFactor: number;          // Factor used to normalize to 0-100 scale
    };
    
    /** Actionable recommendations */
    recommendations: {
        highPriority: string[];                // Critical improvements needed
        mediumPriority: string[];              // Important improvements
        lowPriority: string[];                 // Nice-to-have improvements
        quickWins: string[];                   // Easy improvements with high impact
    };
}

/**
 * @interface CCSComparisonReport
 * @description Compares basic vs enhanced CCS analysis results.
 */
export interface CCSComparisonReport {
    /** Comparison summary */
    summary: {
        basicScore: number;
        enhancedScore: number;
        improvement: number;
        enhancementValue: 'significant' | 'moderate' | 'minimal';
    };
    
    /** Detailed differences */
    differences: {
        documentationAssessment: {
            basic: string;                     // Basic assessment (e.g., "Has README")
            enhanced: string;                  // Enhanced assessment (e.g., "Comprehensive docs with examples")
            improvement: string;               // What the enhancement revealed
        };
        qualityAssessment: {
            basic: string;
            enhanced: string;
            improvement: string;
        };
        architectureAssessment: {
            basic: string;
            enhanced: string;
            improvement: string;
        };
    };
    
    /** Semantic insights not available in basic analysis */
    semanticInsights: {
        discoveredPatterns: string[];          // Architectural patterns found
        qualityIndicators: string[];           // Quality practices discovered
        technicalDebtAreas: string[];          // Specific debt areas identified
        improvementOpportunities: string[];   // Specific improvement suggestions
    };
}

/**
 * @type CCSAnalysisMode
 * @description Defines the mode of CCS analysis to perform.
 */
export type CCSAnalysisMode = 'basic' | 'enhanced' | 'comparison';

/**
 * @interface CCSAnalysisOptions
 * @description Configuration options for CCS analysis.
 */
export interface CCSAnalysisOptions {
    /** Analysis mode to use */
    mode: CCSAnalysisMode;
    
    /** Whether to include detailed breakdowns */
    includeBreakdown: boolean;
    
    /** Whether to generate comparison report (only for 'comparison' mode) */
    includeComparison: boolean;
    
    /** Whether to force re-indexing of workspace */
    forceReindex: boolean;
    
    /** Timeout for semantic analysis operations (ms) */
    semanticAnalysisTimeout: number;
    
    /** Whether to include sample search results in output */
    includeSampleResults: boolean;
    
    /** Custom search queries to include in analysis */
    customSearchQueries?: Array<{
        query: string;
        category: string;
        weight: number;
        description: string;
    }>;
}
