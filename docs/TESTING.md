# Testing Framework Documentation

## Overview

The ai-prd-generator extension uses a comprehensive testing framework built on Mocha with TypeScript support. The framework provides layered testing with proper mocking, coverage reporting, and CI integration.

## Framework Architecture

### Test Structure
```
src/test/
├── test.config.ts          # Centralized test configuration
├── utils/
│   └── testUtils.ts        # Common mocks and utilities
├── unit/                   # Unit tests for individual functions
│   └── utils/
├── integration/            # Integration tests for services
│   └── services/
└── extension/              # Extension-specific tests
    └── commands/
```

### Test Configuration

The framework uses centralized configuration in `src/test/test.config.ts`:

```typescript
export const testConfig = {
    timeouts: {
        unit: 5000,        // 5 seconds for unit tests
        integration: 15000, // 15 seconds for integration tests
        extension: 20000,   // 20 seconds for extension tests
        e2e: 30000         // 30 seconds for end-to-end tests
    },
    coverage: {
        threshold: 80,     // 80% coverage requirement
        exclude: [...]     // Files to exclude from coverage
    }
};
```

## Test Utilities

### Mocking Framework

The framework provides comprehensive mocks for:

#### VS Code API Mocks
```typescript
VSCodeMocks.workspace.getConfiguration()
VSCodeMocks.window.showInformationMessage()
VSCodeMocks.commands.registerCommand()
```

#### OpenAI API Mocks
```typescript
OpenAIMocks.mockPRDResponse('Mock PRD Content')
OpenAIMocks.mockDiagramResponse('graph TD\nA --> B')
```

#### File System Mocks
```typescript
FileSystemMocks.mockProjectFiles({
    hasPRD: true,
    prdCount: 2
})
```

### Test Data Factory

Create consistent test objects:

```typescript
TestDataFactory.createProjectState({ hasPRD: true })
TestDataFactory.createWebviewMessage('generate-prd', { apiKey: 'test' })
TestDataFactory.createMockConfig({ 'aiPrdGenerator.openAiModel': 'gpt-4' })
```

## Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:extension

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI pipeline
npm run test:ci
```

### Custom Test Runner

The framework includes a custom test runner (`scripts/test.js`) that provides:

- Parallel test execution
- Coverage reporting with multiple formats
- Detailed output formatting
- Error handling and reporting

## Writing Tests

### Unit Test Example

```typescript
import { TestSetup, VSCodeMocks, TestDataFactory } from '../../utils/testUtils';
import { testConfig } from '../../test.config';

suite('Component Unit Tests', () => {
    beforeEach(() => {
        TestSetup.beforeEach();
    });

    afterEach(() => {
        TestSetup.afterEach();
    });

    test('should perform operation', async function() {
        this.timeout(testConfig.timeouts.unit);
        
        // Setup mocks
        VSCodeMocks.workspace.getConfiguration.returns(
            TestDataFactory.createMockConfig()
        );

        // Execute test
        const result = await yourFunction();

        // Verify results
        assert.strictEqual(result.success, true);
    });
});
```

### Integration Test Example

```typescript
suite('Service Integration Tests', () => {
    beforeEach(() => {
        TestSetup.beforeEach();
        TestSetup.setupIntegrationTest();
    });

    test('should integrate services correctly', async function() {
        this.timeout(testConfig.timeouts.integration);
        
        // Mock complex interactions
        FileSystemMocks.mockProjectFiles({ hasPRD: true });
        OpenAIMocks.mockPRDResponse('Generated content');

        // Test service integration
        const result = await serviceMethod();
        
        // Verify integration
        assert.ok(result.completed);
    });
});
```

## Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Unit Tests**: Focus on individual function logic
- **Integration Tests**: Test service interactions
- **Extension Tests**: Test VS Code API integration

### Coverage Exclusions

The following are excluded from coverage requirements:
- Test files (`src/test/**/*`)
- Type definitions (`src/**/*.d.ts`)
- Build outputs (`dist/**/*`, `out/**/*`)

## Best Practices

### Test Organization
1. Group related tests in suites
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Keep tests focused and atomic

### Mocking Strategy
1. Mock external dependencies consistently
2. Use factory methods for test data
3. Reset mocks between tests
4. Verify mock interactions when relevant

### Error Testing
1. Test both success and failure paths
2. Verify error handling and recovery
3. Test edge cases and boundary conditions
4. Ensure graceful degradation

### Performance Considerations
1. Use appropriate timeouts for test types
2. Mock expensive operations
3. Avoid real file system operations
4. Parallelize independent tests

## Continuous Integration

The framework is CI-ready with:

```bash
npm run test:ci
```

This command:
1. Compiles TypeScript
2. Runs type checking
3. Executes linting
4. Runs all tests with coverage
5. Generates coverage reports

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure test config is in `src/test/` directory
2. **Mock Failures**: Reset mocks in `beforeEach` hooks
3. **Timeout Issues**: Adjust timeouts in test config
4. **Coverage Gaps**: Check excluded files and add tests

### Debug Mode

Run tests with debug output:
```bash
npm run test:watch
```

This provides real-time feedback during development.

## Future Enhancements

Planned improvements:
- E2E test automation
- Visual regression testing
- Performance benchmarking
- Automated test generation
- Enhanced coverage reporting
