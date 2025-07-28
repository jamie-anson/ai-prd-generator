/**
 * @ts-nocheck
 * Mock Factories for Testing
 * 
 * Logic: Provides specialized mock factories organized by domain
 * for consistent and reusable mock creation across all test files.
 */

import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectState } from '../../webview/types';
import { ConfigFixtures, MockConfigFactory } from '../fixtures/configFixtures';
import { ProjectStateFixtures, FileSystemFixtures } from '../fixtures/projectFixtures';
import { OpenAIFixtures, MockOpenAIFactory } from '../fixtures/apiFixtures';

/**
 * VS Code API Mock Factory
 */
export class VSCodeMockFactory {
    /**
     * Logic Step: Create comprehensive VS Code workspace mock
     * @param options Configuration options for workspace mock
     * @returns Mock workspace object
     */
    public static createWorkspaceMock(options: {
        workspaceFolders?: any[];
        configuration?: Record<string, any>;
        findFilesResults?: Record<string, any[]>;
    } = {}): any {
        const workspaceFolders = options.workspaceFolders || [
            { uri: { fsPath: '/test/workspace' }, name: 'test-workspace', index: 0 }
        ];

        const configuration = MockConfigFactory.createMockConfig(options.configuration);

        const findFilesStub = sinon.stub();
        if (options.findFilesResults) {
            Object.entries(options.findFilesResults).forEach(([pattern, results]) => {
                findFilesStub.withArgs(pattern).resolves(results);
            });
        } else {
            findFilesStub.resolves([]);
        }

        return {
            workspaceFolders,
            getConfiguration: sinon.stub().returns(configuration),
            findFiles: findFilesStub,
            onDidChangeConfiguration: sinon.stub().returns({ dispose: sinon.stub() }),
            onDidChangeWorkspaceFolders: sinon.stub().returns({ dispose: sinon.stub() }),
            getWorkspaceFolder: sinon.stub().callsFake((uri: any) => {
                return workspaceFolders.find(folder => 
                    uri.fsPath.startsWith(folder.uri.fsPath)
                );
            }),
            asRelativePath: sinon.stub().callsFake((path: string) => {
                const workspaceRoot = workspaceFolders[0]?.uri.fsPath || '/test/workspace';
                return path.replace(workspaceRoot + '/', '');
            })
        };
    }

    /**
     * Logic Step: Create VS Code window mock
     * @param options Configuration options for window mock
     * @returns Mock window object
     */
    public static createWindowMock(options: {
        showInformationMessage?: sinon.SinonStub;
        showErrorMessage?: sinon.SinonStub;
        showWarningMessage?: sinon.SinonStub;
        withProgress?: sinon.SinonStub;
        createWebviewPanel?: sinon.SinonStub;
    } = {}): any {
        return {
            showInformationMessage: options.showInformationMessage || sinon.stub().resolves(),
            showErrorMessage: options.showErrorMessage || sinon.stub().resolves(),
            showWarningMessage: options.showWarningMessage || sinon.stub().resolves(),
            withProgress: options.withProgress || sinon.stub().callsFake(async (options, task) => {
                const progress = {
                    report: sinon.stub()
                };
                return await task(progress, { isCancellationRequested: false });
            }),
            createWebviewPanel: options.createWebviewPanel || sinon.stub().returns(
                this.createWebviewPanelMock()
            ),
            showQuickPick: sinon.stub().resolves(),
            showInputBox: sinon.stub().resolves(),
            showOpenDialog: sinon.stub().resolves(),
            showSaveDialog: sinon.stub().resolves(),
            setStatusBarMessage: sinon.stub().returns({ dispose: sinon.stub() }),
            createStatusBarItem: sinon.stub().returns({
                text: '',
                tooltip: '',
                show: sinon.stub(),
                hide: sinon.stub(),
                dispose: sinon.stub()
            })
        };
    }

    /**
     * Logic Step: Create VS Code commands mock
     * @param registeredCommands Optional map of command IDs to handlers
     * @returns Mock commands object
     */
    public static createCommandsMock(registeredCommands: Map<string, Function> = new Map()): any {
        const executeCommandStub = sinon.stub();
        
        // Set up command execution simulation
        registeredCommands.forEach((handler, commandId) => {
            executeCommandStub.withArgs(commandId).callsFake(handler as any);
        });

        return {
            registerCommand: sinon.stub().callsFake((commandId: string, handler: (...args: any[]) => any) => {
                registeredCommands.set(commandId, handler);
                return { dispose: sinon.stub() };
            }),
            executeCommand: executeCommandStub,
            getCommands: sinon.stub().resolves(Array.from(registeredCommands.keys()))
        };
    }

    /**
     * Logic Step: Create VS Code Uri mock
     * @returns Mock Uri object with common methods
     */
    public static createUriMock(): any {
        return {
            file: sinon.stub().callsFake((path: string) => ({
                fsPath: path,
                scheme: 'file',
                authority: '',
                path: path,
                query: '',
                fragment: '',
                toString: () => `file://${path}`,
                toJSON: () => ({ fsPath: path, scheme: 'file' })
            })),
            parse: sinon.stub().callsFake((uri: string) => {
                const url = new URL(uri);
                return {
                    fsPath: url.pathname,
                    scheme: url.protocol.replace(':', ''),
                    authority: url.hostname,
                    path: url.pathname,
                    query: url.search.replace('?', ''),
                    fragment: url.hash.replace('#', ''),
                    toString: () => uri
                };
            }),
            joinPath: sinon.stub().callsFake((base: any, ...paths: string[]) => {
                const joinedPath = [base.fsPath, ...paths].join('/').replace(/\/+/g, '/');
                return {
                    fsPath: joinedPath,
                    scheme: base.scheme || 'file',
                    authority: base.authority || '',
                    path: joinedPath,
                    query: base.query || '',
                    fragment: base.fragment || '',
                    toString: () => `${base.scheme || 'file'}://${joinedPath}`
                };
            })
        };
    }

    /**
     * Logic Step: Create VS Code webview panel mock
     * @param options Configuration options for webview panel
     * @returns Mock webview panel
     */
    public static createWebviewPanelMock(options: {
        viewType?: string;
        title?: string;
        viewColumn?: vscode.ViewColumn;
        webviewOptions?: any;
    } = {}): any {
        const webview = this.createWebviewMock();

        return {
            webview,
            viewType: options.viewType || 'test-webview',
            title: options.title || 'Test Webview',
            viewColumn: options.viewColumn || vscode.ViewColumn.One,
            active: true,
            visible: true,
            options: options.webviewOptions || {},
            onDidDispose: sinon.stub().returns({ dispose: sinon.stub() }),
            onDidChangeViewState: sinon.stub().returns({ dispose: sinon.stub() }),
            dispose: sinon.stub(),
            reveal: sinon.stub()
        };
    }

    /**
     * Logic Step: Create VS Code webview mock
     * @param options Configuration options for webview
     * @returns Mock webview
     */
    public static createWebviewMock(options: {
        html?: string;
        cspSource?: string;
        onDidReceiveMessage?: sinon.SinonStub;
    } = {}): any {
        return {
            html: options.html || '',
            options: {
                enableScripts: true,
                enableForms: false,
                localResourceRoots: []
            },
            cspSource: options.cspSource || 'vscode-webview:',
            onDidReceiveMessage: options.onDidReceiveMessage || sinon.stub().returns({ dispose: sinon.stub() }),
            postMessage: sinon.stub().resolves(true),
            asWebviewUri: sinon.stub().callsFake((uri: any) => ({
                ...uri,
                scheme: 'vscode-webview',
                toString: () => `vscode-webview://${uri.fsPath}`
            }))
        };
    }

    /**
     * Logic Step: Create VS Code extension context mock
     * @param options Configuration options for extension context
     * @returns Mock extension context
     */
    public static createExtensionContextMock(options: {
        extensionPath?: string;
        globalState?: Map<string, any>;
        workspaceState?: Map<string, any>;
        secrets?: Map<string, string>;
    } = {}): any {
        const globalState = options.globalState || new Map();
        const workspaceState = options.workspaceState || new Map();
        const secrets = options.secrets || new Map();

        return {
            subscriptions: [],
            extensionPath: options.extensionPath || '/test/extension/path',
            extensionUri: {
                fsPath: options.extensionPath || '/test/extension/path',
                scheme: 'file'
            },
            globalState: {
                get: sinon.stub().callsFake((key: string, defaultValue?: any) => 
                    globalState.get(key) ?? defaultValue
                ),
                update: sinon.stub().callsFake((key: string, value: any) => {
                    globalState.set(key, value);
                    return Promise.resolve();
                }),
                keys: sinon.stub().returns(Array.from(globalState.keys())),
                setKeysForSync: sinon.stub()
            },
            workspaceState: {
                get: sinon.stub().callsFake((key: string, defaultValue?: any) => 
                    workspaceState.get(key) ?? defaultValue
                ),
                update: sinon.stub().callsFake((key: string, value: any) => {
                    workspaceState.set(key, value);
                    return Promise.resolve();
                }),
                keys: sinon.stub().returns(Array.from(workspaceState.keys()))
            },
            secrets: {
                get: sinon.stub().callsFake((key: string) => 
                    Promise.resolve(secrets.get(key))
                ),
                store: sinon.stub().callsFake((key: string, value: string) => {
                    secrets.set(key, value);
                    return Promise.resolve();
                }),
                delete: sinon.stub().callsFake((key: string) => {
                    secrets.delete(key);
                    return Promise.resolve();
                }),
                onDidChange: sinon.stub().returns({ dispose: sinon.stub() })
            },
            asAbsolutePath: sinon.stub().callsFake((relativePath: string) => 
                `${options.extensionPath || '/test/extension/path'}/${relativePath}`
            ),
            environmentVariableCollection: {
                replace: sinon.stub(),
                append: sinon.stub(),
                prepend: sinon.stub(),
                get: sinon.stub(),
                forEach: sinon.stub(),
                delete: sinon.stub(),
                clear: sinon.stub(),
                getScoped: sinon.stub()
            }
        };
    }
}

/**
 * File System Mock Factory
 */
export class FileSystemMockFactory {
    /**
     * Logic Step: Create file system mock with project state
     * @param projectState Project state to simulate
     * @returns Mock file system operations
     */
    public static createProjectStateMock(projectState: ProjectState): any {
        const fileSystemStructure = FileSystemFixtures.generateFileSystemMock(projectState);

        return {
            readFile: sinon.stub().callsFake(async (path: string) => {
                const fileName = path.split('/').pop() || '';
                if (fileName.endsWith('.md')) {
                    return Buffer.from(`# Mock Content for ${fileName}\n\nThis is mock file content.`);
                }
                throw new Error(`File not found: ${path}`);
            }),
            writeFile: sinon.stub().resolves(),
            ensureDir: sinon.stub().resolves(),
            pathExists: sinon.stub().callsFake(async (path: string) => {
                return Object.keys(fileSystemStructure).some(dir => path.startsWith(dir));
            }),
            readdir: sinon.stub().callsFake(async (path: string) => {
                return fileSystemStructure[path] || [];
            }),
            stat: sinon.stub().callsFake(async (path: string) => ({
                isDirectory: () => Object.keys(fileSystemStructure).includes(path),
                isFile: () => !Object.keys(fileSystemStructure).includes(path),
                size: 1024,
                mtime: new Date(),
                ctime: new Date()
            })),
            copy: sinon.stub().resolves(),
            move: sinon.stub().resolves(),
            remove: sinon.stub().resolves()
        };
    }

    /**
     * Logic Step: Create file system mock that throws errors
     * @param errorType Type of error to simulate
     * @returns Mock file system that throws errors
     */
    public static createErrorMock(errorType: 'permission' | 'notfound' | 'network' = 'permission'): any {
        const createError = () => {
            switch (errorType) {
                case 'permission':
                    return Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
                case 'notfound':
                    return Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
                case 'network':
                    return Object.assign(new Error('ENETUNREACH: network is unreachable'), { code: 'ENETUNREACH' });
                default:
                    return new Error('File system error');
            }
        };

        return {
            readFile: sinon.stub().rejects(createError()),
            writeFile: sinon.stub().rejects(createError()),
            ensureDir: sinon.stub().rejects(createError()),
            pathExists: sinon.stub().rejects(createError()),
            readdir: sinon.stub().rejects(createError()),
            stat: sinon.stub().rejects(createError()),
            copy: sinon.stub().rejects(createError()),
            move: sinon.stub().rejects(createError()),
            remove: sinon.stub().rejects(createError())
        };
    }

    /**
     * Logic Step: Create file system mock with performance simulation
     * @param delays Delays in milliseconds for different operations
     * @returns Mock file system with realistic delays
     */
    public static createPerformanceMock(delays: {
        read?: number;
        write?: number;
        scan?: number;
    } = {}): any {
        const defaultDelays = { read: 10, write: 50, scan: 100, ...delays };

        const createDelayedStub = (delay: number, result: any = undefined) => {
            return sinon.stub().callsFake(async (...args: any[]) => {
                await new Promise(resolve => setTimeout(resolve, delay));
                return result;
            });
        };

        return {
            readFile: createDelayedStub(defaultDelays.read, Buffer.from('mock content')),
            writeFile: createDelayedStub(defaultDelays.write),
            ensureDir: createDelayedStub(defaultDelays.write),
            pathExists: createDelayedStub(defaultDelays.scan, true),
            readdir: createDelayedStub(defaultDelays.scan, []),
            stat: createDelayedStub(defaultDelays.scan, {
                isDirectory: () => false,
                isFile: () => true,
                size: 1024,
                mtime: new Date(),
                ctime: new Date()
            }),
            copy: createDelayedStub(defaultDelays.write),
            move: createDelayedStub(defaultDelays.write),
            remove: createDelayedStub(defaultDelays.write)
        };
    }
}

/**
 * OpenAI API Mock Factory
 */
export class OpenAIMockFactory {
    /**
     * Logic Step: Create OpenAI mock for specific generation type
     * @param generationType Type of generation (prd, context, ccs)
     * @param scenario Success/failure scenario
     * @returns Mock OpenAI API
     */
    public static createGenerationMock(
        generationType: 'prd' | 'context' | 'ccs',
        scenario: 'success' | 'auth_error' | 'rate_limit' | 'timeout' = 'success'
    ): any {
        const responses = {
            prd: OpenAIFixtures.PRD_GENERATION_SUCCESS,
            context: OpenAIFixtures.CONTEXT_CARD_SUCCESS,
            ccs: OpenAIFixtures.CCS_ANALYSIS_SUCCESS
        };

        switch (scenario) {
            case 'success':
                return MockOpenAIFactory.createSuccessfulMock([responses[generationType]]);
            case 'auth_error':
                return MockOpenAIFactory.createFailingMock(OpenAIFixtures.AUTH_ERROR);
            case 'rate_limit':
                return MockOpenAIFactory.createRateLimitedMock(2);
            case 'timeout':
                return MockOpenAIFactory.createTimeoutMock(1000);
            default:
                return MockOpenAIFactory.createSuccessfulMock([responses[generationType]]);
        }
    }

    /**
     * Logic Step: Create OpenAI mock with custom responses
     * @param responses Array of custom responses
     * @param errors Array of errors to throw
     * @param pattern Pattern of success/failure
     * @returns Mock OpenAI API with custom behavior
     */
    public static createCustomMock(
        responses: any[] = [OpenAIFixtures.PRD_GENERATION_SUCCESS],
        errors: any[] = [OpenAIFixtures.RATE_LIMIT_ERROR],
        pattern: boolean[] = [true]
    ): any {
        return MockOpenAIFactory.createMixedMock(responses, errors, pattern);
    }

    /**
     * Logic Step: Create OpenAI mock that simulates quota management
     * @param quotaLimit Number of successful requests before quota error
     * @returns Mock OpenAI API with quota simulation
     */
    public static createQuotaMock(quotaLimit: number = 5): any {
        let requestCount = 0;

        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        requestCount++;
                        
                        if (requestCount > quotaLimit) {
                            throw OpenAIFixtures.QUOTA_ERROR;
                        }
                        
                        return OpenAIFixtures.PRD_GENERATION_SUCCESS;
                    })
                }
            }
        };
    }
}

/**
 * Project State Mock Factory
 */
export class ProjectStateMockFactory {
    /**
     * Logic Step: Create project state detector mock
     * @param projectState Project state to return
     * @param shouldThrow Whether to throw an error
     * @returns Mock project state detector
     */
    public static createDetectorMock(
        projectState: ProjectState = ProjectStateFixtures.EMPTY_PROJECT,
        shouldThrow: boolean = false
    ): any {
        const detectStub = sinon.stub();
        
        if (shouldThrow) {
            detectStub.rejects(new Error('Project state detection failed'));
        } else {
            detectStub.resolves(projectState);
        }

        return {
            detectProjectState: detectStub,
            findPRDFiles: sinon.stub().resolves(projectState.prdFiles.map(path => ({ fsPath: path }))),
            findContextCardFiles: sinon.stub().resolves(projectState.contextCardFiles.map(path => ({ fsPath: path }))),
            findContextTemplateFiles: sinon.stub().resolves(projectState.contextTemplateFiles.map(path => ({ fsPath: path }))),
            findCCSFiles: sinon.stub().resolves(projectState.ccsFiles.map(path => ({ fsPath: path }))),
            checkDiagramExists: sinon.stub().callsFake(async (type: string) => {
                return type === 'data-flow' ? projectState.hasDataFlowDiagram : projectState.hasComponentHierarchy;
            })
        };
    }

    /**
     * Logic Step: Create project state mock that evolves over time
     * @param states Array of project states to return in sequence
     * @returns Mock that returns different states on subsequent calls
     */
    public static createEvolvingMock(states: ProjectState[]): any {
        let callCount = 0;

        return {
            detectProjectState: sinon.stub().callsFake(async () => {
                const state = states[callCount % states.length];
                callCount++;
                return state;
            })
        };
    }
}

/**
 * Configuration Mock Factory
 */
export class ConfigMockFactory {
    /**
     * Logic Step: Create configuration mock for specific environment
     * @param environment Environment type (development, production, testing)
     * @param overrides Configuration overrides
     * @returns Mock configuration
     */
    public static createEnvironmentMock(
        environment: 'development' | 'production' | 'testing',
        overrides: Record<string, any> = {}
    ): any {
        const baseConfig = {
            development: ConfigFixtures.DEFAULT_CONFIG,
            production: ConfigFixtures.DEFAULT_CONFIG,
            testing: {
                ...ConfigFixtures.DEFAULT_CONFIG,
                'aiPrdGenerator.analysis.timeout': 5000,
                'aiPrdGenerator.analysis.maxFiles': 10
            }
        };

        return MockConfigFactory.createMockConfig({
            ...baseConfig[environment],
            ...overrides
        });
    }

    /**
     * Logic Step: Create configuration mock with validation
     * @param validationRules Rules for configuration validation
     * @returns Mock configuration with validation
     */
    public static createValidatedMock(validationRules: {
        requiredKeys?: string[];
        pathKeys?: string[];
        numericKeys?: string[];
    } = {}): any {
        const config = MockConfigFactory.createMockConfig();

        // Override get method to include validation
        const originalGet = config.get;
        config.get = sinon.stub().callsFake((key: string, defaultValue?: any) => {
            const value = originalGet(key, defaultValue);

            // Validate required keys
            if (validationRules.requiredKeys?.includes(key) && !value) {
                throw new Error(`Required configuration key missing: ${key}`);
            }

            // Validate path keys
            if (validationRules.pathKeys?.includes(key) && typeof value !== 'string') {
                throw new Error(`Configuration key ${key} must be a string path`);
            }

            // Validate numeric keys
            if (validationRules.numericKeys?.includes(key) && typeof value !== 'number') {
                throw new Error(`Configuration key ${key} must be a number`);
            }

            return value;
        });

        return config;
    }
}

/**
 * Integration Mock Factory
 */
export class IntegrationMockFactory {
    /**
     * Logic Step: Create complete integration test environment
     * @param scenario Integration test scenario
     * @returns Complete mock environment
     */
    public static createIntegrationEnvironment(scenario: {
        projectState?: ProjectState;
        hasApiKey?: boolean;
        openAIScenario?: 'success' | 'auth_error' | 'rate_limit' | 'timeout';
        fileSystemScenario?: 'success' | 'permission_error' | 'not_found';
        configOverrides?: Record<string, any>;
    } = {}): {
        vscode: any;
        fileSystem: any;
        openAI: any;
        projectStateDetector: any;
        configuration: any;
    } {
        const projectState = scenario.projectState || ProjectStateFixtures.EMPTY_PROJECT;
        
        return {
            vscode: {
                workspace: VSCodeMockFactory.createWorkspaceMock({
                    configuration: scenario.configOverrides
                }),
                window: VSCodeMockFactory.createWindowMock(),
                commands: VSCodeMockFactory.createCommandsMock(),
                Uri: VSCodeMockFactory.createUriMock()
            },
            fileSystem: scenario.fileSystemScenario === 'success' 
                ? FileSystemMockFactory.createProjectStateMock(projectState)
                : FileSystemMockFactory.createErrorMock(
                    scenario.fileSystemScenario === 'permission_error' ? 'permission' : 'notfound'
                ),
            openAI: OpenAIMockFactory.createGenerationMock('prd', scenario.openAIScenario),
            projectStateDetector: ProjectStateMockFactory.createDetectorMock(projectState),
            configuration: ConfigMockFactory.createEnvironmentMock('testing', scenario.configOverrides)
        };
    }
}
