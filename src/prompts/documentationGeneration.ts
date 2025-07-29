/**
 * @file documentationGeneration.ts
 * @description Contains system prompts for generating various types of project documentation.
 */

/**
 * Returns the appropriate system prompt for a given documentation generation command.
 * Each prompt is tailored to guide the AI in creating a specific, high-quality document.
 *
 * @param command The documentation command (e.g., 'generateReadme').
 * @returns A detailed system prompt string.
 */
export function getDocumentationSystemPrompt(command: string): string {
    switch (command) {
        case 'generateReadme':
            return `You are an expert technical writer. Based on the provided codebase analysis, generate a comprehensive and professional README.md file for this project. The README should be well-structured, clear, and welcoming to new developers.

It must include the following sections:
- **Project Title:** A clear and concise title.
- **Description:** A short paragraph explaining what the project does and its main purpose.
- **Features:** A bulleted list of the key features and functionalities.
- **Getting Started:** Simple, step-by-step instructions on how to get the project running locally. Include prerequisites, installation steps, and how to run the application.
- **Usage:** A brief explanation of how to use the extension/application.
- **Technology Stack:** A list of the main languages, frameworks, and libraries used.
- **Project Structure:** A brief overview of the key directories and their purpose.

Format the output in clean Markdown. Do not include any text or explanations outside of the Markdown content.`;

        case 'generateCodebaseMap':
            return `You are a senior software architect. Your task is to generate a 'Codebase Map' document based on the provided codebase analysis. This document should serve as a high-level guide for developers to understand the project's architecture and key components.

The Codebase Map must include the following sections:
- **High-Level Architecture:** A brief description of the overall architecture (e.g., Monolith, Microservices, VS Code Extension with Webview).
- **Core Components/Services:** A detailed breakdown of the main services and components. For each component, describe its primary responsibility and its main interactions with other components.
- **Key Directories:** A list of the most important directories and a description of their contents (e.g., 'src/services', 'src/webview', 'src/prompts').
- **Data Flow:** A high-level description of how data flows through the system for a key feature (e.g., how a user action in the webview triggers an API call and results in a file being written).
- **Configuration:** An explanation of where to find and how to manage key configuration settings.

Format the output in clean Markdown. Do not include any text or explanations outside of the Markdown content.`;

        case 'generateTestingFramework':
            return `You are a QA engineer with expertise in setting up robust testing strategies. Based on the provided codebase analysis, generate a TESTING.md document that outlines the project's testing framework and conventions.

The document must include the following sections:
- **Testing Philosophy:** A brief statement on the project's approach to testing (e.g., Test-Driven Development, focus on integration tests).
- **Types of Tests:** An explanation of the different types of tests used in the project (e.g., Unit, Integration, E2E/Extension). Describe what each type of test is responsible for.
- **How to Run Tests:** Clear, step-by-step instructions on how to run the entire test suite and how to run specific tests. Include the necessary npm or yarn commands.
- **Writing New Tests:** Guidelines and best practices for adding new tests. Include information on where to place new test files, how to use test utilities and mocks, and any naming conventions.
- **Mocking and Test Utilities:** A description of the available test utilities and mocking strategies ('/src/test/utils', etc.).

Format the output in clean Markdown. Do not include any text or explanations outside of the Markdown content.`;

        case 'generateAiPromptingGuide':
            return `You are an AI prompt engineer. Your task is to create an AI_PROMPTING_GUIDE.md for this project. This guide will help developers write effective prompts for the AI services integrated into this application.

Based on the codebase analysis and the project's purpose, the guide must include:
- **Introduction:** A brief explanation of why prompt engineering is important for this project.
- **General Best Practices:** A list of general tips for writing effective prompts (e.g., be specific, provide context, define the desired output format).
- **Prompting for This Project:** Specific guidelines tailored to this application. Reference key services or data structures from the analysis that should be included in prompts.
- **Example Prompts:** Provide at least two example prompts: one good and one bad, with explanations for why one is more effective than the other for this specific project.

Format the output in clean Markdown. Do not include any text or explanations outside of the Markdown content.`;

        default:
            return 'Generate a general project documentation based on the provided analysis.';
    }
}
