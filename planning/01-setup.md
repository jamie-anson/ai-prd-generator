# Phase 1: Setup & Basic Command

*Vibe: Get it running!*

**Goal:** Create a barebones VS Code extension that runs a simple command.

**Steps:**

1.  **Generate Extension Project:**
    *   Run `npm install -g yo generator-code`
    *   Run `yo code` and select `New Extension (TypeScript)`.
    *   Use the following details:
        *   Name: `ai-prd-generator`
        *   Identifier: `ai-prd-generator`
        *   Description: "AI-Powered PRD Generator"
        *   Initialize Git repo: Yes
        *   Package manager: npm

2.  **Run the Default Extension:**
    *   Press `F5` to open the Extension Development Host.
    *   Use the Command Palette to run the `Hello World` command.

3.  **Rename the Command:**
    *   In `src/extension.ts`, rename `ai-prd-generator.helloWorld` to `ai-prd-generator.generatePrd`.
    *   Update the info message.
    *   In `package.json`, update the command contribution point with the new command and title: `Generate PRD with AI`.
