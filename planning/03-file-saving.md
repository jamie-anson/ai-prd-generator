# Phase 3: Plain Text & File Saving

*Vibe: Make it real!*

**Goal:** Take the AI's output and save it as files in the workspace.

**Steps:**

1. **Adjust LLM Call for Structured Output:**
    * Modify `callGeminiAPI` to request a single JSON object from the LLM containing three properties: `markdown`, `jsonPrd`, and `graphData`.
    * Update the `generationConfig` with `responseMimeType: "application/json"` and a `responseSchema` defining the structure.
    * Update the function's return type to `Promise<{ markdown: string; json: any; graph: any }>`.

2. **Save Generated Files:**
    * In the `onDidReceiveMessage` handler, after getting the structured data from the API:
    * Get the workspace path: `vscode.workspace.workspaceFolders[0].uri.fsPath`.
    * Save `generatedData.markdown` to `PRD-timestamp.md`.
    * Save `generatedData.json` to `PRD-timestamp.json`.
    * Save `generatedData.graph` to `PRD-timestamp.graph.json`.
    * Use `vscode.workspace.fs.writeFile` for all file operations.

3. **Provide Feedback:**
    * Show a success notification.
    * Optionally, open the generated `.md` file automatically.
