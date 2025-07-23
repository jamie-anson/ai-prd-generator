// @ts-nocheck
import * as vscode from 'vscode';
import { registerCommands } from './commands';

/**
 * This method is called when the extension is activated.
 * It sets up the main command, registers event listeners, and initializes resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ai-prd-generator" is now active!');
    registerCommands(context);
}

export function deactivate() {}
