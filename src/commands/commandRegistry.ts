/**
 * @file commandRegistry.ts
 * @description A utility for safely registering and managing VS Code commands.
 * This registry ensures that commands are not registered multiple times, which can
 * cause errors, especially in a testing environment or during extension re-activation.
 *
 * The logic of this file is to:
 * 1. Provide a `registerCommandOnce` function that prevents duplicate command registration.
 * 2. Maintain a map of registered commands for tracking and disposal.
 * 3. Offer a `disposeAllCommands` function for cleanup, primarily used in tests.
 */
import * as vscode from 'vscode';

const registeredCommands: Map<string, vscode.Disposable> = new Map();

/**
 * @function registerCommandOnce
 * @description Registers a command if it hasn't been registered already. This prevents 'command already exists' errors,
 * which is especially useful during automated test runs or extension reloads.
 * 
 * @param {string} commandId The ID of the command to register (e.g., 'ai-prd-generator.generatePrd').
 * @param {Function} callback The function to execute when the command is invoked.
 * @param {vscode.ExtensionContext} context The extension context, used to manage subscriptions for proper disposal.
 * @returns {vscode.Disposable} The disposable for the registered command.
 */
export function registerCommandOnce(commandId: string, callback: (...args: any[]) => any, context: vscode.ExtensionContext): vscode.Disposable {
    // Logic Step 1: Check if the command is already in the registry.
    if (registeredCommands.has(commandId)) {
        // If so, return the existing disposable to avoid re-registration.
        return registeredCommands.get(commandId)!;
    }

    // Logic Step 2: If the command is new, register it with VS Code.
    const command = vscode.commands.registerCommand(commandId, callback);

    // Logic Step 3: Add the new command's disposable to the extension's subscriptions for cleanup on deactivation.
    context.subscriptions.push(command);

    // Logic Step 4: Add the command to our internal registry for tracking.
    registeredCommands.set(commandId, command);

    return command;
}



/**
 * @function disposeAllCommands
 * @description Disposes of all registered commands and clears the internal registry.
 * This is a cleanup utility intended ONLY for use in testing environments to ensure a clean state between tests.
 */
export function disposeAllCommands() {
    for (const disposable of registeredCommands.values()) {
        disposable.dispose();
    }
    registeredCommands.clear();
}
