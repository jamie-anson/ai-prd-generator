import * as vscode from 'vscode';

/**
 * Defines the shape of a message handler function.
 * @param message The message received from the webview.
 * @param context The extension context.
 * @param webview The webview instance.
 * @returns A promise that resolves with the result of the handler.
 */
export type MessageHandler = (
    message: any,
    context: vscode.ExtensionContext,
    webview: vscode.Webview
) => Promise<any>;

/**
 * A routing mechanism for webview messages.
 * This class decouples the message-receiving logic from the message-handling logic,
 * allowing for a cleaner and more scalable architecture. Handlers are registered for
 * specific command strings, and the router dispatches incoming messages to the appropriate handler.
 */
export class MessageRouter {
    private handlers: Map<string, MessageHandler> = new Map();

        /**
     * Registers a message handler for a given command.
     * Each command string should have a single, dedicated handler.
     * @param command The command string sent from the webview (e.g., 'generate-prd').
     * @param handler The function that will be executed when a message with this command is received.
     */
    public register(command: string, handler: MessageHandler): void {
        this.handlers.set(command, handler);
    }

        /**
     * Routes an incoming message to its registered handler based on the message's command property.
     * If a handler is found, it is executed with the provided arguments.
     * If no handler is registered for the command, a warning is logged.
     *
     * @param message The message object received from the webview. Must contain a 'command' property.
     * @param context The extension's context, passed to the handler.
     * @param webview The webview instance, passed to the handler.
     * @returns A promise that resolves with the return value of the executed handler, or null if no handler is found.
     */
    public async route(
        message: any,
        context: vscode.ExtensionContext,
        webview: vscode.Webview
    ): Promise<any> {
        const handler = this.handlers.get(message.command);
        if (handler) {
            return handler(message, context, webview);
        }
        console.warn(`No handler registered for command: ${message.command}`);
        return null;
    }
}
