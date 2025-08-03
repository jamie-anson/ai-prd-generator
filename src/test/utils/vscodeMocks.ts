/**
 * @file vscodeMocks.ts
 * @description Provides mock objects for the VS Code API for use in tests.
 *
 * This utility is essential for creating a controlled test environment. It provides
 * functions to generate mock URIs, WorkspaceFolders, and Configurations, ensuring
 * that tests are predictable and independent of the actual VS Code environment.
 *
 * The most critical function is `createMockUri`, which uses the official `vscode.Uri.file()`
 * to create genuine Uri instances, preventing the `Illegal argument` errors that plagued
 * the previous test suite.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class VSCodeMocks {
    /**
     * Creates a genuine `vscode.Uri` object from a file path.
     * @param fsPath - The file system path (e.g., '/test/workspace/file.txt').
     * @returns A `vscode.Uri` instance.
     */
    public static createMockUri(fsPath: string): vscode.Uri {
        return vscode.Uri.file(path.resolve(fsPath));
    }

    /**
     * Creates a mock `vscode.WorkspaceFolder`.
     * @param uri - The `vscode.Uri` for the workspace folder.
     * @param name - The name of the workspace folder (defaults to the base name of the URI path).
     * @param index - The index of the folder in the workspace (defaults to 0).
     * @returns A mock `vscode.WorkspaceFolder` object.
     */
    public static createMockWorkspaceFolder(
        uri: vscode.Uri,
        name: string = path.basename(uri.fsPath),
        index: number = 0
    ): vscode.WorkspaceFolder {
        return {
            uri,
            name,
            index,
        };
    }

    /**
     * Creates a mock `vscode.WorkspaceConfiguration` object.
     * This allows tests to simulate different user settings.
     * @param config - A key-value map of configuration settings.
     * @returns A mock `vscode.WorkspaceConfiguration`.
     */
    public static createMockConfig(config: { [key: string]: any }): vscode.WorkspaceConfiguration {
        return {
            get: (key: string) => config[key],
            has: (key: string) => key in config,
            inspect: (key: string) => undefined,
            update: async (key: string, value: any, target?: vscode.ConfigurationTarget) => {},
        };
    }
}
