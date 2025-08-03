/**
 * @file fileSystemManager.ts
 * @description Manages the creation and cleanup of temporary file systems for tests.
 *
 * This utility is crucial for integration tests that need to simulate a real workspace.
 * It provides methods to create a temporary directory, populate it with files and folders,
 * and then reliably clean it up after the test has run. This ensures that tests are
 * hermetic and do not leave artifacts on the file system.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export class FileSystemManager {
    private tempDir: string;

    constructor() {
        // Create a unique temporary directory for each test run
        this.tempDir = path.join(os.tmpdir(), 'ai-prd-generator-tests', Date.now().toString());
        fs.ensureDirSync(this.tempDir);
    }

    /**
     * Returns the root path of the temporary workspace.
     * @returns The absolute path to the temporary directory.
     */
    public getWorkspaceRoot(): string {
        return this.tempDir;
    }

    /**
     * Creates a file with the given content inside the temporary workspace.
     * @param filePath - The relative path of the file to create (e.g., 'src/index.ts').
     * @param content - The content to write to the file.
     */
    public createFile(filePath: string, content: string): void {
        const fullPath = path.join(this.tempDir, filePath);
        fs.ensureDirSync(path.dirname(fullPath));
        fs.writeFileSync(fullPath, content);
    }

    /**
     * Removes the temporary directory and all its contents.
     * This should be called in an `afterEach` or `after` block to ensure cleanup.
     */
    public cleanup(): void {
        fs.removeSync(this.tempDir);
    }
}
