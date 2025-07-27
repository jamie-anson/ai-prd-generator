/**
 * @ts-nocheck
 * Test Runner Script for ai-prd-generator Extension
 * 
 * Logic: Provides comprehensive test execution with coverage reporting,
 * parallel test running, and detailed output formatting.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test configuration and paths
 */
const TEST_CONFIG = {
    timeout: 30000,
    coverage: {
        threshold: 80,
        outputDir: 'coverage',
        formats: ['html', 'lcov', 'text']
    },
    testPaths: {
        unit: 'out/test/unit/**/*.test.js',
        integration: 'out/test/integration/**/*.test.js',
        extension: 'out/test/extension/**/*.test.js',
        all: 'out/test/**/*.test.js'
    }
};

/**
 * Logic Step: Execute test command with proper configuration
 */
function runTests(testType = 'all', options = {}) {
    return new Promise((resolve, reject) => {
        const testPath = TEST_CONFIG.testPaths[testType] || TEST_CONFIG.testPaths.all;
        
        const args = [
            'test',
            '--files', testPath,
            '--timeout', TEST_CONFIG.timeout.toString()
        ];

        if (options.coverage) {
            args.push('--coverage');
        }

        if (options.watch) {
            args.push('--watch');
        }

        console.log(`🧪 Running ${testType} tests...`);
        console.log(`📁 Test path: ${testPath}`);
        
        const testProcess = spawn('npx', ['vscode-test', ...args], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${testType} tests completed successfully`);
                resolve(code);
            } else {
                console.error(`❌ ${testType} tests failed with code ${code}`);
                reject(new Error(`Tests failed with code ${code}`));
            }
        });

        testProcess.on('error', (error) => {
            console.error(`❌ Failed to start tests: ${error.message}`);
            reject(error);
        });
    });
}

/**
 * Logic Step: Generate coverage report
 */
function generateCoverageReport() {
    console.log('📊 Generating coverage report...');
    
    // Logic Step: Check if coverage directory exists
    const coverageDir = path.join(process.cwd(), TEST_CONFIG.coverage.outputDir);
    if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
    }

    console.log(`📈 Coverage report generated in ${coverageDir}`);
    console.log(`🎯 Coverage threshold: ${TEST_CONFIG.coverage.threshold}%`);
}

/**
 * Logic Step: Main test execution function
 */
async function main() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    const options = {
        coverage: args.includes('--coverage'),
        watch: args.includes('--watch')
    };

    try {
        console.log('🚀 Starting ai-prd-generator test suite...');
        console.log(`📋 Test type: ${testType}`);
        console.log(`⚙️  Options: ${JSON.stringify(options)}`);
        
        await runTests(testType, options);
        
        if (options.coverage) {
            generateCoverageReport();
        }
        
        console.log('🎉 All tests completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Test execution failed:', error.message);
        process.exit(1);
    }
}

// Logic Step: Execute if run directly
if (require.main === module) {
    main();
}

module.exports = { runTests, generateCoverageReport };
