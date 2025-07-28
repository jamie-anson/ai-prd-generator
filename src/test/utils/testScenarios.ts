/**
 * @ts-nocheck
 * Test Scenario Builders
 * 
 * Logic: Provides end-to-end test scenario builders that combine
 * fixtures, mocks, and assertions for comprehensive testing workflows.
 */

import { ProjectState } from '../../webview/types';
import { ProjectStateFixtures } from '../fixtures/projectFixtures';
import { ConfigFixtures } from '../fixtures/configFixtures';
import { OpenAIFixtures } from '../fixtures/apiFixtures';
import { VSCodeMockFactory, FileSystemMockFactory, OpenAIMockFactory, ProjectStateMockFactory } from './mockFactories';
import { WebviewTestManager, UIStateTestUtils } from './webviewTestUtils';
import { ProjectStateAssertions, DOMAssertions, APIAssertions } from './assertionHelpers';

/**
 * End-to-End Test Scenario Builder
 */
export class TestScenarioBuilder {
    private scenario: {
        name: string;
        projectState: ProjectState;
        hasApiKey: boolean;
        openAIBehavior: 'success' | 'auth_error' | 'rate_limit' | 'timeout';
        fileSystemBehavior: 'success' | 'permission_error' | 'not_found';
        configOverrides: Record<string, any>;
        expectedUIState: any;
        expectedErrors: string[];
        performanceExpectations: {
            maxResponseTime?: number;
            maxDOMUpdateTime?: number;
        };
    };

    constructor(name: string) {
        this.scenario = {
            name,
            projectState: ProjectStateFixtures.EMPTY_PROJECT,
            hasApiKey: false,
            openAIBehavior: 'success',
            fileSystemBehavior: 'success',
            configOverrides: {},
            expectedUIState: {},
            expectedErrors: [],
            performanceExpectations: {}
        };
    }

    /**
     * Logic Step: Set project state for scenario
     */
    public withProjectState(projectState: ProjectState): TestScenarioBuilder {
        this.scenario.projectState = projectState;
        return this;
    }

    /**
     * Logic Step: Set API key availability
     */
    public withAPIKey(hasApiKey: boolean = true): TestScenarioBuilder {
        this.scenario.hasApiKey = hasApiKey;
        return this;
    }

    /**
     * Logic Step: Set OpenAI API behavior
     */
    public withOpenAIBehavior(behavior: 'success' | 'auth_error' | 'rate_limit' | 'timeout'): TestScenarioBuilder {
        this.scenario.openAIBehavior = behavior;
        return this;
    }

    /**
     * Logic Step: Set file system behavior
     */
    public withFileSystemBehavior(behavior: 'success' | 'permission_error' | 'not_found'): TestScenarioBuilder {
        this.scenario.fileSystemBehavior = behavior;
        return this;
    }

    /**
     * Logic Step: Set configuration overrides
     */
    public withConfigOverrides(overrides: Record<string, any>): TestScenarioBuilder {
        this.scenario.configOverrides = { ...this.scenario.configOverrides, ...overrides };
        return this;
    }

    /**
     * Logic Step: Set expected UI state
     */
    public expectUIState(uiState: {
        apiKeyVisible?: boolean;
        apiKeyInputVisible?: boolean;
        generationControlsVisible?: boolean;
        postGenerationControlsVisible?: boolean;
        contextSectionsVisible?: boolean;
        errorVisible?: boolean;
        progressVisible?: boolean;
    }): TestScenarioBuilder {
        this.scenario.expectedUIState = uiState;
        return this;
    }

    /**
     * Logic Step: Set expected errors
     */
    public expectErrors(errors: string[]): TestScenarioBuilder {
        this.scenario.expectedErrors = errors;
        return this;
    }

    /**
     * Logic Step: Set performance expectations
     */
    public expectPerformance(expectations: {
        maxResponseTime?: number;
        maxDOMUpdateTime?: number;
    }): TestScenarioBuilder {
        this.scenario.performanceExpectations = expectations;
        return this;
    }

    /**
     * Logic Step: Build and execute the test scenario
     */
    public async execute(): Promise<TestScenarioResult> {
        const startTime = performance.now();
        const result: TestScenarioResult = {
            scenarioName: this.scenario.name,
            success: false,
            executionTime: 0,
            errors: [],
            assertions: {
                projectState: false,
                uiState: false,
                apiResponse: false,
                performance: false
            },
            metrics: {}
        };

        try {
            // Create mock environment
            const mocks = this.createMockEnvironment();
            
            // Execute scenario steps
            await this.executeScenarioSteps(mocks, result);
            
            // Validate results
            this.validateResults(result);
            
            result.success = result.errors.length === 0;
        } catch (error) {
            result.errors.push(`Scenario execution failed: ${error.message}`);
        } finally {
            result.executionTime = performance.now() - startTime;
        }

        return result;
    }

    /**
     * Logic Step: Create mock environment for scenario
     */
    private createMockEnvironment(): any {
        const configWithApiKey = this.scenario.hasApiKey 
            ? { ...this.scenario.configOverrides, 'aiPrdGenerator.openAiApiKey': 'sk-test-key' }
            : this.scenario.configOverrides;

        return {
            vscode: {
                workspace: VSCodeMockFactory.createWorkspaceMock({
                    configuration: configWithApiKey
                }),
                window: VSCodeMockFactory.createWindowMock(),
                commands: VSCodeMockFactory.createCommandsMock(),
                Uri: VSCodeMockFactory.createUriMock()
            },
            fileSystem: this.scenario.fileSystemBehavior === 'success'
                ? FileSystemMockFactory.createProjectStateMock(this.scenario.projectState)
                : FileSystemMockFactory.createErrorMock(
                    this.scenario.fileSystemBehavior === 'permission_error' ? 'permission' : 'notfound'
                ),
            openAI: OpenAIMockFactory.createGenerationMock('prd', this.scenario.openAIBehavior),
            projectStateDetector: ProjectStateMockFactory.createDetectorMock(this.scenario.projectState),
            webviewManager: new WebviewTestManager()
        };
    }

    /**
     * Logic Step: Execute scenario steps
     */
    private async executeScenarioSteps(mocks: any, result: TestScenarioResult): Promise<void> {
        // Step 1: Initialize webview
        mocks.webviewManager.setup({
            projectState: {
                hasApiKey: this.scenario.hasApiKey,
                hasPRD: this.scenario.projectState.hasPRD,
                hasContextCards: this.scenario.projectState.hasContextCards,
                hasContextTemplates: this.scenario.projectState.hasContextTemplates,
                hasCCS: this.scenario.projectState.hasCCS
            }
        });

        // Step 2: Test project state detection
        try {
            const detectedState = await mocks.projectStateDetector.detectProjectState();
            ProjectStateAssertions.assertValidProjectState(detectedState, 'Detected project state');
            result.assertions.projectState = true;
        } catch (error) {
            result.errors.push(`Project state assertion failed: ${error.message}`);
        }

        // Step 3: Test UI state
        try {
            this.validateUIState(mocks.webviewManager, result);
            result.assertions.uiState = true;
        } catch (error) {
            result.errors.push(`UI state assertion failed: ${error.message}`);
        }

        // Step 4: Test API interactions (if applicable)
        if (this.scenario.openAIBehavior !== 'auth_error') {
            try {
                const response = await mocks.openAI.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: 'test' }]
                });
                APIAssertions.assertValidOpenAIResponse(response, 'OpenAI response');
                result.assertions.apiResponse = true;
            } catch (error) {
                if (this.scenario.expectedErrors.some(expectedError => error.message.includes(expectedError))) {
                    result.assertions.apiResponse = true; // Expected error
                } else {
                    result.errors.push(`API assertion failed: ${error.message}`);
                }
            }
        }

        // Step 5: Test performance expectations
        if (this.scenario.performanceExpectations.maxDOMUpdateTime) {
            try {
                this.validatePerformance(mocks.webviewManager, result);
                result.assertions.performance = true;
            } catch (error) {
                result.errors.push(`Performance assertion failed: ${error.message}`);
            }
        } else {
            result.assertions.performance = true; // No performance expectations
        }

        // Cleanup
        mocks.webviewManager.teardown();
    }

    /**
     * Logic Step: Validate UI state matches expectations
     */
    private validateUIState(webviewManager: WebviewTestManager, result: TestScenarioResult): void {
        const document = webviewManager.getDocument();
        const expectedUI = this.scenario.expectedUIState;

        if (expectedUI.apiKeyVisible !== undefined) {
            const apiKeyDisplay = document.getElementById('api-key-display');
            if (expectedUI.apiKeyVisible) {
                DOMAssertions.assertElementVisible(apiKeyDisplay, 'API key display');
            } else {
                DOMAssertions.assertElementHidden(apiKeyDisplay, 'API key display');
            }
        }

        if (expectedUI.generationControlsVisible !== undefined) {
            const generationControls = document.getElementById('generation-controls');
            if (expectedUI.generationControlsVisible) {
                DOMAssertions.assertElementVisible(generationControls, 'Generation controls');
            } else {
                DOMAssertions.assertElementHidden(generationControls, 'Generation controls');
            }
        }

        if (expectedUI.postGenerationControlsVisible !== undefined) {
            const postGenerationControls = document.getElementById('post-generation-controls');
            if (expectedUI.postGenerationControlsVisible) {
                DOMAssertions.assertElementVisible(postGenerationControls, 'Post-generation controls');
            } else {
                DOMAssertions.assertElementHidden(postGenerationControls, 'Post-generation controls');
            }
        }
    }

    /**
     * Logic Step: Validate performance meets expectations
     */
    private validatePerformance(webviewManager: WebviewTestManager, result: TestScenarioResult): void {
        const expectations = this.scenario.performanceExpectations;

        if (expectations.maxDOMUpdateTime) {
            const updateTime = this.measureDOMUpdatePerformance(webviewManager);
            result.metrics.domUpdateTime = updateTime;

            if (updateTime > expectations.maxDOMUpdateTime) {
                throw new Error(`DOM update time ${updateTime}ms exceeds maximum ${expectations.maxDOMUpdateTime}ms`);
            }
        }
    }

    /**
     * Logic Step: Measure DOM update performance
     */
    private measureDOMUpdatePerformance(webviewManager: WebviewTestManager): number {
        const startTime = performance.now();
        
        // Simulate typical DOM updates
        webviewManager.simulateAPIKeySet();
        webviewManager.simulatePRDGenerated();
        webviewManager.simulateProgress('Testing...', 50);
        
        return performance.now() - startTime;
    }

    /**
     * Logic Step: Validate overall results
     */
    private validateResults(result: TestScenarioResult): void {
        // Check if all expected errors occurred
        for (const expectedError of this.scenario.expectedErrors) {
            const errorFound = result.errors.some(error => error.includes(expectedError));
            if (!errorFound) {
                result.errors.push(`Expected error not found: ${expectedError}`);
            }
        }
    }
}

/**
 * Test Scenario Result Interface
 */
export interface TestScenarioResult {
    scenarioName: string;
    success: boolean;
    executionTime: number;
    errors: string[];
    assertions: {
        projectState: boolean;
        uiState: boolean;
        apiResponse: boolean;
        performance: boolean;
    };
    metrics: {
        domUpdateTime?: number;
        apiResponseTime?: number;
        projectStateDetectionTime?: number;
    };
}

/**
 * Predefined Test Scenarios
 */
export class PredefinedScenarios {
    /**
     * Logic Step: New user first-time experience scenario
     */
    public static newUserExperience(): TestScenarioBuilder {
        return new TestScenarioBuilder('New User Experience')
            .withProjectState(ProjectStateFixtures.EMPTY_PROJECT)
            .withAPIKey(false)
            .withOpenAIBehavior('success')
            .withFileSystemBehavior('success')
            .expectUIState({
                apiKeyVisible: false,
                apiKeyInputVisible: true,
                generationControlsVisible: true,
                postGenerationControlsVisible: false,
                contextSectionsVisible: false
            })
            .expectPerformance({
                maxDOMUpdateTime: 100
            });
    }

    /**
     * Logic Step: Experienced user with existing project scenario
     */
    public static experiencedUserExperience(): TestScenarioBuilder {
        return new TestScenarioBuilder('Experienced User Experience')
            .withProjectState(ProjectStateFixtures.COMPLETE_PROJECT)
            .withAPIKey(true)
            .withOpenAIBehavior('success')
            .withFileSystemBehavior('success')
            .expectUIState({
                apiKeyVisible: true,
                apiKeyInputVisible: false,
                generationControlsVisible: false,
                postGenerationControlsVisible: true,
                contextSectionsVisible: true
            })
            .expectPerformance({
                maxDOMUpdateTime: 100
            });
    }

    /**
     * Logic Step: API key authentication error scenario
     */
    public static authenticationError(): TestScenarioBuilder {
        return new TestScenarioBuilder('Authentication Error')
            .withProjectState(ProjectStateFixtures.EMPTY_PROJECT)
            .withAPIKey(true)
            .withOpenAIBehavior('auth_error')
            .withFileSystemBehavior('success')
            .expectErrors(['Invalid API key provided'])
            .expectUIState({
                errorVisible: true
            });
    }

    /**
     * Logic Step: Rate limiting scenario
     */
    public static rateLimitingScenario(): TestScenarioBuilder {
        return new TestScenarioBuilder('Rate Limiting')
            .withProjectState(ProjectStateFixtures.PRD_ONLY_PROJECT)
            .withAPIKey(true)
            .withOpenAIBehavior('rate_limit')
            .withFileSystemBehavior('success')
            .expectErrors(['Rate limit reached'])
            .expectPerformance({
                maxResponseTime: 5000 // Allow time for retries
            });
    }

    /**
     * Logic Step: File system permission error scenario
     */
    public static fileSystemError(): TestScenarioBuilder {
        return new TestScenarioBuilder('File System Error')
            .withProjectState(ProjectStateFixtures.EMPTY_PROJECT)
            .withAPIKey(true)
            .withOpenAIBehavior('success')
            .withFileSystemBehavior('permission_error')
            .expectErrors(['permission denied']);
    }

    /**
     * Logic Step: Performance stress test scenario
     */
    public static performanceStressTest(): TestScenarioBuilder {
        return new TestScenarioBuilder('Performance Stress Test')
            .withProjectState(ProjectStateFixtures.COMPLETE_PROJECT)
            .withAPIKey(true)
            .withOpenAIBehavior('success')
            .withFileSystemBehavior('success')
            .withConfigOverrides({
                'aiPrdGenerator.analysis.maxFiles': 1000,
                'aiPrdGenerator.analysis.maxDepth': 10
            })
            .expectPerformance({
                maxDOMUpdateTime: 200,
                maxResponseTime: 10000
            });
    }

    /**
     * Logic Step: Get all predefined scenarios
     */
    public static getAllScenarios(): TestScenarioBuilder[] {
        return [
            this.newUserExperience(),
            this.experiencedUserExperience(),
            this.authenticationError(),
            this.rateLimitingScenario(),
            this.fileSystemError(),
            this.performanceStressTest()
        ];
    }
}

/**
 * Scenario Test Runner
 */
export class ScenarioTestRunner {
    private results: TestScenarioResult[] = [];

    /**
     * Logic Step: Run a single scenario
     */
    public async runScenario(scenario: TestScenarioBuilder): Promise<TestScenarioResult> {
        const result = await scenario.execute();
        this.results.push(result);
        return result;
    }

    /**
     * Logic Step: Run multiple scenarios
     */
    public async runScenarios(scenarios: TestScenarioBuilder[]): Promise<TestScenarioResult[]> {
        const results: TestScenarioResult[] = [];
        
        for (const scenario of scenarios) {
            const result = await this.runScenario(scenario);
            results.push(result);
        }
        
        return results;
    }

    /**
     * Logic Step: Run all predefined scenarios
     */
    public async runAllPredefinedScenarios(): Promise<TestScenarioResult[]> {
        return this.runScenarios(PredefinedScenarios.getAllScenarios());
    }

    /**
     * Logic Step: Get test results summary
     */
    public getResultsSummary(): {
        totalScenarios: number;
        successfulScenarios: number;
        failedScenarios: number;
        averageExecutionTime: number;
        totalErrors: number;
        assertionResults: {
            projectState: number;
            uiState: number;
            apiResponse: number;
            performance: number;
        };
    } {
        const totalScenarios = this.results.length;
        const successfulScenarios = this.results.filter(r => r.success).length;
        const failedScenarios = totalScenarios - successfulScenarios;
        const averageExecutionTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / totalScenarios;
        const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);

        const assertionResults = {
            projectState: this.results.filter(r => r.assertions.projectState).length,
            uiState: this.results.filter(r => r.assertions.uiState).length,
            apiResponse: this.results.filter(r => r.assertions.apiResponse).length,
            performance: this.results.filter(r => r.assertions.performance).length
        };

        return {
            totalScenarios,
            successfulScenarios,
            failedScenarios,
            averageExecutionTime,
            totalErrors,
            assertionResults
        };
    }

    /**
     * Logic Step: Get detailed results report
     */
    public getDetailedReport(): string {
        const summary = this.getResultsSummary();
        let report = `\n=== Test Scenario Results Summary ===\n`;
        report += `Total Scenarios: ${summary.totalScenarios}\n`;
        report += `Successful: ${summary.successfulScenarios}\n`;
        report += `Failed: ${summary.failedScenarios}\n`;
        report += `Average Execution Time: ${summary.averageExecutionTime.toFixed(2)}ms\n`;
        report += `Total Errors: ${summary.totalErrors}\n\n`;

        report += `=== Assertion Results ===\n`;
        report += `Project State: ${summary.assertionResults.projectState}/${summary.totalScenarios}\n`;
        report += `UI State: ${summary.assertionResults.uiState}/${summary.totalScenarios}\n`;
        report += `API Response: ${summary.assertionResults.apiResponse}/${summary.totalScenarios}\n`;
        report += `Performance: ${summary.assertionResults.performance}/${summary.totalScenarios}\n\n`;

        report += `=== Individual Scenario Results ===\n`;
        for (const result of this.results) {
            report += `\n${result.scenarioName}: ${result.success ? 'PASS' : 'FAIL'} (${result.executionTime.toFixed(2)}ms)\n`;
            if (result.errors.length > 0) {
                report += `  Errors:\n`;
                for (const error of result.errors) {
                    report += `    - ${error}\n`;
                }
            }
            if (Object.keys(result.metrics).length > 0) {
                report += `  Metrics:\n`;
                for (const [key, value] of Object.entries(result.metrics)) {
                    report += `    - ${key}: ${value}\n`;
                }
            }
        }

        return report;
    }

    /**
     * Logic Step: Clear results
     */
    public clearResults(): void {
        this.results = [];
    }
}
