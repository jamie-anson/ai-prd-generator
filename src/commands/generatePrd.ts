/**
 * @file generatePrd.ts
 * @description This file is responsible for registering the 'Generate PRD' command.
 */
import * as vscode from 'vscode';
import { PanelManager } from './prdGeneration/panelManager';
import { createPrdMessageHandler } from './prdGeneration/messageHandlers';

/**
 * Registers the command for generating a PRD.
 * This function sets up the panel manager and message router.
 * @param context The extension context provided by VS Code.
 */
export function registerGeneratePrdCommand(context: vscode.ExtensionContext) {
    console.log('🔧 Registering ai-prd-generator.generatePrd command...');
    
    try {
        const messageHandler = createPrdMessageHandler();
        const panelManager = new PanelManager(context, messageHandler);

        const command = vscode.commands.registerCommand('ai-prd-generator.generatePrd', () => {
            console.log('🎯 Generate PRD command executed!');
            panelManager.createAndShowPanel();
        });

        context.subscriptions.push(command);
        console.log('✅ ai-prd-generator.generatePrd command registered successfully');
        
    } catch (error) {
        console.error('❌ Error registering ai-prd-generator.generatePrd command:', error);
        throw error;
    }
}

