// @ts-nocheck
/**
 * @file markdownFormatterService.ts
 * @description Service for formatting CCS analysis results from markdown to HTML for webview display.
 * 
 * The logic of this file is to:
 * 1. Convert markdown CCS reports to properly formatted HTML
 * 2. Apply consistent styling and structure to analysis results
 * 3. Handle special formatting for scores, recommendations, and code blocks
 * 4. Ensure safe HTML output for webview consumption
 */

/**
 * Logic Step: Service class for formatting CCS analysis results.
 * Provides robust markdown-to-HTML conversion with CCS-specific enhancements.
 */
export class MarkdownFormatterService {
    
    /**
     * Logic Step: Formats CCS analysis results from markdown to HTML.
     * 
     * This is the main entry point for formatting CCS reports. It performs:
     * 1. Basic markdown-to-HTML conversion
     * 2. CCS-specific formatting enhancements
     * 3. HTML sanitization for security
     * 4. Styling application for better readability
     * 
     * @param markdownContent - The raw markdown CCS analysis from AI
     * @returns string - Formatted HTML ready for webview display
     * 
     * @example
     * ```typescript
     * const htmlContent = MarkdownFormatterService.formatCCSResults(ccsMarkdown);
     * webview.postMessage({ command: 'ccsGenerated', analysis: htmlContent });
     * ```
     */
    static formatCCSResults(markdownContent: string): string {
        if (!markdownContent || markdownContent.trim().length === 0) {
            return '<div class="ccs-error">No CCS analysis content available.</div>';
        }

        try {
            // Logic Step: Apply CCS-specific formatting first
            let formatted = this.applyCCSSpecificFormatting(markdownContent);
            
            // Logic Step: Convert markdown to HTML
            formatted = this.convertMarkdownToHTML(formatted);
            
            // Logic Step: Enhance with CCS-specific styling
            formatted = this.enhanceWithCCSStyles(formatted);
            
            // Logic Step: Sanitize HTML for security
            formatted = this.sanitizeHTML(formatted);
            
            return formatted;
        } catch (error) {
            console.error('Failed to format CCS results:', error);
            return `<div class="ccs-error">Failed to format CCS analysis: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
        }
    }

    /**
     * Logic Step: Applies CCS-specific formatting before markdown conversion.
     * 
     * Handles special CCS patterns like score formatting, percentage calculations,
     * and recommendation numbering to ensure consistent presentation.
     * 
     * @param content - Raw markdown content from AI
     * @returns string - Content with CCS-specific formatting applied
     */
    private static applyCCSSpecificFormatting(content: string): string {
        let formatted = content;

        // Logic Step: Format category scores with visual indicators
        formatted = formatted.replace(
            /(\d+)\s*\/\s*10/g, 
            (match, score) => {
                const numScore = parseInt(score);
                const percentage = (numScore / 10) * 100;
                const indicator = this.getScoreIndicator(numScore);
                return `<span class="ccs-score" data-score="${numScore}">${score}/10 ${indicator}</span>`;
            }
        );

        // Logic Step: Format overall CCS percentage with visual styling
        formatted = formatted.replace(
            /(\d+)%/g,
            (match, percentage) => {
                const numPercentage = parseInt(percentage);
                const level = this.getCCSLevel(numPercentage);
                return `<span class="ccs-percentage ccs-level-${level}" data-percentage="${numPercentage}">${percentage}%</span>`;
            }
        );

        // Logic Step: Enhance recommendation numbering
        formatted = formatted.replace(
            /^(\d+)\.\s*(.+)$/gm,
            '<div class="ccs-recommendation"><span class="recommendation-number">$1.</span> $2</div>'
        );

        return formatted;
    }

    /**
     * Logic Step: Converts markdown to HTML with enhanced formatting.
     * 
     * Performs comprehensive markdown-to-HTML conversion including:
     * - Headers with proper hierarchy
     * - Bold and italic text
     * - Code blocks with syntax highlighting
     * - Lists and paragraphs
     * - Links and emphasis
     * 
     * @param markdown - Markdown content to convert
     * @returns string - HTML content
     */
    private static convertMarkdownToHTML(markdown: string): string {
        let html = markdown;

        // Logic Step: Convert headers (### -> h3, ## -> h2, # -> h1)
        html = html.replace(/^### (.+)$/gm, '<h3 class="ccs-h3">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="ccs-h2">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="ccs-h1">$1</h1>');

        // Logic Step: Convert bold text
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="ccs-bold">$1</strong>');

        // Logic Step: Convert italic text
        html = html.replace(/\*(.+?)\*/g, '<em class="ccs-italic">$1</em>');

        // Logic Step: Convert code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            return `<div class="ccs-code-block">
                <div class="code-header">${language}</div>
                <pre><code class="language-${language}">${this.escapeHTML(code.trim())}</code></pre>
            </div>`;
        });

        // Logic Step: Convert inline code
        html = html.replace(/`([^`]+)`/g, '<code class="ccs-inline-code">$1</code>');

        // Logic Step: Convert unordered lists
        html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li class="ccs-list-item">$1</li>');
        html = html.replace(/(<li class="ccs-list-item">.*<\/li>)/s, '<ul class="ccs-list">$1</ul>');

        // Logic Step: Convert paragraphs (lines not already converted)
        const lines = html.split('\n');
        const processedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '';
            if (trimmed.startsWith('<')) return line; // Already HTML
            if (trimmed.match(/^\d+\./)) return line; // Numbered list
            return `<p class="ccs-paragraph">${line}</p>`;
        });

        return processedLines.join('\n');
    }

    /**
     * Logic Step: Enhances HTML with CCS-specific styling and structure.
     * 
     * Adds CSS classes and wrapper elements to improve the visual
     * presentation of CCS analysis results in the webview.
     * 
     * @param html - Basic HTML content
     * @returns string - Enhanced HTML with styling
     */
    private static enhanceWithCCSStyles(html: string): string {
        // Logic Step: Wrap the entire content in a CCS container
        let enhanced = `<div class="ccs-analysis-container">${html}</div>`;

        // Logic Step: Add section wrappers for better styling
        enhanced = enhanced.replace(
            /<h2 class="ccs-h2">Category Scores<\/h2>([\s\S]*?)<h2/,
            '<h2 class="ccs-h2">Category Scores</h2><div class="ccs-scores-section">$1</div><h2'
        );

        enhanced = enhanced.replace(
            /<h2 class="ccs-h2">Rationale<\/h2>([\s\S]*?)<h2/,
            '<h2 class="ccs-h2">Rationale</h2><div class="ccs-rationale-section">$1</div><h2'
        );

        enhanced = enhanced.replace(
            /<h2 class="ccs-h2">Improvement Recommendations<\/h2>([\s\S]*?)(<\/div>)$/,
            '<h2 class="ccs-h2">Improvement Recommendations</h2><div class="ccs-recommendations-section">$1</div>$2'
        );

        return enhanced;
    }

    /**
     * Logic Step: Sanitizes HTML content for safe webview display.
     * 
     * Removes potentially dangerous HTML elements and attributes
     * while preserving the formatting needed for CCS display.
     * 
     * @param html - HTML content to sanitize
     * @returns string - Sanitized HTML
     */
    private static sanitizeHTML(html: string): string {
        // Logic Step: Remove script tags and event handlers
        let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Logic Step: Remove potentially dangerous tags
        const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button'];
        dangerousTags.forEach(tag => {
            const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
            sanitized = sanitized.replace(regex, '');
        });

        return sanitized;
    }

    /**
     * Logic Step: Escapes HTML special characters to prevent injection.
     * 
     * @param text - Text to escape
     * @returns string - HTML-escaped text
     */
    private static escapeHTML(text: string): string {
        const htmlEscapes: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        
        return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
    }

    /**
     * Logic Step: Gets visual indicator for individual category scores.
     * 
     * @param score - Numeric score (1-10)
     * @returns string - Visual indicator (emoji or symbol)
     */
    private static getScoreIndicator(score: number): string {
        if (score >= 8) { return '🟢'; } // Green circle for excellent
        if (score >= 6) { return '🟡'; } // Yellow circle for good
        if (score >= 4) { return '🟠'; } // Orange circle for fair
        return '🔴'; // Red circle for poor
    }

    /**
     * Logic Step: Determines CCS level for overall percentage styling.
     * 
     * @param percentage - Overall CCS percentage
     * @returns string - CSS class suffix for styling
     */
    private static getCCSLevel(percentage: number): string {
        if (percentage >= 80) { return 'excellent'; }
        if (percentage >= 60) { return 'good'; }
        if (percentage >= 40) { return 'fair'; }
        return 'poor';
    }

    /**
     * Logic Step: Generates CSS styles for CCS formatting.
     * 
     * Returns CSS that can be injected into the webview for proper
     * CCS analysis styling. This ensures consistent visual presentation.
     * 
     * @returns string - CSS styles for CCS formatting
     */
    static getCCSStyles(): string {
        return `
        .ccs-analysis-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--vscode-foreground);
            max-width: 100%;
            padding: 16px;
        }
        
        .ccs-h1, .ccs-h2, .ccs-h3 {
            color: var(--vscode-textLink-foreground);
            margin-top: 24px;
            margin-bottom: 12px;
        }
        
        .ccs-scores-section {
            background: var(--vscode-textBlockQuote-background);
            padding: 16px;
            border-radius: 6px;
            margin: 12px 0;
        }
        
        .ccs-score {
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }
        
        .ccs-percentage {
            font-size: 1.2em;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 6px;
        }
        
        .ccs-level-excellent { background: #28a745; color: white; }
        .ccs-level-good { background: #ffc107; color: black; }
        .ccs-level-fair { background: #fd7e14; color: white; }
        .ccs-level-poor { background: #dc3545; color: white; }
        
        .ccs-recommendation {
            margin: 8px 0;
            padding: 12px;
            background: var(--vscode-textCodeBlock-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            border-radius: 0 4px 4px 0;
        }
        
        .recommendation-number {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .ccs-code-block {
            margin: 12px 0;
            border-radius: 6px;
            overflow: hidden;
            background: var(--vscode-textCodeBlock-background);
        }
        
        .code-header {
            background: var(--vscode-tab-activeBackground);
            padding: 8px 12px;
            font-size: 0.9em;
            font-weight: bold;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        
        .ccs-inline-code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        .ccs-list {
            margin: 12px 0;
            padding-left: 20px;
        }
        
        .ccs-list-item {
            margin: 4px 0;
        }
        
        .ccs-paragraph {
            margin: 8px 0;
        }
        
        .ccs-error {
            color: var(--vscode-errorForeground);
            background: var(--vscode-inputValidation-errorBackground);
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--vscode-inputValidation-errorBorder);
        }`;
    }
}
