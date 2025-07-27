import { MessageRouter } from '../../webview/router';
import { handleApiKey } from '../../webview/handlers/handleApiKey';
import { handleViewCommands } from '../../webview/handlers/handleViewCommands';
import { handleContextCards } from '../../webview/handlers/handleContextCards';
import { handleGeneratePrd } from '../../webview/handlers/handleGeneratePrd';
import { handleGenerateContextTemplates } from '../../webview/handlers/handleContextTemplates';
import { handleWebviewReady } from '../../webview/handlers/handleWebviewReady';
import { handleGenerateDataFlowDiagram } from '../../webview/handlers/handleDataFlowDiagram';
import { handleGenerateComponentHierarchy } from '../../webview/handlers/handleComponentHierarchy';
import { handleViewDataFlowDiagram, handleViewComponentHierarchy } from '../../webview/handlers/handleViewDiagrams';
import { handleGenerateCCS } from '../../webview/handlers/handleGenerateCCS';
import { COMMANDS } from '../../webview/commands';

/**
 * Factory function to create and configure a MessageRouter for the PRD generator.
 * This function encapsulates the registration of all message handlers related to PRD generation,
 * keeping the setup logic organized and separate from the command registration.
 * It also adapts handlers with different signatures to conform to the standard MessageHandler type.
 * 
 * @returns A fully configured MessageRouter instance ready to be used by a PanelManager.
 */
export function createPrdMessageHandler(): MessageRouter {
        const router = new MessageRouter();

    // Handle the initial 'webviewReady' message to check for an API key.
        router.register(COMMANDS.WEBVIEW_READY, handleWebviewReady);

    // Register all the handlers for the PRD generator webview.
        router.register(COMMANDS.GET_API_KEY, handleApiKey);
    router.register(COMMANDS.SAVE_API_KEY, handleApiKey);

        // Register view commands using the updated handler signature
    router.register(COMMANDS.VIEW_PRD, (message, context, webview) => {
        return handleViewCommands(message);
    });
    router.register(COMMANDS.VIEW_GRAPH, (message, context, webview) => {
        return handleViewCommands(message);
    });

        router.register(COMMANDS.GENERATE_CONTEXT_CARDS, handleContextCards);

    // The handleGeneratePrd function returns the generated paths, which we need to track.
        router.register(COMMANDS.GENERATE_PRD, (message, context, webview) => {
        return handleGeneratePrd(message, context, webview);
    });

    // Register context template generation handler with updated signature
    router.register(COMMANDS.GENERATE_CONTEXT_TEMPLATES, (message, context, webview) => {
        return handleGenerateContextTemplates(context, webview);
    });

    // Register the diagram generation handlers with updated signatures
    router.register(COMMANDS.GENERATE_DATA_FLOW_DIAGRAM, (message, context, webview) => {
        return handleGenerateDataFlowDiagram(context, undefined, webview);
    });

    router.register(COMMANDS.GENERATE_COMPONENT_HIERARCHY, (message, context, webview) => {
        return handleGenerateComponentHierarchy(context, undefined, webview);
    });

    // Register the diagram viewing handlers
    router.register(COMMANDS.VIEW_DATA_FLOW_DIAGRAM, (message, context, webview) => {
        return handleViewDataFlowDiagram(context);
    });

    router.register(COMMANDS.VIEW_COMPONENT_HIERARCHY, (message, context, webview) => {
        return handleViewComponentHierarchy(context);
    });

    // Register the CCS generation handler
    router.register(COMMANDS.GENERATE_CCS, (message, context, webview) => {
        return handleGenerateCCS(message, context, webview);
    });

    return router;
}
