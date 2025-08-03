/**
 * @file generateHandover.ts
 * @description Command to handle the generation of the handover document.
 * This command is currently a placeholder and delegates to the main webview.
 * @license MIT
 * @author Your Name
 */

import * as vscode from 'vscode';
import { registerCommandOnce } from './commandRegistry';
import { PanelManager } from './prdGeneration/panelManager';

/**
 * @function registerGenerateHandoverCommand
 * @description Registers the command for generating a handover document.
 * For now, it opens the main panel, as the button is inside the webview.
 * @param {vscode.ExtensionContext} context The extension context.
 */
export function registerGenerateHandoverCommand(context: vscode.ExtensionContext, panelManager: PanelManager) {
  registerCommandOnce('ai-prd-generator.generateHandover', () => {
    panelManager.createAndShowPanel();
  }, context);
}
