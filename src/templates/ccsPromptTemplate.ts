// @ts-nocheck
/**
 * @file ccsPromptTemplate.ts
 * @description Template service for generating AI prompts for Code Comprehension Score analysis.
 * 
 * The logic of this file is to:
 * 1. Generate structured prompts for CCS analysis using codebase data
 * 2. Format codebase metrics and samples for AI consumption
 * 3. Provide consistent prompt structure and scoring criteria
 * 4. Abstract prompt generation logic from the main CCS handler
 */

import { CodebaseAnalysis, SampleFile } from '../services/codebaseAnalysisService';

/**
 * Logic Step: Service class for generating CCS analysis prompts.
 * Encapsulates all logic for creating structured AI prompts from codebase analysis.
 */
export class CCSPromptTemplate {
    
    /**
     * Logic Step: Generates a comprehensive CCS analysis prompt from codebase data.
     * 
     * Creates a structured prompt that includes:
     * 1. Clear instructions for the AI about CCS evaluation
     * 2. Formatted codebase metrics and statistics
     * 3. Sample file content for code quality assessment
     * 4. Specific scoring criteria and output format requirements
     * 
     * The prompt is designed to produce consistent, actionable CCS reports
     * with numerical scores and concrete improvement recommendations.
     * 
     * @param analysis - The codebase analysis data to include in the prompt
     * @returns string - Complete formatted prompt for AI analysis
     * 
     * @example
     * ```typescript
     * const prompt = CCSPromptTemplate.generatePrompt(analysis);
     * const ccsReport = await openAiService.generateText(prompt);
     * ```
     */
    static generatePrompt(analysis: CodebaseAnalysis): string {
        return `${this.buildPromptHeader()}

${this.formatCodebaseMetrics(analysis)}

${this.formatQualityIndicators(analysis)}

${this.formatSampleFiles(analysis.sampleFiles)}

${this.buildScoringInstructions()}

${this.buildOutputFormat()}`;
    }

    /**
     * Logic Step: Builds the header section of the CCS prompt.
     * 
     * Provides context and instructions for the AI about what CCS analysis
     * entails and what kind of evaluation is expected.
     * 
     * @returns string - Formatted prompt header
     */
    private static buildPromptHeader(): string {
        return `You are an expert code reviewer tasked with evaluating a codebase's "Code Comprehension Score" (CCS).

The CCS measures how easily a new developer can understand, navigate, and contribute to a codebase. Consider factors like:
- Code organization and structure
- Naming conventions and clarity
- Documentation quality and coverage
- Test presence and quality
- Overall complexity and maintainability

Analyze the following codebase data and provide a comprehensive CCS evaluation.`;
    }

    /**
     * Logic Step: Formats codebase metrics into a readable section.
     * 
     * Converts the numerical analysis data into a structured format
     * that the AI can easily interpret and use for scoring.
     * 
     * @param analysis - The codebase analysis containing metrics
     * @returns string - Formatted metrics section
     */
    private static formatCodebaseMetrics(analysis: CodebaseAnalysis): string {
        const { totalFiles, totalLines, fileTypes, directories } = analysis;
        
        // Logic Step: Sort file types by frequency for better presentation
        const sortedFileTypes = Object.entries(fileTypes)
            .sort(([,a], [,b]) => b - a)
            .map(([ext, count]) => `  ${ext}: ${count} files`)
            .join('\n');

        // Logic Step: Calculate average file size
        const avgLinesPerFile = totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0;

        return `
## Codebase Metrics

**Size & Complexity:**
- Total Files: ${totalFiles}
- Total Lines of Code: ${totalLines}
- Average Lines per File: ${avgLinesPerFile}
- Directory Structure Depth: ${directories.length} directories

**File Type Distribution:**
${sortedFileTypes}

**Project Structure:**
${this.formatDirectoryStructure(directories)}`;
    }

    /**
     * Logic Step: Formats the directory structure for display.
     * 
     * Creates a readable representation of the project's directory
     * organization to help assess structural clarity.
     * 
     * @param directories - Array of directory paths
     * @returns string - Formatted directory structure
     */
    private static formatDirectoryStructure(directories: string[]): string {
        if (directories.length === 0) {
            return '  (Flat structure - all files in root)';
        }

        // Logic Step: Show first 10 directories to avoid overwhelming the prompt
        const displayDirs = directories.slice(0, 10);
        const formatted = displayDirs.map(dir => `  ${dir}/`).join('\n');
        
        if (directories.length > 10) {
            return `${formatted}\n  ... and ${directories.length - 10} more directories`;
        }
        
        return formatted;
    }

    /**
     * Logic Step: Formats quality indicators into a readable section.
     * 
     * Presents the boolean quality indicators (README, tests, etc.)
     * in a clear format for AI evaluation.
     * 
     * @param analysis - The codebase analysis containing quality flags
     * @returns string - Formatted quality indicators section
     */
    private static formatQualityIndicators(analysis: CodebaseAnalysis): string {
        const { hasReadme, hasTests, hasTypeDefinitions, hasDocumentation } = analysis;
        
        return `
## Quality Indicators

**Documentation:**
- README file: ${hasReadme ? '✅ Present' : '❌ Missing'}
- Documentation directory: ${hasDocumentation ? '✅ Present' : '❌ Missing'}

**Code Quality:**
- Test files/directories: ${hasTests ? '✅ Present' : '❌ Missing'}
- Type definitions: ${hasTypeDefinitions ? '✅ Present' : '❌ Missing'}`;
    }

    /**
     * Logic Step: Formats sample files for code quality assessment.
     * 
     * Presents the sample file content in a structured way that allows
     * the AI to assess naming conventions, code style, and clarity.
     * 
     * @param sampleFiles - Array of sample files with content
     * @returns string - Formatted sample files section
     */
    private static formatSampleFiles(sampleFiles: SampleFile[]): string {
        if (sampleFiles.length === 0) {
            return `
## Sample Files

No sample files available for analysis.`;
        }

        const formattedSamples = sampleFiles.map((file, index) => {
            return `
### Sample ${index + 1}: ${file.name}
- **Path:** ${file.path}
- **Extension:** ${file.extension}
- **Lines:** ${file.lines}
- **Size:** ${this.formatFileSize(file.size)}

**Content Preview:**
\`\`\`${this.getLanguageFromExtension(file.extension)}
${file.sampleContent}
\`\`\``;
        }).join('\n');

        return `
## Sample Files

The following files represent the codebase structure and coding patterns:
${formattedSamples}`;
    }

    /**
     * Logic Step: Converts file size in bytes to human-readable format.
     * 
     * @param bytes - File size in bytes
     * @returns string - Human-readable file size
     */
    private static formatFileSize(bytes: number): string {
        if (bytes < 1024) { return `${bytes} B`; }
        if (bytes < 1024 * 1024) { return `${Math.round(bytes / 1024)} KB`; }
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }

    /**
     * Logic Step: Maps file extensions to syntax highlighting languages.
     * 
     * @param extension - File extension (e.g., '.ts', '.js')
     * @returns string - Language identifier for syntax highlighting
     */
    private static getLanguageFromExtension(extension: string): string {
        const languageMap: { [key: string]: string } = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.md': 'markdown',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml'
        };
        
        return languageMap[extension] || 'text';
    }

    /**
     * Logic Step: Builds the scoring instructions section.
     * 
     * Provides detailed criteria for each CCS category to ensure
     * consistent and meaningful scoring across different codebases.
     * 
     * @returns string - Formatted scoring instructions
     */
    private static buildScoringInstructions(): string {
        return `
## Scoring Criteria

Evaluate each category on a scale of 1-10:

**1. Codebase Size & Complexity (1-10)**
- 1-3: Overly complex, too large to understand easily
- 4-6: Moderate complexity, manageable size
- 7-10: Well-organized, appropriate size and complexity

**2. Documentation Quality (1-10)**
- 1-3: No documentation, unclear purpose
- 4-6: Basic documentation, some explanations
- 7-10: Comprehensive docs, clear explanations, examples

**3. Naming Clarity (1-10)**
- 1-3: Unclear, abbreviated, or misleading names
- 4-6: Generally clear with some unclear elements
- 7-10: Consistently clear, descriptive, and meaningful names

**4. Test Coverage & Structure (1-10)**
- 1-3: No tests or very poor test structure
- 4-6: Some tests, basic coverage
- 7-10: Comprehensive tests, well-organized test structure

**5. Summarizability (1-10)**
- 1-3: Difficult to understand purpose and architecture
- 4-6: Purpose is clear but architecture needs explanation
- 7-10: Easy to understand both purpose and how it works

Consider the sample code quality, file organization, and overall project structure in your evaluation.`;
    }

    /**
     * Logic Step: Builds the output format requirements.
     * 
     * Specifies exactly how the AI should structure its response
     * to ensure consistent, parseable CCS reports.
     * 
     * @returns string - Formatted output requirements
     */
    private static buildOutputFormat(): string {
        return `
## Required Output Format

Format your response exactly as follows:

## Code Comprehension Score Analysis

### Category Scores
1. **Codebase Size & Complexity**: X/10
2. **Documentation Quality**: X/10
3. **Naming Clarity**: X/10
4. **Test Coverage & Structure**: X/10
5. **Summarizability**: X/10

### Overall CCS: X%

### Rationale
[Provide a detailed 2-3 paragraph explanation of your scoring, highlighting specific observations from the codebase analysis. Reference specific files, patterns, or structures you observed.]

### Improvement Recommendations
1. [First specific, actionable recommendation with expected impact]
2. [Second specific, actionable recommendation with expected impact]
3. [Third specific, actionable recommendation with expected impact]

Focus on actionable improvements that would have the highest impact on code comprehension for new developers.`;
    }
}
