// Get a reference to the VS Code API, which allows communication with the extension backend.
const vscode = acquireVsCodeApi();

// Get references to the HTML elements in the webview.
const generateButton = document.getElementById('generate-btn'); // The button to trigger PRD generation.
const promptInput = document.getElementById('product-idea'); // The textarea for user input.
const statusDiv = document.getElementById('status'); // The div to display status messages.

/**
 * Event listener for the 'Generate PRD' button.
 * When clicked, it sends the user's product idea to the extension backend.
 */
generateButton.addEventListener('click', () => {
    const prompt = promptInput.value;
    // Do nothing if the input is empty.
    if (!prompt) { return; }
    
    // Clear previous status, show a loading message, and disable the button to prevent multiple clicks.
    statusDiv.textContent = 'Generating...';
    generateButton.disabled = true;

    // Post a message to the extension backend with the 'generate' command and the prompt text.
    vscode.postMessage({
        command: 'generate',
        text: prompt
    });
});

/**
 * Event listener for messages received from the extension backend.
 * This handles responses like completion or errors.
 */
window.addEventListener('message', event => {
    const message = event.data; // The data sent from the extension's `panel.webview.postMessage`.

    // Re-enable the generate button once a response is received.
    generateButton.disabled = false;

    // Handle the message based on its command.
    switch (message.command) {
        // If generation was successful, display the paths of the created files.
        case 'generationComplete':
            statusDiv.textContent = 'Success! Files created:\n' + message.files.join('\n');
            break;
        // If an error occurred, display the error message.
        case 'error':
            statusDiv.textContent = 'Error: ' + message.text;
            break;
    }
});
