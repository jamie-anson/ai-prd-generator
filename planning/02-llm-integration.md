# Phase 2: User Input & LLM Integration

*Vibe: Make it smart!*

**Goal:** Get user input, send it to the Gemini API, and display the raw response.

**Steps:**

1. **Create Input Webview:**
    * In the `generatePrd` command, create a `vscode.WebviewPanel`.
    * Implement `getWebviewContent()` to return HTML with a `textarea`, a `button`, a loading spinner, and a `pre` tag for output.
    * Add JavaScript to the webview to handle button clicks (`postMessage` to extension) and receive results (`window.addEventListener`).

2. **Implement `callGeminiAPI` Function:**
    * Create an `async` function `callGeminiAPI(prompt: string)` in `src/extension.ts`.
    * Use `fetch` to call the Gemini API (`gemini-2.0-flash`).
    * Handle API key (initially empty string for Canvas runtime).
    * Parse the response and handle potential errors.

3. **Connect Webview and API:**
    * In the `panel.webview.onDidReceiveMessage` handler, call `callGeminiAPI`.
    * Post the raw result back to the webview to be displayed.
