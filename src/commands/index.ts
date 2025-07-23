import * as vscode from 'vscode';
import { registerGeneratePrdCommand } from './generatePrd';
import { registerViewPrdCommand } from './viewPrd';
import { registerGenerateContextCardsCommand } from './generateContextCards';
import { registerViewContextCardsCommand } from './viewContextCards';

export function registerAllCommands(context: vscode.ExtensionContext) {
    registerGeneratePrdCommand(context);
    registerViewPrdCommand(context);
    registerGenerateContextCardsCommand(context);
    registerViewContextCardsCommand(context);
}
