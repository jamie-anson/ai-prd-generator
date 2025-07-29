import * as vscode from 'vscode';

const registeredCommands: Map<string, vscode.Disposable> = new Map();

/**
 * Registers a command only if it hasn't been registered already.
 * This prevents 'command already exists' errors during test runs.
 * 
 * @param commandId The ID of the command to register.
 * @param callback The function to execute when the command is called.
 * @param context The extension context to push the subscription to.
 */
export function registerCommandOnce(commandId: string, callback: (...args: any[]) => any, context: vscode.ExtensionContext): vscode.Disposable {
    if (registeredCommands.has(commandId)) {
        console.warn(`⚠️ Command '${commandId}' is already registered. Skipping.`);
        return registeredCommands.get(commandId)!;
    }

    const command = vscode.commands.registerCommand(commandId, callback);
    context.subscriptions.push(command);
    registeredCommands.set(commandId, command);
    console.log(`✅ Command '${commandId}' registered successfully.`);
    return command;
}



/**
 * Clears the command registry. Should only be used for testing purposes.
 */
export function disposeAllCommands() {
    for (const disposable of registeredCommands.values()) {
        disposable.dispose();
    }
    registeredCommands.clear();
}
