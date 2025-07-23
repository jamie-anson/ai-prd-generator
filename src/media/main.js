(function() {
    // Ensure acquireVsCodeApi is called only once and store it.
    const vscode = acquireVsCodeApi();

    // Signal that the webview is ready.
    vscode.postMessage({ command: 'webviewReady' });

    // Get all DOM elements once to avoid repeated queries.
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

    // Add event listeners, ensuring elements exist before attaching.
    if (generatePrdButton && prdPrompt) {
        generatePrdButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'generate', text: prdPrompt.value });
        });
    }

    if (setApiKeyButton && apiKeyInput) {
        setApiKeyButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'saveApiKey', apiKey: apiKeyInput.value });
        });
    }

    if (changeApiKeyButton && apiKeyDisplay && apiKeyInputContainer) {
        changeApiKeyButton.addEventListener('click', () => {
            apiKeyDisplay.classList.add('hidden');
            apiKeyInputContainer.classList.remove('hidden');
        });
    }

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

    // Handle messages from the extension.
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'apiKeyStatus':
                if (apiKeyDisplay && apiKeyInputContainer && apiKeyObfuscated) {
                    if (message.apiKey) {
                        apiKeyObfuscated.textContent = `sk-******************${message.apiKey.slice(-4)}`;
                        apiKeyDisplay.classList.remove('hidden');
                        apiKeyInputContainer.classList.add('hidden');
                    } else {
                        apiKeyDisplay.classList.add('hidden');
                        apiKeyInputContainer.classList.remove('hidden');
                    }
                }
                break;
            case 'generationComplete':
                if (postGenerationControls) {
                    postGenerationControls.classList.remove('hidden');
                }
                break;
            case 'error':
                if (errorContainer) {
                    errorContainer.textContent = message.text;
                    errorContainer.classList.remove('hidden');
                }
                break;
        }
    });

})();
