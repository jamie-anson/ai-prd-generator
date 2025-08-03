/**
 * @file apiKeyManager.ts
 * @description Manages the OpenAI API key using VS Code's SecretStorage.
 */

import * as vscode from 'vscode';

const API_KEY_SECRET_KEY = 'aiPrdGenerator.openAiApiKey';

export class ApiKeyManager {
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    public async getApiKey(): Promise<string | undefined> {
        return await this.secretStorage.get(API_KEY_SECRET_KEY);
    }

    public async setApiKey(key: string): Promise<void> {
        await this.secretStorage.store(API_KEY_SECRET_KEY, key);
    }

    public async deleteApiKey(): Promise<void> {
        await this.secretStorage.delete(API_KEY_SECRET_KEY);
    }
}
