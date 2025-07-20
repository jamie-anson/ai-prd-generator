const vscode = acquireVsCodeApi();
const generateButton = document.getElementById('generate-button');
const promptInput = document.getElementById('prompt-input');
const responseOutput = document.getElementById('response-output');
const loader = document.getElementById('loader');

generateButton.addEventListener('click', () => {
    const prompt = promptInput.value;
    if (!prompt) { return; }
    
    responseOutput.textContent = '';
    loader.style.display = 'block';
    generateButton.disabled = true;

    vscode.postMessage({
        command: 'generate',
        text: prompt
    });
});

window.addEventListener('message', event => {
    const message = event.data;
    loader.style.display = 'none';
    generateButton.disabled = false;

    switch (message.command) {
        case 'generationComplete':
            responseOutput.textContent = 'Success! Files created:\n' + message.files.join('\n');
            break;
        case 'error':
            responseOutput.textContent = 'Error: ' + message.text;
            break;
    }
});
