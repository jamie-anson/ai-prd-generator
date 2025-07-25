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

        // The 'handleViewCommands' handler has a different signature (it's not async and doesn't use all parameters).
    // We wrap it in a new function to make it compatible with the MessageHandler type.
        router.register(COMMANDS.VIEW_PRD, (message, context, webview, lastGeneratedPaths) => {
        handleViewCommands(message, lastGeneratedPaths);
        return Promise.resolve(true);
    });
        router.register(COMMANDS.VIEW_GRAPH, (message, context, webview, lastGeneratedPaths) => {
        handleViewCommands(message, lastGeneratedPaths);
        return Promise.resolve(true);
    });

        router.register(COMMANDS.GENERATE_CONTEXT_CARDS, handleContextCards);

    // The handleGeneratePrd function returns the generated paths, which we need to track.
        router.register(COMMANDS.GENERATE_PRD, (message, context, webview) => {
        return handleGeneratePrd(message, context, webview);
    });

        // Adapt the context template generation handler, which doesn't use all the standard parameters.
        router.register(COMMANDS.GENERATE_CONTEXT_TEMPLATES, (message, context, webview, lastGeneratedPaths) => {
        return handleGenerateContextTemplates(context, lastGeneratedPaths);
    });

    // Register the new diagram generation handlers
    router.register(COMMANDS.GENERATE_DATA_FLOW_DIAGRAM, (message, context, webview, lastGeneratedPaths) => {
        return handleGenerateDataFlowDiagram(context, lastGeneratedPaths, webview);
    });

    router.register(COMMANDS.GENERATE_COMPONENT_HIERARCHY, (message, context, webview, lastGeneratedPaths) => {
        return handleGenerateComponentHierarchy(context, lastGeneratedPaths, webview);
    });

    // Register the diagram viewing handlers
    router.register(COMMANDS.VIEW_DATA_FLOW_DIAGRAM, (message, context, webview, lastGeneratedPaths) => {
        return handleViewDataFlowDiagram(context);
    });

    router.register(COMMANDS.VIEW_COMPONENT_HIERARCHY, (message, context, webview, lastGeneratedPaths) => {
        return handleViewComponentHierarchy(context);
    });

    /**
     * Logic Step: Register View PRD and View Graph command handlers.
     * These handlers restore the functionality for viewing previously generated PRD files
     * in markdown format and graph format using the updated handleViewCommands logic.
     * Both handlers delegate to handleViewCommands which now includes fallback file
     * discovery when lastGeneratedPaths context is unavailable.
     */
    router.register(COMMANDS.VIEW_PRD, async (message, context, webview, lastGeneratedPaths) => {
        await handleViewCommands(message, lastGeneratedPaths);
        return Promise.resolve();
    });

    router.register(COMMANDS.VIEW_GRAPH, async (message, context, webview, lastGeneratedPaths) => {
        await handleViewCommands(message, lastGeneratedPaths);
        return Promise.resolve();
    });

    return router;
}
