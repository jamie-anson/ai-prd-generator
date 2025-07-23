const vscode = acquireVsCodeApi();

(function() {
    const vscode = acquireVsCodeApi();

    // Immediately signal to the extension that the webview is ready to receive messages.
    vscode.postMessage({ command: 'webviewReady' });

    const generatePrdButton = document.getElementById('generate-prd');
    const setApiKeyButton = document.getElementById('set-api-key');
    const bulkGenerateContextCardsButton = document.getElementById('bulk-generate-context-cards');
    const viewContextCardsButton = document.getElementById('view-context-cards');
    const viewPrdButton = document.getElementById('view-prd');
    const prdPrompt = document.getElementById('prd-prompt');
    const prdOutput = document.getElementById('prd-output');
    const postGenerationControls = document.getElementById('post-generation-controls');

    if (generatePrdButton) {
        generatePrdButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'generate', text: prdPrompt.value });
        });
    }

    if (setApiKeyButton) {
        setApiKeyButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'set-api-key' });
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

    window.addEventListener('message', event => {
        const message = event.data; // The JSON data from the extension
        console.log('Received message:', message);

        switch (message.command) {
            case 'generationComplete':
                console.log('Generation complete message received. Showing controls.');
                if (prdOutput && postGenerationControls) {
                    prdOutput.textContent = 'Success! Files created: ' + message.files.join(', ');
                    postGenerationControls.style.display = 'block';
                }
                break;
            case 'error':
                if (prdOutput) {
                    console.error('Error message received:', message.text);
                    prdOutput.textContent = 'Error: ' + message.text;
                }
                break;
        }
    });
}());
