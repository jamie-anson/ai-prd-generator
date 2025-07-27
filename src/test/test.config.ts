/**
 * @ts-nocheck
 * Test Configuration for ai-prd-generator Extension
 * 
 * Logic: Centralized test configuration providing consistent settings
 * for all test types including timeouts, coverage, and environment setup.
 */

export interface TestConfig {
    timeouts: {
        unit: number;
        integration: number;
        extension: number;
        e2e: number;
    };
    coverage: {
        threshold: number;
        exclude: string[];
    };
    mocks: {
        vscode: boolean;
        openai: boolean;
        filesystem: boolean;
    };
}

export const testConfig: TestConfig = {
    timeouts: {
        unit: 5000,        // 5 seconds for unit tests
        integration: 15000, // 15 seconds for integration tests
        extension: 20000,   // 20 seconds for extension tests
        e2e: 30000         // 30 seconds for end-to-end tests
    },
    coverage: {
        threshold: 80,     // 80% coverage requirement
        exclude: [
            'src/test/**/*',
            'src/**/*.d.ts',
            'dist/**/*',
            'out/**/*'
        ]
    },
    mocks: {
        vscode: true,      // Mock VS Code API by default
        openai: true,      // Mock OpenAI API calls
        filesystem: true   // Mock file system operations
    }
};

export const testPaths = {
    unit: 'src/test/unit/**/*.test.ts',
    integration: 'src/test/integration/**/*.test.ts',
    extension: 'src/test/extension/**/*.test.ts',
    e2e: 'src/test/e2e/**/*.test.ts'
};
