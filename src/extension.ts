import * as vscode from 'vscode';
import { registerAllCommands } from './commands';

/**
 * This method is called when the extension is activated.
 * It sets up the main command, registers event listeners, and initializes resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 AI PRD Generator extension is activating...');
    console.log('📍 Extension ID:', context.extension.id);
    console.log('📍 Extension path:', context.extensionPath);
    
    try {
        // Register commands with detailed logging
        console.log('🔧 About to register all commands...');
        registerAllCommands(context);
        console.log('✅ All commands registered successfully');
        
        // Immediate command verification
        console.log('🔍 Verifying command registration...');
        const commands = vscode.commands.getCommands(true);
        Promise.resolve(commands).then(commandList => {
            console.log('📋 Total registered commands:', commandList.length);
            const ourCommand = commandList.find(cmd => cmd === 'ai-prd-generator.generatePrd');
            if (ourCommand) {
                console.log('✅ SUCCESS: Command ai-prd-generator.generatePrd is registered and available');
            } else {
                console.error('❌ FAILURE: Command ai-prd-generator.generatePrd NOT found in registered commands');
                console.log('🔍 Available commands containing "ai-prd":', 
                    commandList.filter(cmd => cmd.includes('ai-prd')));
            }
        }).catch((error: any) => {
            console.error('❌ Error getting command list:', error);
        });
        
        // Test command registration directly
        console.log('🧪 Testing direct command execution...');
        Promise.resolve(vscode.commands.executeCommand('ai-prd-generator.generatePrd')).then(() => {
            console.log('✅ Direct command execution successful');
        }).catch((error: any) => {
            console.error('❌ Direct command execution failed:', error);
        });
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR during extension activation:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Show user-visible error
        vscode.window.showErrorMessage(
            `AI PRD Generator extension failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
    
    console.log('🎉 AI PRD Generator extension activation complete!');
}

export function deactivate() {}
