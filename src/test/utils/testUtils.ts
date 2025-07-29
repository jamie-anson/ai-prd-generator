/**
 * @ts-nocheck
 * Test Utilities for ai-prd-generator Extension
 * 
 * Logic: Provides common testing utilities, mocks, and helper functions
 * for consistent test setup across all test types.
 */

import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectState } from '../../webview/types';

/**
 * Mock VS Code API components
 */
export class VSCodeMocks {
    public static workspace = {
        getConfiguration: sinon.stub(),
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        findFiles: sinon.stub(),
        onDidChangeConfiguration: sinon.stub(),
        fs: {
            stat: sinon.stub(),
            readDirectory: sinon.stub(),
            readFile: sinon.stub(),
        },
    };

    public static window = {
        showInformationMessage: sinon.stub(),
        showErrorMessage: sinon.stub(),
        showWarningMessage: sinon.stub(),
        createWebviewPanel: sinon.stub(),
        withProgress: sinon.stub()
    };

    private static _registeredCommands: string[] = [];

    public static commands = {
        registerCommand: sinon.stub().callsFake((command: string, callback: (...args: any[]) => any) => {
            VSCodeMocks._registeredCommands.push(command);
            return { dispose: () => {} };
        }),
        executeCommand: sinon.stub(),
        getCommands: sinon.stub().callsFake(() => {
            return Promise.resolve(VSCodeMocks._registeredCommands);
        }),
    };

    public static Uri = {
        file: sinon.stub().callsFake((path: string) => ({ fsPath: path })),
        joinPath: sinon.stub()
    };

    /**
     * Logic Step: Create mock VS Code Uri object
     * Creates a mock Uri with fsPath property for testing
     * @param fsPath The file system path for the mock Uri
     * @returns Mock Uri object with fsPath property
     */
    public static createMockUri(fsPath: string): any {
        return {
            fsPath: fsPath,
            scheme: 'file',
            authority: '',
            path: fsPath,
            query: '',
            fragment: '',
            toString: () => `file://${fsPath}`
        };
    }

    /**
     * Logic Step: Reset all VS Code mocks to clean state
     */
    public static resetAll(): void {
        // Reset workspace stubs
        if (typeof this.workspace.getConfiguration.reset === 'function') {
            this.workspace.getConfiguration.reset();
        }
        if (typeof this.workspace.findFiles.reset === 'function') {
            this.workspace.findFiles.reset();
        }
        if (typeof this.workspace.onDidChangeConfiguration.reset === 'function') {
            this.workspace.onDidChangeConfiguration.reset();
        }

        if (this.workspace.fs) {
            Object.values(this.workspace.fs).forEach(stub => {
                if (typeof stub.reset === 'function') {
                    stub.reset();
                }
            });
        }
        
        // Reset window stubs
        Object.values(this.window).forEach(stub => {
            if (typeof stub.reset === 'function') {stub.reset();}
        });
        
        // Reset command stubs
        this.commands.registerCommand.resetHistory();
        this.commands.executeCommand.resetHistory();
        this.commands.getCommands.resetHistory();
        this._registeredCommands = [];
        
        // Reset Uri stubs
        Object.values(this.Uri).forEach(stub => {
            if (typeof stub.reset === 'function') {stub.reset();}
        });
    }

    /**
     * Create a mock Webview for testing
     * Uses a factory pattern to ensure fresh, non-conflicting stubs
     */
    public static createMockWebview(): any {
        // Create a plain object first, then add methods
        const mockWebview = {
            html: '',
            options: {},
            viewColumn: undefined,
            cspSource: 'vscode-webview:'
        };
        
        // Add stub methods that can be safely spied on
        Object.assign(mockWebview, {
            onDidReceiveMessage: sinon.stub().returns({ dispose: sinon.stub() }),
            postMessage: function(message: any) { return Promise.resolve(true); },
            asWebviewUri: sinon.stub().callsFake((uri: any) => uri)
        });
        
        return mockWebview;
    }

    /**
     * Create a mock WebviewPanel for testing
     */
    public static createMockWebviewPanel(): any {
        const mockWebview = this.createMockWebview();
        return {
            webview: mockWebview,
            viewType: 'test-webview',
            title: 'Test Webview',
            viewColumn: vscode.ViewColumn.One,
            active: true,
            visible: true,
            onDidDispose: sinon.stub().returns({ dispose: sinon.stub() }),
            onDidChangeViewState: sinon.stub().returns({ dispose: sinon.stub() }),
            dispose: sinon.stub(),
            reveal: sinon.stub()
        };
    }

    /**
     * Logic Step: Create a mock ExtensionContext for testing
     * Creates fresh instances to prevent Sinon stubbing conflicts
     */
    public static createMockExtensionContext(): any {
        // Create fresh mock objects for each test to prevent conflicts
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: function(key: string) { return undefined; },
                update: function(key: string, value: any) { return Promise.resolve(); },
                keys: function() { return []; }
            },
            globalState: {
                get: function(key: string) { return undefined; },
                update: function(key: string, value: any) { return Promise.resolve(); },
                keys: function() { return []; },
                setKeysForSync: function(keys: string[]) { }
            },
            secrets: {
                get: function(key: string) { 
                    return Promise.resolve(key === 'openAiApiKey' ? 'test-api-key' : undefined);
                },
                store: function(key: string, value: string) { return Promise.resolve(); },
                delete: function(key: string) { return Promise.resolve(); },
                onDidChange: function() { return { dispose: function() {} }; }
            },
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            asAbsolutePath: function(relativePath: string) {
                return `/test/extension/${relativePath}`;
            },
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/logs',
            logUri: vscode.Uri.file('/test/logs'),
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global-storage'),
            environmentVariableCollection: {
                persistent: false,
                replace: function(variable: string, value: string) { },
                append: function(variable: string, value: string) { },
                prepend: function(variable: string, value: string) { },
                get: function(variable: string) { return undefined; },
                forEach: function(callback: any) { },
                delete: function(variable: string) { },
                clear: function() { },
                getScoped: function(scope: any) { return this; },
                description: 'Test environment variable collection',
                [Symbol.iterator]: function() { return [][Symbol.iterator](); }
            },
            extensionMode: vscode.ExtensionMode.Test,
            extension: {
                id: 'jammie-anson.ai-prd-generator',
                extensionUri: vscode.Uri.file('/test/extension'),
                extensionPath: '/test/extension',
                isActive: true,
                packageJSON: {},
                extensionKind: vscode.ExtensionKind.Workspace,
                exports: undefined,
                activate: function() { return Promise.resolve(); }
            },
            languageModelAccessInformation: {
                onDidChange: function() { return { dispose: function() {} }; },
                canSendRequest: function() { return undefined; }
            }
        };
        
        return mockContext;
    }
}

/**
 * Mock OpenAI API responses
 */
export class OpenAIMocks {
    public static createChatCompletion = sinon.stub();

    /**
     * Logic Step: Create mock PRD generation response
     */
    public static mockPRDResponse(content: string = 'Mock PRD Content'): void {
        this.createChatCompletion.resolves({
            choices: [{ message: { content } }]
        });
    }

    /**
     * Logic Step: Create mock diagram generation response
     */
    public static mockDiagramResponse(mermaidCode: string = 'graph TD\nA --> B'): void {
        this.createChatCompletion.resolves({
            choices: [{ message: { content: mermaidCode } }]
        });
    }

    public static reset(): void {
        this.createChatCompletion.reset();
    }
}

/**
 * File system operation mocks
 */
export class FileSystemMocks {
    public static readFile = sinon.stub();
    public static writeFile = sinon.stub();
    public static ensureDir = sinon.stub();
    public static pathExists = sinon.stub();
    public static readdir = sinon.stub();

    /**
     * Logic Step: Mock project state detection files
     */
    public static mockProjectFiles(state: Partial<ProjectState>): void {
        this.pathExists.callsFake((path: string) => {
            if (path.includes('prd') && state.hasPRD) {return Promise.resolve(true);}
            if (path.includes('context-cards') && state.hasContextCards) {return Promise.resolve(true);}
            if (path.includes('context-templates') && state.hasContextTemplates) {return Promise.resolve(true);}
            return Promise.resolve(false);
        });

        this.readdir.callsFake((path: string) => {
            if (path.includes('prd')) {return Promise.resolve(state.prdCount ? ['prd1.md'] : []);}
            if (path.includes('context-cards')) {return Promise.resolve(state.contextCardCount ? ['card1.md'] : []);}
            if (path.includes('context-templates')) {return Promise.resolve(state.contextTemplateCount ? ['template1.md'] : []);}
            return Promise.resolve([]);
        });
    }

    public static reset(): void {
        this.readFile.reset();
        this.writeFile.reset();
        this.ensureDir.reset();
        this.pathExists.reset();
        this.readdir.reset();
    }
}

/**
 * Test data factory for creating consistent test objects
 */
export class TestDataFactory {
    /**
     * Logic Step: Create mock project state for testing
     */
    public static createProjectState(overrides: Partial<ProjectState> = {}): ProjectState {
        const defaultState: ProjectState = {
            hasPRD: false,
            prdFiles: [],
            prdCount: 0,
            hasContextCards: false,
            contextCardFiles: [],
            contextCardCount: 0,
            hasContextTemplates: false,
            contextTemplateFiles: [],
            contextTemplateCount: 0,
            hasDataFlowDiagram: false,
            dataFlowDiagramFiles: [],
            hasComponentHierarchy: false,
            componentHierarchyFiles: [],
            hasCCS: false,
            ccsFiles: [],
            ccsCount: 0
        };
        return {
            ...defaultState,
            ...overrides
        };
    }

    /**
     * Logic Step: Create mock webview message for testing
     */
    public static createWebviewMessage(command: string, data: any = {}): any {
        return {
            command,
            ...data
        };
    }

    /**
     * Logic Step: Create mock VS Code configuration
     */
    public static createMockConfig(values: Record<string, any> = {}): any {
        const defaultConfig: Record<string, any> = {
            'aiPrdGenerator.openAiModel': 'gpt-4o',
            'aiPrdGenerator.prdOutput.prdPath': 'mise-en-place-output/prd',
            'aiPrdGenerator.contextCardOutput.contextCardPath': 'mise-en-place-output/context-cards',
            'aiPrdGenerator.contextTemplateOutput.contextTemplatePath': 'mise-en-place-output/context-templates'
        };

        return {
            get: sinon.stub().callsFake((key: string) => values[key] || defaultConfig[key]),
            update: sinon.stub(),
            inspect: sinon.stub()
        };
    }
}

/**
 * Test setup and teardown utilities
 */
export class TestSetup {
    /**
     * Logic Step: Setup common mocks before each test
     */
    public static beforeEach(): void {
        VSCodeMocks.resetAll();
        OpenAIMocks.reset();
        FileSystemMocks.reset();
    }

    /**
     * Logic Step: Cleanup after each test
     */
    public static afterEach(): void {
        sinon.restore();
    }

    /**
     * Logic Step: Setup integration test environment
     */
    public static setupIntegrationTest(): void {
        // Mock VS Code workspace
        VSCodeMocks.workspace.getConfiguration.returns(
            TestDataFactory.createMockConfig()
        );

        // Mock file system operations
        FileSystemMocks.ensureDir.resolves();
        FileSystemMocks.writeFile.resolves();
    }
}
