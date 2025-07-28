/**
 * @ts-nocheck
 * Integration Test Base Class
 * 
 * Logic: Provides a base class for integration tests with common
 * setup for service interactions, API mocking, and end-to-end workflows.
 */

import { describe, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ProjectState } from '../../webview/types';
import { VSCodeMockFactory, FileSystemMockFactory, OpenAIMockFactory, ProjectStateMockFactory, IntegrationMockFactory } from '../utils/mockFactories';
import { ProjectStateFixtures } from '../fixtures/projectFixtures';
import { ConfigFixtures } from '../fixtures/configFixtures';
import { OpenAIFixtures } from '../fixtures/apiFixtures';
import { ProjectStateAssertions, APIAssertions, ConfigAssertions } from '../utils/assertionHelpers';

/**
 * Base class for integration testing with service interactions
 */
export abstract class IntegrationTestBase {
    protected sandbox!: sinon.SinonSandbox;
    protected mocks!: {
        vscode: any;
        fileSystem: any;
        openAI: any;
        projectStateDetector: any;
        configuration: any;
    };
    protected testTimeout: number = 10000; // 10 seconds default timeout

    /**
     * Logic Step: Initialize integration test environment
     * @param scenario Integration test scenario configuration
     */
    protected setup(scenario: {
        projectState?: ProjectState;
        hasApiKey?: boolean;
        openAIScenario?: 'success' | 'auth_error' | 'rate_limit' | 'timeout';
        fileSystemScenario?: 'success' | 'permission_error' | 'not_found';
        configOverrides?: Record<string, any>;
    } = {}): void {
        this.sandbox = sinon.createSandbox();
        
        // Create integration environment using factory
        this.mocks = IntegrationMockFactory.createIntegrationEnvironment(scenario);
        
        // Setup VS Code API mocks
        this.setupVSCodeMocks();
    }

    /**
     * Logic Step: Setup VS Code API mocks
     */
    private setupVSCodeMocks(): void {
        // Mock VS Code workspace
        sinon.stub(vscode, 'workspace' as any).value(this.mocks.vscode.workspace);
        sinon.stub(vscode, 'window' as any).value(this.mocks.vscode.window);
        sinon.stub(vscode, 'commands' as any).value(this.mocks.vscode.commands);
        sinon.stub(vscode, 'Uri' as any).value(this.mocks.vscode.Uri);
    }

    /**
     * Logic Step: Clean up integration test environment
     */
    protected teardown(): void {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    }

    /**
     * Logic Step: Test project state detection workflow
     * @param expectedState Expected project state
     */
    protected async testProjectStateDetection(expectedState: ProjectState): Promise<void> {
        const detectedState = await this.mocks.projectStateDetector.detectProjectState();
        
        ProjectStateAssertions.assertValidProjectState(detectedState, 'Detected project state should be valid');
        ProjectStateAssertions.assertProjectStateEquals(detectedState, expectedState, 'Detected state should match expected');
    }

    /**
     * Logic Step: Test API key configuration and validation
     * @param shouldHaveKey Whether API key should be configured
     */
    protected testAPIKeyConfiguration(shouldHaveKey: boolean): void {
        const config = this.mocks.vscode.workspace.getConfiguration();
        const apiKey = config.get('aiPrdGenerator.openAiApiKey');
        
        if (shouldHaveKey) {
            if (!apiKey || apiKey.length === 0) {
                throw new Error('API key should be configured');
            }
            ConfigAssertions.assertSecureAPIKeyConfig(config, 'API key configuration');
        } else {
            if (apiKey && apiKey.length > 0) {
                throw new Error('API key should not be configured');
            }
        }
    }

    /**
     * Logic Step: Test OpenAI API interaction
     * @param expectedBehavior Expected API behavior
     */
    protected async testOpenAIInteraction(expectedBehavior: 'success' | 'auth_error' | 'rate_limit' | 'timeout'): Promise<void> {
        try {
            const response = await this.mocks.openAI.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Test message' }],
                max_tokens: 100
            });

            if (expectedBehavior === 'success') {
                APIAssertions.assertValidOpenAIResponse(response, 'OpenAI response should be valid');
            } else {
                throw new Error('Expected API to fail but it succeeded');
            }
        } catch (error) {
            if (expectedBehavior === 'success') {
                throw new Error(`Expected API to succeed but it failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Validate expected error types
            switch (expectedBehavior) {
                case 'auth_error':
                    if (!(error instanceof Error && error.message.includes('Invalid API key')) && !((error as any).error?.code?.includes('invalid_api_key'))) {
                        throw new Error(`Expected auth error but got: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
                case 'rate_limit':
                    if (!(error instanceof Error && error.message.includes('Rate limit')) && !((error as any).error?.code?.includes('rate_limit'))) {
                        throw new Error(`Expected rate limit error but got: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
                case 'timeout':
                    if (!(error instanceof Error && error.message.includes('timeout'))) {
                        throw new Error(`Expected timeout error but got: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
            }
        }
    }

    /**
     * Logic Step: Test file system operations
     * @param expectedBehavior Expected file system behavior
     */
    protected async testFileSystemOperations(expectedBehavior: 'success' | 'permission_error' | 'not_found'): Promise<void> {
        const testPath = '/test/path/file.md';
        
        try {
            // Test read operation
            await this.mocks.fileSystem.readFile(testPath);
            
            // Test write operation
            await this.mocks.fileSystem.writeFile(testPath, 'test content');
            
            // Test directory operations
            await this.mocks.fileSystem.ensureDir('/test/path');
            const exists = await this.mocks.fileSystem.pathExists(testPath);
            
            if (expectedBehavior === 'success') {
                if (!exists) {
                    throw new Error('File should exist after successful operations');
                }
            } else {
                throw new Error('Expected file system to fail but it succeeded');
            }
        } catch (error) {
            if (expectedBehavior === 'success') {
                throw new Error(`Expected file system to succeed but it failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Validate expected error types
            switch (expectedBehavior) {
                case 'permission_error':
                    if (!(error instanceof Error && error.message.includes('permission denied')) && (error as any).code !== 'EACCES') {
                        throw new Error(`Expected permission error but got: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
                case 'not_found':
                    if (!(error instanceof Error && error.message.includes('no such file')) && (error as any).code !== 'ENOENT') {
                        throw new Error(`Expected not found error but got: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    break;
            }
        }
    }

    /**
     * Logic Step: Test configuration validation
     * @param requiredKeys Required configuration keys
     */
    protected testConfigurationValidation(requiredKeys: string[] = []): void {
        const config = this.mocks.vscode.workspace.getConfiguration();
        
        // Test required keys
        const defaultRequiredKeys = [
            'aiPrdGenerator.openAiModel',
            'aiPrdGenerator.prdOutput.prdPath',
            'aiPrdGenerator.contextCardOutput.contextCardPath',
            'aiPrdGenerator.contextTemplateOutput.contextTemplatePath'
        ];
        
        ConfigAssertions.assertRequiredConfigKeys(config, [...defaultRequiredKeys, ...requiredKeys], 'Configuration validation');
        ConfigAssertions.assertValidConfigPaths(config, 'Configuration paths validation');
    }

    /**
     * Logic Step: Test workspace folder detection
     */
    protected testWorkspaceDetection(): void {
        const workspaceFolders = this.mocks.vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('Workspace folders should be available');
        }

        const firstFolder = workspaceFolders[0];
        if (!firstFolder.uri || !firstFolder.uri.fsPath) {
            throw new Error('Workspace folder should have valid URI');
        }

        if (!firstFolder.name) {
            throw new Error('Workspace folder should have name');
        }
    }

    /**
     * Logic Step: Test VS Code window operations
     */
    protected async testWindowOperations(): Promise<void> {
        const window = this.mocks.vscode.window;
        
        // Test message display
        await window.showInformationMessage('Test info message');
        await window.showErrorMessage('Test error message');
        await window.showWarningMessage('Test warning message');
        
        // Test progress display
        await window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Test Progress'
        }, async (progress: any) => {
            progress.report({ message: 'Testing...', increment: 50 });
            return 'completed';
        });

        // Verify stubs were called
        if (!window.showInformationMessage.called) {
            throw new Error('showInformationMessage should have been called');
        }
        if (!window.showErrorMessage.called) {
            throw new Error('showErrorMessage should have been called');
        }
        if (!window.withProgress.called) {
            throw new Error('withProgress should have been called');
        }
    }

    /**
     * Logic Step: Test command registration and execution
     */
    protected async testCommandOperations(): Promise<void> {
        const commands = this.mocks.vscode.commands;
        
        // Test command registration
        const disposable = commands.registerCommand('test.command', () => 'test result');
        
        // Test command execution
        const result = await commands.executeCommand('test.command');
        
        if (result !== 'test result') {
            throw new Error(`Expected 'test result' but got '${result}'`);
        }

        // Test disposal
        disposable.dispose();
        
        // Verify stubs were called
        if (!commands.registerCommand.called) {
            throw new Error('registerCommand should have been called');
        }
        if (!commands.executeCommand.called) {
            throw new Error('executeCommand should have been called');
        }
    }

    /**
     * Logic Step: Test end-to-end workflow
     * @param workflowType Type of workflow to test
     */
    protected async testEndToEndWorkflow(workflowType: 'prd_generation' | 'context_generation' | 'ccs_analysis'): Promise<void> {
        // Step 1: Detect project state
        const projectState = await this.mocks.projectStateDetector.detectProjectState();
        ProjectStateAssertions.assertValidProjectState(projectState, 'Initial project state');

        // Step 2: Validate configuration
        this.testConfigurationValidation();

        // Step 3: Test API key configuration
        const config = this.mocks.vscode.workspace.getConfiguration();
        const hasApiKey = config.get('aiPrdGenerator.openAiApiKey')?.length > 0;
        this.testAPIKeyConfiguration(hasApiKey);

        // Step 4: Test API interaction (if API key is available)
        if (hasApiKey) {
            await this.testOpenAIInteraction('success');
        }

        // Step 5: Test file system operations
        await this.testFileSystemOperations('success');

        // Step 6: Test window operations
        await this.testWindowOperations();

        // Step 7: Workflow-specific tests
        switch (workflowType) {
            case 'prd_generation':
                await this.testPRDGenerationWorkflow();
                break;
            case 'context_generation':
                await this.testContextGenerationWorkflow();
                break;
            case 'ccs_analysis':
                await this.testCCSAnalysisWorkflow();
                break;
        }
    }

    /**
     * Logic Step: Test PRD generation workflow
     */
    protected async testPRDGenerationWorkflow(): Promise<void> {
        // Test PRD-specific logic
        const config = this.mocks.vscode.workspace.getConfiguration();
        const prdPath = config.get('aiPrdGenerator.prdOutput.prdPath');
        
        if (!prdPath) {
            throw new Error('PRD output path should be configured');
        }

        // Simulate PRD generation
        await this.mocks.fileSystem.ensureDir(prdPath);
        await this.mocks.fileSystem.writeFile(`${prdPath}/test-prd.md`, '# Test PRD\n\nTest content');
        
        // Verify file was created
        const exists = await this.mocks.fileSystem.pathExists(`${prdPath}/test-prd.md`);
        if (!exists) {
            throw new Error('PRD file should have been created');
        }
    }

    /**
     * Logic Step: Test context generation workflow
     */
    protected async testContextGenerationWorkflow(): Promise<void> {
        // Test context-specific logic
        const config = this.mocks.vscode.workspace.getConfiguration();
        const contextCardPath = config.get('aiPrdGenerator.contextCardOutput.contextCardPath');
        const contextTemplatePath = config.get('aiPrdGenerator.contextTemplateOutput.contextTemplatePath');
        
        if (!contextCardPath || !contextTemplatePath) {
            throw new Error('Context output paths should be configured');
        }

        // Simulate context generation
        await this.mocks.fileSystem.ensureDir(contextCardPath);
        await this.mocks.fileSystem.ensureDir(contextTemplatePath);
        
        await this.mocks.fileSystem.writeFile(`${contextCardPath}/test-card.md`, '# Test Context Card');
        await this.mocks.fileSystem.writeFile(`${contextTemplatePath}/test-template.md`, '# Test Context Template');
    }

    /**
     * Logic Step: Test CCS analysis workflow
     */
    protected async testCCSAnalysisWorkflow(): Promise<void> {
        // Test CCS-specific logic
        const config = this.mocks.vscode.workspace.getConfiguration();
        const ccsPath = config.get('aiPrdGenerator.ccsOutput.ccsPath');
        
        if (!ccsPath) {
            throw new Error('CCS output path should be configured');
        }

        // Simulate CCS analysis
        await this.mocks.fileSystem.ensureDir(ccsPath);
        await this.mocks.fileSystem.writeFile(`${ccsPath}/test-analysis.md`, '# Test CCS Analysis');
    }

    /**
     * Logic Step: Measure integration test performance
     * @param operation Async operation to measure
     * @returns Execution time in milliseconds
     */
    protected async measureIntegrationPerformance(operation: () => Promise<void>): Promise<number> {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        return endTime - startTime;
    }

    /**
     * Logic Step: Assert integration test performance
     * @param operation Async operation to test
     * @param maxTimeMs Maximum acceptable time
     * @param operationName Name for error messages
     */
    protected async assertIntegrationPerformance(
        operation: () => Promise<void>,
        maxTimeMs: number,
        operationName: string
    ): Promise<void> {
        const executionTime = await this.measureIntegrationPerformance(operation);
        
        if (executionTime > maxTimeMs) {
            throw new Error(`${operationName} should complete within ${maxTimeMs}ms, but took ${executionTime.toFixed(2)}ms`);
        }
    }

    /**
     * Logic Step: Setup method to be called in beforeEach
     * Override this method in subclasses for custom setup
     */
    protected abstract setupTest(): void;

    /**
     * Logic Step: Teardown method to be called in afterEach
     * Override this method in subclasses for custom teardown
     */
    protected cleanupTest(): void {
        // Default implementation - can be overridden
    }

    /**
     * Logic Step: Create integration test suite with common setup/teardown
     * @param suiteName Name of the test suite
     * @param testDefinition Function that defines the tests
     */
    public static createTestSuite(
        suiteName: string, 
        testDefinition: (testInstance: any) => void
    ): void {
        describe(suiteName, function() {
            // Set timeout for integration tests
            this.timeout(10000);
            
            let testInstance: any;

            beforeEach(function() {
                testInstance = new (this.constructor as any)();
                testInstance.setupTest();
            });

            afterEach(function() {
                if (testInstance) {
                    testInstance.cleanupTest();
                    testInstance.teardown();
                }
            });

            testDefinition(testInstance);
        });
    }
}

/**
 * Specialized base class for service integration testing
 */
export abstract class ServiceIntegrationTestBase extends IntegrationTestBase {
    /**
     * Logic Step: Test service initialization
     * @param serviceName Name of the service being tested
     */
    protected testServiceInitialization(serviceName: string): void {
        // Override in subclasses to test specific service initialization
        console.log(`Testing ${serviceName} service initialization`);
    }

    /**
     * Logic Step: Test service error handling
     * @param serviceName Name of the service being tested
     * @param errorScenarios Array of error scenarios to test
     */
    protected async testServiceErrorHandling(
        serviceName: string, 
        errorScenarios: Array<{ name: string; test: () => Promise<void> }>
    ): Promise<void> {
        for (const scenario of errorScenarios) {
            try {
                await scenario.test();
                throw new Error(`${serviceName} should have thrown error for scenario: ${scenario.name}`);
            } catch (error) {
                if (error instanceof Error && error.message.includes('should have thrown error')) {
                    throw error; // Re-throw test failure
                }
                // Expected error - test passed
                console.log(`${serviceName} correctly handled error scenario: ${scenario.name}`);
            }
        }
    }

    /**
     * Logic Step: Test service performance under load
     * @param serviceName Name of the service being tested
     * @param operation Service operation to test
     * @param iterations Number of iterations to run
     * @param maxAverageTime Maximum acceptable average time
     */
    protected async testServicePerformance(
        serviceName: string,
        operation: () => Promise<void>,
        iterations: number = 10,
        maxAverageTime: number = 1000
    ): Promise<void> {
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            const time = await this.measureIntegrationPerformance(operation);
            times.push(time);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        if (averageTime > maxAverageTime) {
            throw new Error(`${serviceName} average performance ${averageTime.toFixed(2)}ms exceeds maximum ${maxAverageTime}ms`);
        }
        
        console.log(`${serviceName} Performance Stats:`, {
            average: averageTime.toFixed(2) + 'ms',
            min: minTime.toFixed(2) + 'ms',
            max: maxTime.toFixed(2) + 'ms',
            iterations
        });
    }
}
