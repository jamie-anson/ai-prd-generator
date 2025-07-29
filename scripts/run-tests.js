const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
    console.log('🚀 Starting test runner...');
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '..');
        const extensionTestsPath = path.resolve(__dirname, '../out/test/suite/extension.test.js');

        console.log(`Extension Dev Path: ${extensionDevelopmentPath}`);
        console.log(`Extension Test Path: ${extensionTestsPath}`);

        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath,
            launchArgs: ['--disable-extensions'] // Disable other extensions to ensure a clean environment
        });

        console.log('Test runner finished successfully.');
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
