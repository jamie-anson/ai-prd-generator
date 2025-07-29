import * as vscode from 'vscode';
import { registerCommandOnce } from './commandRegistry';
// import { ContextCardGenerator } from '../context-card-generator';

export function registerGenerateContextCardsCommand(context: vscode.ExtensionContext) {
    registerCommandOnce('ai-prd-generator.bulkGenerateContextCards', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspaceUri = workspaceFolders[0].uri;
        // const generator = new ContextCardGenerator(workspaceUri, context);
        // await generator.generateAndSaveContextCards();
        vscode.window.showInformationMessage('Context Cards generation temporarily disabled due to dependency issues');
    }, context);
}
