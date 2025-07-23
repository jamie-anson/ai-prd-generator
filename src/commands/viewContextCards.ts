import * as vscode from 'vscode';

export function registerViewContextCardsCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('ai-prd-generator.viewContextCards', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspaceUri = workspaceFolders[0].uri;
        const contextCardDir = vscode.Uri.joinPath(workspaceUri, 'mise-en-place-output', 'context-cards');
        try {
            const files = await vscode.workspace.fs.readDirectory(contextCardDir);
            const cardFiles = files.filter(f => f[1] === vscode.FileType.File && f[0].endsWith('.md')).map(f => f[0]);

            if (cardFiles.length === 0) {
                vscode.window.showInformationMessage('No context cards found.');
                return;
            }

            const selectedFile = await vscode.window.showQuickPick(cardFiles, { placeHolder: 'Select a context card to view' });
            if (selectedFile) {
                const fileUri = vscode.Uri.joinPath(contextCardDir, selectedFile);
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);
            }
        } catch (e) {
            console.log('Could not read context card directory, likely does not exist yet.');
            vscode.window.showInformationMessage('No context cards have been generated yet.');
        }
    });

    context.subscriptions.push(command);
}
