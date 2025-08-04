# Documentation Feature Rewrite Plan

**Objective:** A ground-up rewrite of the documentation generation feature to ensure it is robust, reliable, and provides clear, actionable feedback to the user. The previous implementation was unreliable and produced confusing errors. This plan outlines a meticulous, phased approach to build a new system from scratch.

---

### Phase 1: Deconstruction and Preparation (Clearing the Ground)

1. **Isolate and Archive Existing Code:**
    * Rename `src/webview/handlers/handleCcsDocumentation.ts` to `handleCcsDocumentation.ts.bak`.
    * **Purpose:** Take the faulty code completely out of the build process while preserving it for historical reference.

2. **Create a Clean Slate:**
    * Create a new, empty file at `src/webview/handlers/handleCcsDocumentation.ts`.
    * **Purpose:** Ensure a true fresh start without any legacy code.

3. **Review and Enhance Foundational Services:**
    * **`OpenAiService.ts`:** Add a new public method, `validateApiKey(): Promise<boolean>`. This method will perform a lightweight, inexpensive API call (e.g., listing models) to confirm the key is active and valid.
    * **`errorHandler.ts`:** Review and enhance the centralized error handler with distinct, user-friendly functions for each potential failure point: API keys, codebase analysis, AI content generation, and file writing.

---

### Phase 2: Building the New Core Logic (The Unified Generator)

A single, master function will be the sole engine for all documentation generation tasks.

* **Function:** `generateDocumentation(options: { command: string, ... })`
* **Core Principle:** The function will operate sequentially. If any step fails, the process stops immediately, and a specific error report is generated.

**Workflow Steps:**

1. **API Key Validation (Gatekeeper):**
    * Call `OpenAiService.validateApiKey()`.
    * On failure, stop and show an error notification with a button to fix the key.

2. **Show Initial Progress:**
    * Display a VS Code progress notification: `Generating [Documentation Type]...`

3. **Codebase Analysis:**
    * Update progress to `Analyzing codebase...` and call the `CodebaseAnalysisService`.
    * On failure, stop and show a specific error (`Failed to analyze codebase...`).

4. **AI Prompt Generation:**
    * Based on the `command`, select the appropriate system prompt and combine it with the analysis data.

5. **AI Content Generation:**
    * Update progress to `Generating content with AI...` and send the request to OpenAI.
    * On failure, stop and show a clear error (`AI generation failed. Error: [API Error Message]`).

6. **Save the Generated File:**
    * Update progress to `Saving file...` and write the AI-generated content to the correct file.
    * On failure, stop and show a specific error (`Failed to save file. Check folder permissions.`).

7. **Success Notification:**
    * Display a success message (`"[Doc Type]" generated successfully!`) with "Open File" and "Show in Explorer" buttons.

---

### Phase 3: Reconnecting the UI and Final Integration

1. **Create a Single Message Handler:**
    * Implement one handler function, `handleCcsDocumentation`, to be exported from the new file.
    * Its only job is to receive the message from the webview and call the `generateDocumentation` engine.

2. **Update the Main Extension:**
    * Reconnect the webview message listener in `extension.ts` to this new, single handler.

---

### Phase 4: Creating a Safety Net (Test-Driven Validation)

1. **New Integration Test:** Create `src/test/integration/documentationGeneration.test.ts`.
2. **Test Scenarios:**
    * **API Key Failure Path:** Use an invalid key and assert that the process stops with the correct error.
    * **Full Success Path:** Use a valid key, mock the AI response, and assert that the file is created with the expected content.
    * **"All Docs" Handler:** Test the "Generate All CCS Documentation" button to ensure it correctly triggers generation for each document type in sequence.
