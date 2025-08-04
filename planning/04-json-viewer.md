# Phase 4: JSON Output & Interactive Viewer (✅ Complete)

*Vibe: The structure is revealed!*

**Goal:** Open a new webview to display the generated JSON PRD in a readable, collapsible format.

**Steps:**

1. **Integrate `json-viewer-js` Library:**
    * Installed the `json-viewer-js` npm package.
    * Copied the necessary `jsonViewer.js` and `style.css` files into a local `src/media` directory to be bundled with the extension.

2. **Create `viewJsonPrd` Command:**
    * Registered a new command `ai-prd-generator.viewJsonPrd`.
    * Added a context menu item "View as Interactive PRD" that appears when right-clicking any `.json` file.

3. **Implement Webview Panel:**
    * The command reads the content of the selected JSON file.
    * It opens a new webview panel, loads the `json-viewer-js` assets, and passes the JSON data to the script to render the interactive tree.
