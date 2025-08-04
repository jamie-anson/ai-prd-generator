# AI-Powered PRD Generator

Welcome to the AI-Powered PRD Generator for Visual Studio Code! This extension leverages the power of OpenAI's GPT models to instantly create comprehensive Product Requirements Documents (PRDs) from a simple product idea.

It's designed to streamline your product management workflow, saving you time and effort in the initial stages of product planning.

## Features

* **AI-Powered PRD Generation:** Simply provide a product idea, and the extension will generate a detailed PRD.
* **Multiple Output Formats:** The generated PRD includes a full **Markdown** document, a structured **JSON** object, and **Graph data** for visualization.
* **Rich, Interactive Viewers:** Custom, beautifully styled viewers for all three PRD formats, including an interactive graph powered by Cytoscape.js.
* **Secure API Key Storage:** Your OpenAI API key is stored securely using VS Code's SecretStorage API.

## How to Use

1. **Set Your OpenAI API Key:**
    * Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
    * Run the **`AI PRD Generator: Set OpenAI API Key`** command.

2. **Generate a PRD:**
    * Run the **`AI PRD Generator: Generate PRD`** command.
    * Enter your product idea in the webview that appears.

3. **View the Outputs:**
    * Right-click on any of the generated `prd-*.md`, `prd-*.json`, or `prd-*.graph.json` files in the explorer.
    * Select the **`View PRD`** command.

## For Developers

### Running Locally

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Press `F5` to open a new **Extension Development Host** window with the extension running.

### Packaging and Installation

To package the extension into a `.vsix` file for local installation:

1. **Install vsce (once):**

    ```bash
    npm install -g vsce
    ```

2. **Package the extension:**

    ```bash
    vsce package
    ```

3. **Install in VS Code:**
    * Open the **Extensions** view (`Cmd+Shift+X`).
    * Click the **(...)** menu at the top-right.
    * Select **"Install from VSIX..."** and choose the generated `.vsix` file.

## Requirements

* An active OpenAI API key.
* An open workspace folder in VS Code to save the generated files.

**Enjoy!**
