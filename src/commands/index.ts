// @ts-nocheck
/**
 * @file index.ts
 * @description Central command registration module for the AI PRD Generator extension.
 * 
 * The logic of this file is to:
 * 1. Import all command registration functions from their respective modules
 * 2. Provide a centralized registerAllCommands function for extension initialization
 * 3. Ensure all VS Code commands are properly registered with the extension context
 * 4. Maintain a single point of control for command lifecycle management
 * 5. Support the complete workflow from PRD generation to visual diagram viewing
 */

import * as vscode from 'vscode';
import { registerGeneratePrdCommand } from './generatePrd';
import { registerViewPrdCommand } from './viewPrd';
import { registerViewDiagramCommand } from './viewDiagram';
import { registerGenerateContextCardsCommand } from './generateContextCards';
import { registerViewContextCardsCommand } from './viewContextCards';

/**
 * Logic Step: Register all extension commands with VS Code.
 * This function serves as the central command registration point, ensuring all
 * commands are properly initialized when the extension activates. It maintains
 * the complete command lifecycle for PRD generation, context management, and
 * visual diagram rendering capabilities.
 * @param context The VS Code extension context for command registration and resource management
 */
export function registerAllCommands(context: vscode.ExtensionContext) {
    registerGeneratePrdCommand(context);
    registerViewPrdCommand(context);
    registerViewDiagramCommand(context);  // Added for visual diagram rendering
    registerGenerateContextCardsCommand(context);
    registerViewContextCardsCommand(context);
}
