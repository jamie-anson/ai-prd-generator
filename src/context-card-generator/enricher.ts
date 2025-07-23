import OpenAI from 'openai';
import { AnalysisResult, FunctionInfo, ClassInfo } from './analyzer';

export class CodeEnricher {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  public async enrich(analysisResult: AnalysisResult): Promise<AnalysisResult> {
    for (const func of analysisResult.functions) {
      func.summary = await this.generateSummary('function', func.signature);
    }

    for (const classInfo of analysisResult.classes) {
      classInfo.summary = await this.generateSummary('class', classInfo.signature);
      for (const method of classInfo.methods) {
        method.summary = await this.generateSummary('method', method.signature);
      }
    }

    return analysisResult;
  }

  private async generateSummary(type: 'function' | 'class' | 'method', signature: string): Promise<string> {
    const prompt = `Provide a concise, one-sentence summary for the following ${type}:\n\n${signature}\n\nSummary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.3,
      });
      return response.choices[0].message.content?.trim() || 'No summary generated.';
    } catch (error) {
      console.error(`Error generating summary for ${signature}:`, error);
      return 'Error generating summary.';
    }
  }
}