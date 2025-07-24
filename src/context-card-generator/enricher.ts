import { OpenAiService } from '../utils/openai';
import { AnalysisResult, FunctionInfo, ClassInfo } from './analyzer';

/**
 * Enriches the results of a code analysis by generating AI-powered summaries.
 * This class takes the structured data from the CodeAnalyzer and uses the OpenAiService
 * to generate concise, context-aware summaries for each function, class, and method.
 */
export class CodeEnricher {
  private openAiService: OpenAiService;

    /**
   * Initializes a new instance of the CodeEnricher.
   * @param openAiService An instance of the OpenAiService to be used for generating summaries.
   */
  constructor(openAiService: OpenAiService) {
    this.openAiService = openAiService;
  }

    /**
   * Iterates through the analysis results and adds an AI-generated summary to each item.
   * @param analysisResult The result of the static code analysis.
   * @param featureContext A string containing the broader context of the feature, used to inform the summary generation.
   * @returns The same analysisResult object, now enriched with summaries.
   */
  public async enrich(analysisResult: AnalysisResult, featureContext: string): Promise<AnalysisResult> {
    for (const func of analysisResult.functions) {
      func.summary = await this.generateSummary('function', func.signature, featureContext);
    }

    for (const classInfo of analysisResult.classes) {
      classInfo.summary = await this.generateSummary('class', classInfo.signature, featureContext);
      for (const method of classInfo.methods) {
        method.summary = await this.generateSummary('method', method.signature, featureContext);
      }
    }

    return analysisResult;
  }

    /**
   * Generates a one-sentence summary for a given code element using the OpenAI API.
   * @param type The type of the code element (e.g., 'function', 'class').
   * @param signature The signature of the code element.
   * @param featureContext The broader feature context to provide to the AI.
   * @returns A promise that resolves with the generated summary string.
   */
  private async generateSummary(type: 'function' | 'class' | 'method', signature: string, featureContext: string): Promise<string> {
    const prompt = `Given the following overall context, provide a concise, one-sentence summary for the ${type} below. Focus on its role within the broader feature.

**Overall Context:**
${featureContext}

**${type.charAt(0).toUpperCase() + type.slice(1)} Signature:**
${signature}

**One-Sentence Summary:**`;

    try {
      const summary = await this.openAiService.generateText(prompt);
      return summary.trim() || 'No summary generated.';
    } catch (error) {
      console.error(`Error generating summary for ${signature}:`, error);
      return 'Error generating summary.';
    }
  }
}