import { MarkdownFormatter } from './formatter';
import { AnalysisResult } from './analyzer';

/**
 * Formats the analysis result of a file into a markdown string.
 * @param card The analysis result (Context Card data).
 * @param filePath The path to the source file being analyzed.
 * @returns A string containing the formatted markdown.
 */
export function formatAsMarkdown(card: AnalysisResult, filePath: string): string {
    const formatter = new MarkdownFormatter();
    return formatter.format(card, filePath);
}
