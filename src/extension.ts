import * as vscode from 'vscode';
import { registerAllCommands } from './commands';

/**
 * This method is called when the extension is activated.
 * It sets up the main command, registers event listeners, and initializes resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 AI PRD Generator extension is activating...');

    try {
        // Logic Step 1: Register all commands for the extension.
        // This is the main entry point for all functionality.
        console.log('Registering all commands...');
        registerAllCommands(context);
        console.log('All commands registered successfully.');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('❌ CRITICAL ERROR during extension activation:', errorMessage, error);
        vscode.window.showErrorMessage(`AI PRD Generator extension failed to activate: ${errorMessage}`);
    }

    console.log('🎉 AI PRD Generator extension activation complete!');
}

/**
 * This method is called when the extension is deactivated.
 * It's used for cleanup tasks.
 */
export function deactivate() {
    console.log('👋 AI PRD Generator extension is deactivating...');
}
