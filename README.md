# AI-Powered PRD Generator

Welcome to the AI-Powered PRD Generator for Visual Studio Code! This extension leverages the power of OpenAI's GPT models to instantly create comprehensive Product Requirements Documents (PRDs) from a simple product idea. 

It's designed to streamline your product management workflow, saving you time and effort in the initial stages of product planning.

## Features

*   **AI-Powered PRD Generation:** Simply provide a product idea, and the extension will generate a detailed PRD.
*   **Multiple Output Formats:** The generated PRD includes:
    *   A full **Markdown** document.
    *   A structured **JSON** object for easy machine-reading.
    *   **Graph data** for visualizing relationships between product components.
*   **Interactive Viewers:**
    *   An interactive JSON viewer to explore the structured data.
    *   An interactive Graph viewer (powered by Cytoscape.js) to visualize user personas, features, and user stories.
*   **Secure API Key Storage:** Your OpenAI API key is stored securely using VS Code's SecretStorage API.

## How to Use

1.  **Install the Extension:** Find and install the "AI-Powered PRD Generator" from the Visual Studio Code Marketplace.

2.  **Set Your OpenAI API Key:**
    *   Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
    *   Search for and select the command **`Set OpenAI API Key`**.
    *   Enter your OpenAI API key when prompted. This is a one-time setup.

3.  **Generate a PRD:**
    *   Open a workspace or folder in VS Code. This is required for saving the output files.
    *   Open the Command Palette.
    *   Search for and select the command **`Generate PRD with AI`**.
    *   A new webview will open. Enter your product idea in the text area and click the "Generate PRD" button.
    *   The extension will call the OpenAI API, and once complete, it will save the generated `'.md'`, `'.json'`, and `'.graph.json'` files in your workspace.

4.  **View the Outputs:**
    *   After generation, you can use the `View as Interactive PRD` and `View as Interactive Graph` commands to explore the generated JSON and graph data.

## Available Commands

*   `Generate PRD with AI`: The main command to start the PRD generation process.
*   `Set OpenAI API Key`: Securely saves your OpenAI API key.
*   `View as Interactive PRD`: Opens the generated JSON file in an interactive viewer.
*   `View as Interactive Graph`: Opens the generated graph data in an interactive visualization.

## Requirements

*   An active OpenAI API key.
*   An open workspace folder in VS Code to save the generated files.

**Enjoy!**
