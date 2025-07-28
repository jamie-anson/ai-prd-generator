/**
 * @ts-nocheck
 * Unit Test Base Class
 * 
 * Logic: Provides a base class for unit tests with common
 * setup for isolated testing, mocking, and assertion patterns.
 */

import { describe, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import { testConfig } from '../test.config';

/**
 * Base class for unit testing with isolation and mocking
 */
export abstract class UnitTestBase {
    protected sandbox!: sinon.SinonSandbox;
    protected testTimeout!: number;
    protected stubs!: Map<string, sinon.SinonStub>;
    protected spies!: Map<string, sinon.SinonSpy>;

    /**
     * Logic Step: Initialize unit test environment
     */
    protected setup(): void {
        this.sandbox = sinon.createSandbox();
        this.testTimeout = testConfig.timeouts.unit;
        this.stubs = new Map();
        this.spies = new Map();
    }

    /**
     * Logic Step: Clean up unit test environment
     */
    protected teardown(): void {
        if (this.sandbox) {
            this.sandbox.restore();
        }
        this.stubs.clear();
        this.spies.clear();
    }

    /**
     * Logic Step: Create and register a stub
     * @param name Stub name for reference
     * @param object Object to stub
     * @param method Method name to stub
     * @returns Created stub
     */
    protected createStub(name: string, object: any, method: string): sinon.SinonStub {
        const stub = this.sandbox.stub(object, method);
        this.stubs.set(name, stub);
        return stub;
    }

    /**
     * Logic Step: Create and register a spy
     * @param name Spy name for reference
     * @param object Object to spy on
     * @param method Method name to spy on
     * @returns Created spy
     */
    protected createSpy(name: string, object: any, method: string): sinon.SinonSpy {
        const spy = this.sandbox.spy(object, method);
        this.spies.set(name, spy);
        return spy;
    }

    /**
     * Logic Step: Get registered stub by name
     * @param name Stub name
     * @returns Stub instance
     */
    protected getStub(name: string): sinon.SinonStub {
        const stub = this.stubs.get(name);
        if (!stub) {
            throw new Error(`Stub not found: ${name}`);
        }
        return stub;
    }

    /**
     * Logic Step: Get registered spy by name
     * @param name Spy name
     * @returns Spy instance
     */
    protected getSpy(name: string): sinon.SinonSpy {
        const spy = this.spies.get(name);
        if (!spy) {
            throw new Error(`Spy not found: ${name}`);
        }
        return spy;
    }

    /**
     * Logic Step: Assert stub was called with specific arguments
     * @param stubName Name of the stub
     * @param expectedArgs Expected arguments
     * @param callIndex Call index to check (default: 0)
     */
    protected assertStubCalledWith(stubName: string, expectedArgs: any[], callIndex: number = 0): void {
        const stub = this.getStub(stubName);
        
        if (!stub.called) {
            throw new Error(`Stub ${stubName} was not called`);
        }

        if (stub.callCount <= callIndex) {
            throw new Error(`Stub ${stubName} was not called at index ${callIndex} (only ${stub.callCount} calls)`);
        }

        const actualArgs = stub.getCall(callIndex).args;
        
        if (actualArgs.length !== expectedArgs.length) {
            throw new Error(`Stub ${stubName} called with ${actualArgs.length} args, expected ${expectedArgs.length}`);
        }

        for (let i = 0; i < expectedArgs.length; i++) {
            if (actualArgs[i] !== expectedArgs[i]) {
                throw new Error(`Stub ${stubName} arg ${i}: expected ${expectedArgs[i]}, got ${actualArgs[i]}`);
            }
        }
    }

    /**
     * Logic Step: Assert stub was called specific number of times
     * @param stubName Name of the stub
     * @param expectedCount Expected call count
     */
    protected assertStubCallCount(stubName: string, expectedCount: number): void {
        const stub = this.getStub(stubName);
        
        if (stub.callCount !== expectedCount) {
            throw new Error(`Stub ${stubName} called ${stub.callCount} times, expected ${expectedCount}`);
        }
    }

    /**
     * Logic Step: Assert spy was called with specific arguments
     * @param spyName Name of the spy
     * @param expectedArgs Expected arguments
     * @param callIndex Call index to check (default: 0)
     */
    protected assertSpyCalledWith(spyName: string, expectedArgs: any[], callIndex: number = 0): void {
        const spy = this.getSpy(spyName);
        
        if (!spy.called) {
            throw new Error(`Spy ${spyName} was not called`);
        }

        if (spy.callCount <= callIndex) {
            throw new Error(`Spy ${spyName} was not called at index ${callIndex} (only ${spy.callCount} calls)`);
        }

        const actualArgs = spy.getCall(callIndex).args;
        
        if (actualArgs.length !== expectedArgs.length) {
            throw new Error(`Spy ${spyName} called with ${actualArgs.length} args, expected ${expectedArgs.length}`);
        }

        for (let i = 0; i < expectedArgs.length; i++) {
            if (actualArgs[i] !== expectedArgs[i]) {
                throw new Error(`Spy ${spyName} arg ${i}: expected ${expectedArgs[i]}, got ${actualArgs[i]}`);
            }
        }
    }

    /**
     * Logic Step: Reset all stubs and spies
     */
    protected resetAllMocks(): void {
        this.stubs.forEach(stub => stub.reset());
        this.spies.forEach(spy => spy.resetHistory());
    }

    /**
     * Logic Step: Create a mock object with specified methods
     * @param methods Array of method names to mock
     * @returns Mock object with stubbed methods
     */
    protected createMockObject(methods: string[]): any {
        const mock: any = {};
        
        for (const method of methods) {
            mock[method] = this.sandbox.stub();
        }
        
        return mock;
    }

    /**
     * Logic Step: Create a mock function that returns specified values in sequence
     * @param values Array of values to return on subsequent calls
     * @returns Mock function
     */
    protected createSequentialMock(values: any[]): sinon.SinonStub {
        const stub = this.sandbox.stub();
        
        values.forEach((value, index) => {
            stub.onCall(index).returns(value);
        });
        
        return stub;
    }

    /**
     * Logic Step: Create a mock function that throws specified errors in sequence
     * @param errors Array of errors to throw on subsequent calls
     * @returns Mock function
     */
    protected createSequentialErrorMock(errors: Error[]): sinon.SinonStub {
        const stub = this.sandbox.stub();
        
        errors.forEach((error, index) => {
            stub.onCall(index).throws(error);
        });
        
        return stub;
    }

    /**
     * Logic Step: Create a mock async function that resolves with specified values
     * @param values Array of values to resolve with on subsequent calls
     * @returns Mock async function
     */
    protected createAsyncSequentialMock(values: any[]): sinon.SinonStub {
        const stub = this.sandbox.stub();
        
        values.forEach((value, index) => {
            stub.onCall(index).resolves(value);
        });
        
        return stub;
    }

    /**
     * Logic Step: Create a mock async function that rejects with specified errors
     * @param errors Array of errors to reject with on subsequent calls
     * @returns Mock async function
     */
    protected createAsyncErrorMock(errors: Error[]): sinon.SinonStub {
        const stub = this.sandbox.stub();
        
        errors.forEach((error, index) => {
            stub.onCall(index).rejects(error);
        });
        
        return stub;
    }

    /**
     * Logic Step: Test function execution time
     * @param operation Function to test
     * @param maxTimeMs Maximum acceptable execution time
     * @param operationName Name for error messages
     */
    protected assertExecutionTime(
        operation: () => void | Promise<void>,
        maxTimeMs: number,
        operationName: string
    ): void | Promise<void> {
        const startTime = performance.now();
        
        const result = operation();
        
        if (result instanceof Promise) {
            return result.then(() => {
                const executionTime = performance.now() - startTime;
                if (executionTime > maxTimeMs) {
                    throw new Error(`${operationName} took ${executionTime.toFixed(2)}ms, expected <= ${maxTimeMs}ms`);
                }
            });
        } else {
            const executionTime = performance.now() - startTime;
            if (executionTime > maxTimeMs) {
                throw new Error(`${operationName} took ${executionTime.toFixed(2)}ms, expected <= ${maxTimeMs}ms`);
            }
        }
    }

    /**
     * Logic Step: Test memory usage during operation
     * @param operation Function to test
     * @param maxMemoryIncreaseMB Maximum acceptable memory increase in MB
     * @param operationName Name for error messages
     */
    protected assertMemoryUsage(
        operation: () => void | Promise<void>,
        maxMemoryIncreaseMB: number,
        operationName: string
    ): void | Promise<void> {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        const initialMemory = process.memoryUsage().heapUsed;
        
        const result = operation();
        
        const checkMemory = () => {
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB
            
            if (memoryIncrease > maxMemoryIncreaseMB) {
                throw new Error(`${operationName} increased memory by ${memoryIncrease.toFixed(2)}MB, expected <= ${maxMemoryIncreaseMB}MB`);
            }
        };
        
        if (result instanceof Promise) {
            return result.then(checkMemory);
        } else {
            checkMemory();
        }
    }

    /**
     * Logic Step: Test that function throws expected error
     * @param operation Function that should throw
     * @param expectedError Expected error message or Error instance
     * @param operationName Name for error messages
     */
    protected assertThrows(
        operation: () => void,
        expectedError: string | Error,
        operationName: string
    ): void {
        try {
            operation();
            throw new Error(`${operationName} should have thrown an error`);
        } catch (error) {
            if (typeof expectedError === 'string') {
                if (!(error instanceof Error && error.message.includes(expectedError))) {
                    throw new Error(`${operationName} threw "${error instanceof Error ? error.message : String(error)}", expected message containing "${expectedError}"`);
                }
            } else {
                if (!(error instanceof Error) || error.constructor !== expectedError.constructor) {
                    throw new Error(`${operationName} threw ${error instanceof Error ? error.constructor.name : typeof error}, expected ${expectedError.constructor.name}`);
                }
                if (error.message !== expectedError.message) {
                    throw new Error(`${operationName} threw "${error.message}", expected "${expectedError.message}"`);
                }
            }
        }
    }

    /**
     * Logic Step: Test that async function rejects with expected error
     * @param operation Async function that should reject
     * @param expectedError Expected error message or Error instance
     * @param operationName Name for error messages
     */
    protected async assertRejects(
        operation: () => Promise<void>,
        expectedError: string | Error,
        operationName: string
    ): Promise<void> {
        try {
            await operation();
            throw new Error(`${operationName} should have rejected`);
        } catch (error) {
            if (typeof expectedError === 'string') {
                if (!(error instanceof Error && error.message.includes(expectedError))) {
                    throw new Error(`${operationName} rejected with "${error instanceof Error ? error.message : String(error)}", expected message containing "${expectedError}"`);
                }
            } else {
                if (!(error instanceof Error) || error.constructor !== expectedError.constructor) {
                    throw new Error(`${operationName} rejected with ${error instanceof Error ? error.constructor.name : typeof error}, expected ${expectedError.constructor.name}`);
                }
                if (error.message !== expectedError.message) {
                    throw new Error(`${operationName} rejected with "${error.message}", expected "${expectedError.message}"`);
                }
            }
        }
    }

    /**
     * Logic Step: Test function with multiple input/output pairs
     * @param testFunction Function to test
     * @param testCases Array of input/output pairs
     * @param operationName Name for error messages
     */
    protected testMultipleCases(
        testFunction: (...args: any[]) => any,
        testCases: Array<{ input: any[]; expected: any; description?: string }>,
        operationName: string
    ): void {
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const description = testCase.description || `case ${i + 1}`;
            
            try {
                const result = testFunction(...testCase.input);
                
                if (result !== testCase.expected) {
                    throw new Error(`${operationName} ${description}: expected ${testCase.expected}, got ${result}`);
                }
            } catch (error) {
                throw new Error(`${operationName} ${description} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    /**
     * Logic Step: Test async function with multiple input/output pairs
     * @param testFunction Async function to test
     * @param testCases Array of input/output pairs
     * @param operationName Name for error messages
     */
    protected async testMultipleAsyncCases(
        testFunction: (...args: any[]) => Promise<any>,
        testCases: Array<{ input: any[]; expected: any; description?: string }>,
        operationName: string
    ): Promise<void> {
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const description = testCase.description || `case ${i + 1}`;
            
            try {
                const result = await testFunction(...testCase.input);
                
                if (result !== testCase.expected) {
                    throw new Error(`${operationName} ${description}: expected ${testCase.expected}, got ${result}`);
                }
            } catch (error) {
                throw new Error(`${operationName} ${description} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
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
     * Logic Step: Create unit test suite with common setup/teardown
     * @param suiteName Name of the test suite
     * @param testDefinition Function that defines the tests
     */
    public static createTestSuite(
        suiteName: string, 
        testDefinition: (testInstance: any) => void
    ): void {
        describe(suiteName, function() {
            let testInstance: any;

            beforeEach(function() {
                // Set timeout from test config
                this.timeout(testConfig.timeouts.unit);
                
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
 * Specialized base class for utility function testing
 */
export abstract class UtilityTestBase extends UnitTestBase {
    /**
     * Logic Step: Test utility function with edge cases
     * @param utilityFunction Function to test
     * @param edgeCases Array of edge case inputs and expected outputs
     * @param functionName Name of the function for error messages
     */
    protected testEdgeCases(
        utilityFunction: (...args: any[]) => any,
        edgeCases: Array<{ input: any[]; expected: any; description: string }>,
        functionName: string
    ): void {
        this.testMultipleCases(utilityFunction, edgeCases, `${functionName} edge cases`);
    }

    /**
     * Logic Step: Test utility function with invalid inputs
     * @param utilityFunction Function to test
     * @param invalidInputs Array of invalid inputs that should throw errors
     * @param functionName Name of the function for error messages
     */
    protected testInvalidInputs(
        utilityFunction: (...args: any[]) => any,
        invalidInputs: Array<{ input: any[]; expectedError: string; description: string }>,
        functionName: string
    ): void {
        for (const testCase of invalidInputs) {
            this.assertThrows(
                () => utilityFunction(...testCase.input),
                testCase.expectedError,
                `${functionName} ${testCase.description}`
            );
        }
    }

    /**
     * Logic Step: Test utility function performance with various input sizes
     * @param utilityFunction Function to test
     * @param inputSizes Array of input sizes to test
     * @param maxTimePerSize Maximum time per input size
     * @param functionName Name of the function for error messages
     */
    protected testPerformanceScaling(
        utilityFunction: (...args: any[]) => any,
        inputSizes: number[],
        maxTimePerSize: number,
        functionName: string
    ): void {
        for (const size of inputSizes) {
            const input = this.generateTestInput(size);
            
            this.assertExecutionTime(
                () => utilityFunction(input),
                maxTimePerSize,
                `${functionName} with input size ${size}`
            );
        }
    }

    /**
     * Logic Step: Generate test input of specified size
     * Override this method in subclasses to generate appropriate test data
     * @param size Size of input to generate
     * @returns Test input data
     */
    protected generateTestInput(size: number): any {
        // Default implementation - override in subclasses
        return Array.from({ length: size }, (_, i) => i);
    }
}

/**
 * Specialized base class for class/service testing
 */
export abstract class ClassTestBase extends UnitTestBase {
    protected instance: any;
    protected dependencies!: Map<string, any>;

    /**
     * Logic Step: Setup class test environment
     */
    protected setup(): void {
        super.setup();
        this.dependencies = new Map();
    }

    /**
     * Logic Step: Create mock dependency
     * @param name Dependency name
     * @param methods Array of method names to mock
     * @returns Mock dependency
     */
    protected createMockDependency(name: string, methods: string[]): any {
        const mock = this.createMockObject(methods);
        this.dependencies.set(name, mock);
        return mock;
    }

    /**
     * Logic Step: Get mock dependency by name
     * @param name Dependency name
     * @returns Mock dependency
     */
    protected getMockDependency(name: string): any {
        const dependency = this.dependencies.get(name);
        if (!dependency) {
            throw new Error(`Mock dependency not found: ${name}`);
        }
        return dependency;
    }

    /**
     * Logic Step: Test class constructor
     * @param constructorArgs Arguments to pass to constructor
     * @param expectedProperties Expected properties on the instance
     */
    protected testConstructor(constructorArgs: any[], expectedProperties: Record<string, any>): void {
        // This should be implemented by subclasses with their specific class
        throw new Error('testConstructor must be implemented by subclass');
    }

    /**
     * Logic Step: Test method with dependency injection
     * @param methodName Method name to test
     * @param methodArgs Arguments to pass to method
     * @param dependencySetup Function to setup dependency mocks
     * @param expectedResult Expected result
     */
    protected testMethodWithDependencies(
        methodName: string,
        methodArgs: any[],
        dependencySetup: () => void,
        expectedResult: any
    ): void {
        dependencySetup();
        
        const result = this.instance[methodName](...methodArgs);
        
        if (result !== expectedResult) {
            throw new Error(`${methodName} returned ${result}, expected ${expectedResult}`);
        }
    }

    /**
     * Logic Step: Test async method with dependency injection
     * @param methodName Method name to test
     * @param methodArgs Arguments to pass to method
     * @param dependencySetup Function to setup dependency mocks
     * @param expectedResult Expected result
     */
    protected async testAsyncMethodWithDependencies(
        methodName: string,
        methodArgs: any[],
        dependencySetup: () => void,
        expectedResult: any
    ): Promise<void> {
        dependencySetup();
        
        const result = await this.instance[methodName](...methodArgs);
        
        if (result !== expectedResult) {
            throw new Error(`${methodName} returned ${result}, expected ${expectedResult}`);
        }
    }

    /**
     * Logic Step: Clean up class test environment
     */
    protected teardown(): void {
        super.teardown();
        this.dependencies.clear();
        this.instance = null;
    }
}
