/**
 * @file main.js
 * @description This script handles all client-side interactions for the AI PRD Generator webview.
 * 
 * The logic of this file is to:
 * 1.  Establish communication with the VS Code extension backend using `acquireVsCodeApi`.
 * 2.  Notify the extension when the webview is ready to receive data.
 * 3.  Get references to all necessary DOM elements for manipulation.
 * 4.  Set up event listeners for all interactive elements (buttons, inputs).
 * 5.  Handle messages received from the extension to update the UI (e.g., API key status, errors).
 * 6.  Manage the visibility of the API key input and display containers based on application state.
 */
(function() {
    // Logic Step: Acquire the VS Code API object to enable communication with the extension backend.
    // This is the primary way the webview sends messages to the extension.
    const vscode = acquireVsCodeApi();

    // Logic Step: Inform the extension that the webview has loaded and is ready to receive data.
    // This is crucial for initializing the state, like checking for an existing API key.
    vscode.postMessage({ command: 'webviewReady' });

    // Logic Step: Get references to all interactive DOM elements upfront to avoid repeated queries.
    const generatePrdButton = document.getElementById('generate-prd');
    const bulkGenerateContextCardsButton = document.getElementById('bulk-generate-context-cards');
    const viewContextCardsButton = document.getElementById('view-context-cards');
    const viewPrdButton = document.getElementById('view-prd');
    const prdPrompt = document.getElementById('prd-prompt');
    const errorContainer = document.getElementById('error-container');
    const postGenerationControls = document.getElementById('post-generation-controls');

    // API Key UI Elements
    const apiKeyDisplay = document.getElementById('api-key-display');
    const apiKeyInputContainer = document.getElementById('api-key-input-container');
    const apiKeyObfuscated = document.getElementById('api-key-obfuscated');
    const apiKeyInput = document.getElementById('api-key-input');
    const setApiKeyButton = document.getElementById('set-api-key');
    const changeApiKeyButton = document.getElementById('change-api-key');

    // --- Event Listeners ---

    // Logic Step: Add event listener for the 'Generate PRD' button.
    if (generatePrdButton && prdPrompt) {
        generatePrdButton.addEventListener('click', () => {
            // On click, send the prompt text to the extension to start generation.
            vscode.postMessage({ command: 'generate', text: prdPrompt.value });
        });
    }

    // Logic Step: Add event listener for the 'Set API Key' button.
    if (setApiKeyButton && apiKeyInput) {
        setApiKeyButton.addEventListener('click', () => {
            // On click, send the new API key to the extension to be saved.
            vscode.postMessage({ command: 'saveApiKey', apiKey: apiKeyInput.value });
        });
    }

    // Logic Step: Add event listener for the 'Change' API key button.
    if (changeApiKeyButton) {
        changeApiKeyButton.addEventListener('click', () => {
            // On click, hide the key display and show the input form.
            if (apiKeyDisplay && apiKeyInputContainer) {
                apiKeyDisplay.classList.add('hidden');
                apiKeyInputContainer.classList.remove('hidden');
            }
        });
    }

    // Logic Step: Add event listeners for post-generation controls.
    if (bulkGenerateContextCardsButton) {
        bulkGenerateContextCardsButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'bulk-generate-context-cards' });
        });
    }

    if (viewContextCardsButton) {
        viewContextCardsButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'view-context-cards' });
        });
    }

    if (viewPrdButton) {
        viewPrdButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'view-prd' });
        });
    }

    // --- Message Handler ---

    // Logic Step: Set up a listener to handle all messages coming from the extension backend.
    window.addEventListener('message', event => {
        const message = event.data; // The data passed from the extension.
        switch (message.command) {
            // Logic Step: Handle the 'apiKeyStatus' message.
            case 'apiKeyStatus':
                if (apiKeyDisplay && apiKeyInputContainer && apiKeyObfuscated) {
                    const hasApiKey = message.apiKey && message.apiKey.trim() !== '';
                    if (hasApiKey) {
                        // If a key exists, show the obfuscated display by removing the .hidden class.
                        apiKeyObfuscated.textContent = `sk-******************${message.apiKey.slice(-4)}`;
                        apiKeyDisplay.classList.remove('hidden');
                        apiKeyInputContainer.classList.add('hidden');
                    } else {
                        // If no key exists, show the input form by removing the .hidden class.
                        apiKeyDisplay.classList.add('hidden');
                        apiKeyInputContainer.classList.remove('hidden');
                    }
                }
                break;
            // Logic Step: Handle the 'generationComplete' message.
            case 'generationComplete':
                if (postGenerationControls) {
                    // Show the post-generation buttons.
                    postGenerationControls.style.display = 'block';
                }
                break;
            // Logic Step: Handle any 'error' messages.
            case 'error':
                if (errorContainer) {
                    // Display the error message text.
                    errorContainer.textContent = message.text;
                    errorContainer.style.display = 'block';
                }
                break;
        }
    });

})();
