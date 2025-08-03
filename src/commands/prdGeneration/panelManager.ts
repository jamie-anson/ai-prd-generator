import * as vscode from 'vscode';
import { getWebviewContent } from '../../utils/webview';
import { MessageRouter } from '../../webview/router';

/**
 * @class PanelManager
 * @description Manages the lifecycle of the main webview panel. This class ensures that only one panel exists at a time (singleton pattern),
 * and handles its creation, content setup, and message routing.
 *
 * @property {vscode.WebviewPanel | undefined} currentPanel - The current active webview panel.
 * @property {vscode.ExtensionContext} context - The extension context.
 * @property {MessageRouter} router - The message router for handling webview communication.
 */
export class PanelManager {
    private currentPanel: vscode.WebviewPanel | undefined = undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly router: MessageRouter
    ) { }

    /**
     * Creates and shows a new webview panel for the PRD generator.
     * If a panel already exists, it simply reveals it.
     * This ensures that only one instance of the PRD generator is active at a time.
     */
    /**
     * @function createAndShowPanel
     * @description Creates a new webview panel or reveals the existing one. It sets up the webview's HTML content
     * and configures the message listeners.
     */
    public async createAndShowPanel(): Promise<void> {
        if (this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.currentPanel = vscode.window.createWebviewPanel(
            'prdGenerator',
            'PRD Generator',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        await this.setupWebview();
    }

        /**
     * Sets up the webview's HTML content and configures message listeners.
     * This method is responsible for loading the webview's UI and establishing the communication
     * channel between the webview and the extension host.
     */
    /**
     * @private
     * @function setupWebview
     * @description Sets up the webview's HTML content, including the main script, and configures message listeners
     * to route communication through the MessageRouter.
     */
    private async setupWebview(): Promise<void> {
        if (!this.currentPanel) {
            return;
        }

        const scriptPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'media', 'main.js');
        const scriptUri = this.currentPanel.webview.asWebviewUri(scriptPath);
        this.currentPanel.webview.html = getWebviewContent(scriptUri, this.currentPanel);

        this.currentPanel.onDidDispose(() => {
            this.currentPanel = undefined;
        }, null, this.context.subscriptions);

        this.currentPanel.webview.onDidReceiveMessage(async message => {
            await this.router.route(message, this.context, this.currentPanel!.webview);
        });
    }
}
