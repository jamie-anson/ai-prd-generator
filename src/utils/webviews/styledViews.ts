// @ts-nocheck
import MarkdownIt from 'markdown-it';
import { PrdJson } from '../types';

export function getStyledPrdWebviewContent(prdData: PrdJson): string {
    const { title, purpose, goals, "user-roles": userRoles, features, "technical-requirements": technicalRequirements, "non-functional-requirements": nonFunctionalRequirements, "user-journey-summary": userJourneySummary, "success-metrics": successMetrics, "future-enhancements": futureEnhancements } = prdData;

    const featuresHtml = features.map(feature => {
        const details = feature.details.map(detail => `<li>${detail}</li>`).join('');
        return `<div class="feature">
                    <h4>${feature.name}</h4>
                    <p>${feature.description}</p>
                    <ul>${details}</ul>
                </div>`;
    }).join('');

    const journeysHtml = userJourneySummary.map(journey => {
        const steps = journey.steps.map(step => `<li>${step}</li>`).join('');
        return `<div class="journey">
                    <h4>${journey.name}</h4>
                    <ol>${steps}</ol>
                </div>`;
    }).join('');

    const metricsHtml = successMetrics.map(metric => `<li><strong>${metric.metric}:</strong> ${metric.description}</li>`).join('');
    const enhancementsHtml = futureEnhancements.map(enhancement => `<li>${enhancement}</li>`).join('');

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Styled PRD</title>
            <style>
                body { font-family: var(--vscode-font-family); background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-size: 18px; padding: 20px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                h1, h2, h3, h4 { color: var(--vscode-editor-foreground); border-bottom: 1px solid var(--vscode-side-bar-border); padding-bottom: 5px; }
                .section { margin-bottom: 20px; }
                ul, ol { padding-left: 20px; }
                .feature, .journey { margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <div class="section">
                    <h2>Purpose</h2>
                    <p>${purpose}</p>
                </div>
                <div class="section">
                    <h2>Goals</h2>
                    <ul>${goals.map(g => `<li>${g}</li>`).join('')}</ul>
                </div>
                <div class="section">
                    <h2>User Roles</h2>
                    <ul>${userRoles.map(r => `<li>${r}</li>`).join('')}</ul>
                </div>
                <div class="section">
                    <h2>Features</h2>
                    ${featuresHtml}
                </div>
                <div class="section">
                    <h2>Technical Requirements</h2>
                    <h4>Frontend</h4><p><strong>Stack:</strong> ${technicalRequirements.frontend.stack}<br><strong>Notes:</strong> ${technicalRequirements.frontend.notes}</p>
                    <h4>Backend</h4><p><strong>Stack:</strong> ${technicalRequirements.backend.stack}<br><strong>Notes:</strong> ${technicalRequirements.backend.notes}</p>
                    <h4>Database</h4><p><strong>Stack:</strong> ${technicalRequirements.database.stack}<br><strong>Notes:</strong> ${technicalRequirements.database.notes}</p>
                </div>

                <div class="section">
                    <h2>Non-Functional Requirements</h2>
                    <p><strong>Security:</strong> ${nonFunctionalRequirements.security}</p>
                    <p><strong>Scalability:</strong> ${nonFunctionalRequirements.scalability}</p>
                    <p><strong>Performance:</strong> ${nonFunctionalRequirements.performance}</p>
                </div>
                
                <div class="section">
                    <h2>User Journey Summary</h2>
                    ${journeysHtml}
                </div>

                <div class="section">
                    <h2>Success Metrics</h2>
                    <ul>${metricsHtml}</ul>
                </div>

                <div class="section">
                    <h2>Future Enhancements</h2>
                    <ul>${enhancementsHtml}</ul>
                </div>

            </div>
        </body>
        </html>
    `;
}

export function getStyledMdViewerWebviewContent(markdownContent: string): string {
    const md = new MarkdownIt();
    const htmlContent = md.render(markdownContent);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Styled Markdown PRD</title>
        <style>
            body {
                font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 2rem;
                line-height: 1.7;
                font-size: 16px;
            }
            h1, h2, h3, h4, h5, h6 {
                color: var(--vscode-textLink-foreground);
                font-weight: 600;
                border-bottom: 1px solid var(--vscode-editorWidget-border);
                padding-bottom: 0.5rem;
                margin-top: 2rem;
                margin-bottom: 1rem;
            }
            p {
                margin-bottom: 1rem;
            }
            code {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 0.2em 0.4em;
                margin: 0;
                font-size: 85%;
                border-radius: 6px;
                font-family: var(--vscode-editor-font-family, 'Courier New', Courier, monospace);
            }
            pre {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 1rem;
                border-radius: 6px;
                overflow-x: auto;
            }
            pre code {
                padding: 0;
                margin: 0;
                font-size: 100%;
                background-color: transparent;
            }
            blockquote {
                border-left: 0.25em solid var(--vscode-editorWidget-border);
                padding: 0 1em;
                color: var(--vscode-textSeparator-foreground);
            }
            ul, ol {
                padding-left: 2em;
            }
            a {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>`;
}

export function getPrdMarkdownViewContent(markdown: string) {
    const md = new MarkdownIt();
    const result = md.render(markdown);
    return getStyledMdViewerWebviewContent(result);
}

export function getPrdJsonViewContent(json: any) {
    return getStyledPrdWebviewContent(json);
}

export function getContextCardViewContent(markdown: string, title: string): string {
    const md = new MarkdownIt();
    const result = md.render(markdown);
    return getStyledMdViewerWebviewContent(result);
}