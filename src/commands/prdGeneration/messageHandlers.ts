import { MessageRouter } from '../../webview/router';
import { handleSaveApiKey } from '../../webview/handlers/handleSaveApiKey';
import { handleViewCommands } from '../../webview/handlers/handleViewCommands';
import { handleContextCards } from '../../webview/handlers/handleContextCards';
import { handleGeneratePrd } from '../../webview/handlers/handleGeneratePrd';
import { handleGenerateContextTemplates } from '../../webview/handlers/handleContextTemplates';
import { handleWebviewReady } from '../../webview/handlers/handleWebviewReady';
import { handleUiReady } from '../../webview/handlers/handleUiReady';
import { handleGenerateDataFlowDiagram } from '../../webview/handlers/handleDataFlowDiagram';
import { handleGenerateComponentHierarchy } from '../../webview/handlers/handleComponentHierarchy';
import { handleViewDataFlowDiagram, handleViewComponentHierarchy } from '../../webview/handlers/handleViewDiagrams';
import { handleGenerateCCS } from '../../webview/handlers/handleGenerateCCS';
import { handleGenerateEnhancedCCS } from '../../webview/handlers/handleGenerateEnhancedCCS';
import { handleCcsDocumentation } from '../../webview/handlers/handleCcsDocumentation';
import { handleGenerateHandover } from '../../webview/handlers/handleGenerateHandover';
import { COMMANDS } from '../../webview/commands';

/**
 * @function createPrdMessageHandler
 * @description Factory function to create and configure a MessageRouter for the main webview panel.
 * This function encapsulates the registration of all message handlers, creating a centralized
 * point of control for webview-extension communication. It ensures that every command sent
 * from the webview is routed to the appropriate backend handler.
 *
 * @returns {MessageRouter} A fully configured MessageRouter instance.
 */
export function createPrdMessageHandler(): MessageRouter {
    const router = new MessageRouter();

    // Logic Step 1: Register webview lifecycle and API key handlers.
    router.register(COMMANDS.WEBVIEW_READY, handleWebviewReady);
    router.register('webview-ready', handleUiReady); // PHASE 2: New message-based initialization pattern
    router.register('uiReady', handleUiReady); // Backward compatibility during transition
    router.register(COMMANDS.SAVE_API_KEY, handleSaveApiKey);

    // Logic Step 2: Register core content generation handlers.
    router.register(COMMANDS.GENERATE_PRD, (message, context, webview) => {
        return handleGeneratePrd(message, context, webview);
    });
    router.register(COMMANDS.GENERATE_CONTEXT_CARDS, handleContextCards);
    router.register(COMMANDS.GENERATE_CONTEXT_TEMPLATES, (message, context, webview) => {
        return handleGenerateContextTemplates(context, webview);
    });

    // Logic Step 3: Register diagram generation handlers.
    router.register(COMMANDS.GENERATE_DATA_FLOW_DIAGRAM, (message, context, webview) => {
        return handleGenerateDataFlowDiagram(context, undefined, webview);
    });
    router.register(COMMANDS.GENERATE_COMPONENT_HIERARCHY, (message, context, webview) => {
        return handleGenerateComponentHierarchy(context, undefined, webview);
    });

    // Logic Step 4: Register documentation and handover generation handlers.
    router.register(COMMANDS.GENERATE_COMPREHENSIVE_README, handleCcsDocumentation);
    router.register(COMMANDS.GENERATE_CODEBASE_MAP, handleCcsDocumentation);
    router.register(COMMANDS.GENERATE_TESTING_FRAMEWORK, handleCcsDocumentation);
    router.register(COMMANDS.GENERATE_AI_PROMPTING_GUIDE, handleCcsDocumentation);
    router.register(COMMANDS.GENERATE_ALL_CCS_DOCS, handleCcsDocumentation);
    router.register(COMMANDS.GENERATE_HANDOVER_FILE, handleGenerateHandover);

    // Logic Step 5: Register view handlers for generated artifacts.
    router.register(COMMANDS.VIEW_PRD, (message, context, webview) => {
        return handleViewCommands(message);
    });
    router.register(COMMANDS.VIEW_GRAPH, (message, context, webview) => {
        return handleViewCommands(message);
    });
    router.register(COMMANDS.VIEW_DATA_FLOW_DIAGRAM, (message, context, webview) => {
        return handleViewDataFlowDiagram(context);
    });
    router.register(COMMANDS.VIEW_COMPONENT_HIERARCHY, (message, context, webview) => {
        return handleViewComponentHierarchy(context);
    });

    // Logic Step 6: Register CCS analysis handlers.
    router.register(COMMANDS.GENERATE_CCS, (message, context, webview) => {
        return handleGenerateCCS(message, context, webview);
    });
    router.register(COMMANDS.GENERATE_ENHANCED_CCS, (message, context, webview) => {
        return handleGenerateEnhancedCCS(message, context, webview);
    });

    return router;
}
