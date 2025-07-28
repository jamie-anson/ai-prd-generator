/**
 * @ts-nocheck
 * Configuration Fixtures for Testing
 * 
 * Logic: Provides standardized configuration scenarios and mock configurations
 * for consistent testing across all configuration-dependent tests.
 */

import * as sinon from 'sinon';

/**
 * Standard configuration values for testing
 */
export class ConfigFixtures {
    /**
     * Logic Step: Default extension configuration
     */
    public static readonly DEFAULT_CONFIG = {
        'aiPrdGenerator.openAiModel': 'gpt-4o',
        'aiPrdGenerator.openAiApiKey': '',
        'aiPrdGenerator.prdOutput.prdPath': 'mise-en-place-output/prd',
        'aiPrdGenerator.contextCardOutput.contextCardPath': 'mise-en-place-output/context-cards',
        'aiPrdGenerator.contextTemplateOutput.contextTemplatePath': 'mise-en-place-output/context-templates',
        'aiPrdGenerator.diagramOutput.diagramPath': 'mise-en-place-output/diagrams',
        'aiPrdGenerator.ccsOutput.ccsPath': 'mise-en-place-output/ccs',
        'aiPrdGenerator.analysis.maxDepth': 3,
        'aiPrdGenerator.analysis.maxFiles': 100,
        'aiPrdGenerator.analysis.timeout': 30000,
        'aiPrdGenerator.ui.autoRefresh': true,
        'aiPrdGenerator.ui.showProgress': true
    };

    /**
     * Logic Step: Configuration with custom paths
     */
    public static readonly CUSTOM_PATHS_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.prdOutput.prdPath': 'custom/prd/output',
        'aiPrdGenerator.contextCardOutput.contextCardPath': 'custom/context-cards',
        'aiPrdGenerator.contextTemplateOutput.contextTemplatePath': 'custom/context-templates',
        'aiPrdGenerator.diagramOutput.diagramPath': 'custom/diagrams',
        'aiPrdGenerator.ccsOutput.ccsPath': 'custom/ccs'
    };

    /**
     * Logic Step: Configuration with API key set
     */
    public static readonly WITH_API_KEY_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.openAiApiKey': 'sk-test-api-key-1234567890abcdef'
    };

    /**
     * Logic Step: Configuration with performance optimizations
     */
    public static readonly PERFORMANCE_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.analysis.maxDepth': 5,
        'aiPrdGenerator.analysis.maxFiles': 500,
        'aiPrdGenerator.analysis.timeout': 60000,
        'aiPrdGenerator.openAiModel': 'gpt-4o-mini'
    };

    /**
     * Logic Step: Configuration with minimal settings
     */
    public static readonly MINIMAL_CONFIG = {
        'aiPrdGenerator.openAiModel': 'gpt-3.5-turbo',
        'aiPrdGenerator.prdOutput.prdPath': 'prd',
        'aiPrdGenerator.contextCardOutput.contextCardPath': 'context-cards',
        'aiPrdGenerator.contextTemplateOutput.contextTemplatePath': 'context-templates'
    };

    /**
     * Logic Step: Create custom configuration with overrides
     * @param overrides Configuration values to override
     * @returns Custom configuration object
     */
    public static createCustomConfig(overrides: Record<string, any> = {}): Record<string, any> {
        return {
            ...ConfigFixtures.DEFAULT_CONFIG,
            ...overrides
        };
    }

    /**
     * Logic Step: Get all standard configuration scenarios
     * @returns Array of configuration scenarios with labels
     */
    public static getAllScenarios(): Array<{ label: string; config: Record<string, any> }> {
        return [
            { label: 'Default Config', config: ConfigFixtures.DEFAULT_CONFIG },
            { label: 'Custom Paths Config', config: ConfigFixtures.CUSTOM_PATHS_CONFIG },
            { label: 'With API Key Config', config: ConfigFixtures.WITH_API_KEY_CONFIG },
            { label: 'Performance Config', config: ConfigFixtures.PERFORMANCE_CONFIG },
            { label: 'Minimal Config', config: ConfigFixtures.MINIMAL_CONFIG }
        ];
    }
}

/**
 * Mock VS Code configuration factory
 */
export class MockConfigFactory {
    /**
     * Logic Step: Create a mock VS Code configuration object
     * @param values Configuration values to return
     * @returns Mock configuration with get, update, and inspect methods
     */
    public static createMockConfig(values: Record<string, any> = {}): any {
        const configValues = {
            ...ConfigFixtures.DEFAULT_CONFIG,
            ...values
        };

        return {
            get: sinon.stub().callsFake((key: string, defaultValue?: any) => {
                return configValues[key] !== undefined ? configValues[key] : defaultValue;
            }),
            update: sinon.stub().callsFake((key: string, value: any) => {
                configValues[key] = value;
                return Promise.resolve();
            }),
            inspect: sinon.stub().callsFake((key: string) => ({
                key,
                defaultValue: configValues[key],
                globalValue: configValues[key],
                workspaceValue: undefined,
                workspaceFolderValue: undefined
            })),
            has: sinon.stub().callsFake((key: string) => key in configValues)
        };
    }

    /**
     * Logic Step: Create a mock configuration that throws errors
     * @param errorMessage Error message to throw
     * @returns Mock configuration that throws on access
     */
    public static createErrorConfig(errorMessage: string = 'Configuration error'): any {
        return {
            get: sinon.stub().throws(new Error(errorMessage)),
            update: sinon.stub().throws(new Error(errorMessage)),
            inspect: sinon.stub().throws(new Error(errorMessage)),
            has: sinon.stub().throws(new Error(errorMessage))
        };
    }

    /**
     * Logic Step: Create a mock configuration with partial failures
     * @param failingKeys Keys that should throw errors
     * @param values Working configuration values
     * @returns Mock configuration with selective failures
     */
    public static createPartialFailureConfig(
        failingKeys: string[], 
        values: Record<string, any> = {}
    ): any {
        const configValues = {
            ...ConfigFixtures.DEFAULT_CONFIG,
            ...values
        };

        return {
            get: sinon.stub().callsFake((key: string, defaultValue?: any) => {
                if (failingKeys.includes(key)) {
                    throw new Error(`Failed to read configuration key: ${key}`);
                }
                return configValues[key] !== undefined ? configValues[key] : defaultValue;
            }),
            update: sinon.stub().callsFake((key: string, value: any) => {
                if (failingKeys.includes(key)) {
                    throw new Error(`Failed to update configuration key: ${key}`);
                }
                configValues[key] = value;
                return Promise.resolve();
            }),
            inspect: sinon.stub().callsFake((key: string) => {
                if (failingKeys.includes(key)) {
                    throw new Error(`Failed to inspect configuration key: ${key}`);
                }
                return {
                    key,
                    defaultValue: configValues[key],
                    globalValue: configValues[key],
                    workspaceValue: undefined,
                    workspaceFolderValue: undefined
                };
            }),
            has: sinon.stub().callsFake((key: string) => {
                if (failingKeys.includes(key)) {
                    throw new Error(`Failed to check configuration key: ${key}`);
                }
                return key in configValues;
            })
        };
    }
}

/**
 * Configuration path fixtures for testing path resolution
 */
export class ConfigPathFixtures {
    /**
     * Logic Step: Standard output paths
     */
    public static readonly STANDARD_PATHS = {
        prdPath: 'mise-en-place-output/prd',
        contextCardPath: 'mise-en-place-output/context-cards',
        contextTemplatePath: 'mise-en-place-output/context-templates',
        diagramPath: 'mise-en-place-output/diagrams',
        ccsPath: 'mise-en-place-output/ccs'
    };

    /**
     * Logic Step: Absolute paths (edge case)
     */
    public static readonly ABSOLUTE_PATHS = {
        prdPath: '/absolute/path/to/prd',
        contextCardPath: '/absolute/path/to/context-cards',
        contextTemplatePath: '/absolute/path/to/context-templates',
        diagramPath: '/absolute/path/to/diagrams',
        ccsPath: '/absolute/path/to/ccs'
    };

    /**
     * Logic Step: Nested paths
     */
    public static readonly NESTED_PATHS = {
        prdPath: 'output/documents/prd/v1',
        contextCardPath: 'output/context/cards/generated',
        contextTemplatePath: 'output/context/templates/custom',
        diagramPath: 'output/visuals/diagrams/mermaid',
        ccsPath: 'output/analysis/ccs/reports'
    };

    /**
     * Logic Step: Single directory paths
     */
    public static readonly SINGLE_DIR_PATHS = {
        prdPath: 'prd',
        contextCardPath: 'cards',
        contextTemplatePath: 'templates',
        diagramPath: 'diagrams',
        ccsPath: 'ccs'
    };

    /**
     * Logic Step: Create custom path configuration
     * @param overrides Path overrides
     * @returns Custom path configuration
     */
    public static createCustomPaths(overrides: Partial<typeof ConfigPathFixtures.STANDARD_PATHS>) {
        return {
            ...ConfigPathFixtures.STANDARD_PATHS,
            ...overrides
        };
    }
}

/**
 * Environment-specific configuration fixtures
 */
export class EnvironmentConfigFixtures {
    /**
     * Logic Step: Development environment configuration
     */
    public static readonly DEVELOPMENT_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.analysis.timeout': 10000, // Shorter timeout for dev
        'aiPrdGenerator.ui.showProgress': true,
        'aiPrdGenerator.ui.autoRefresh': true,
        'aiPrdGenerator.openAiModel': 'gpt-4o-mini' // Cheaper model for dev
    };

    /**
     * Logic Step: Production environment configuration
     */
    public static readonly PRODUCTION_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.analysis.timeout': 60000, // Longer timeout for production
        'aiPrdGenerator.analysis.maxFiles': 1000,
        'aiPrdGenerator.analysis.maxDepth': 5,
        'aiPrdGenerator.openAiModel': 'gpt-4o' // Best model for production
    };

    /**
     * Logic Step: Testing environment configuration
     */
    public static readonly TESTING_CONFIG = {
        ...ConfigFixtures.DEFAULT_CONFIG,
        'aiPrdGenerator.analysis.timeout': 5000, // Very short timeout for tests
        'aiPrdGenerator.analysis.maxFiles': 10,
        'aiPrdGenerator.analysis.maxDepth': 2,
        'aiPrdGenerator.ui.showProgress': false, // No UI updates during tests
        'aiPrdGenerator.ui.autoRefresh': false
    };

    /**
     * Logic Step: Get environment-specific configuration
     * @param environment Environment name (development, production, testing)
     * @returns Environment-specific configuration
     */
    public static getEnvironmentConfig(environment: 'development' | 'production' | 'testing'): Record<string, any> {
        switch (environment) {
            case 'development':
                return EnvironmentConfigFixtures.DEVELOPMENT_CONFIG;
            case 'production':
                return EnvironmentConfigFixtures.PRODUCTION_CONFIG;
            case 'testing':
                return EnvironmentConfigFixtures.TESTING_CONFIG;
            default:
                return ConfigFixtures.DEFAULT_CONFIG;
        }
    }
}
