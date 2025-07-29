import OpenAI from 'openai';
import * as vscode from 'vscode';
import { PrdOutput } from './types';
import { getPrdSystemPrompt } from '../prompts/prdGeneration';

/**
 * A centralized service for interacting with the OpenAI API.
 * This class abstracts the direct API calls, handles configuration management (e.g., model selection),
 * and provides standardized error handling for all AI-powered features.
 */
export class OpenAiService {
    private openai: OpenAI;

        /**
     * Initializes a new instance of the OpenAiService.
     * @param apiKey The OpenAI API key used for authentication.
     */
    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

        /**
     * A private base method for making chat completion requests to the OpenAI API.
     * It handles model configuration, message formatting, and error handling.
     * 
     * @param prompt The main user-facing prompt for the AI.
     * @param systemPrompt An optional system-level instruction to guide the AI's behavior.
     * @param jsonMode If true, configures the API to return a response in JSON format.
     * @returns A promise that resolves with the string content of the AI's response, or null if no content is received.
     * @throws An error if the API call fails, which is then caught and displayed to the user.
     */
    private async baseApiCall(prompt: string, systemPrompt?: string, jsonMode: boolean = false): Promise<string | null> {
        const model = vscode.workspace.getConfiguration('aiPrdGenerator').get<string>('openAiModel', 'gpt-4o');
        
        const messages: any[] = [{ role: 'user', content: prompt }];
        if (systemPrompt) {
            messages.unshift({ role: 'system', content: systemPrompt });
        }

        try {
            const completion = await this.openai.chat.completions.create({
                model: model,
                messages: messages,
                response_format: jsonMode ? { type: 'json_object' } : { type: 'text' },
            });
            return completion.choices?.[0]?.message?.content ?? null;
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            vscode.window.showErrorMessage(`Error calling OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

        /**
     * Generates a Product Requirements Document (PRD) by calling the OpenAI API.
     * This method uses a specific system prompt for PRD generation and expects a JSON response.
     * 
     * @param prompt The user's high-level description of the product or feature.
     * @returns A promise that resolves with the structured PrdOutput object, or null if the API call or parsing fails.
     */
    public async generatePrd(prompt: string): Promise<PrdOutput | null> {
        const systemPrompt = getPrdSystemPrompt();
        const responseContent = await this.baseApiCall(prompt, systemPrompt, true);
        if (responseContent) {
            try {
                return JSON.parse(responseContent) as PrdOutput;
            } catch (error) {
                console.error('Failed to parse PRD response from OpenAI:', error);
                vscode.window.showErrorMessage('Failed to parse the response from OpenAI. Please try again.');
                return null;
            }
        }
        return null;
    }

        /**
     * Generates a simple text completion for a given prompt.
     * This is a general-purpose method for tasks that don't require a specific system prompt or JSON output.
     * 
     * @param prompt The prompt to send to the AI.
     * @returns A promise that resolves with the generated text, or an empty string if the API returns no content.
     */
    public async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const response = await this.baseApiCall(prompt, systemPrompt);
        return response ?? '';
    }

    /**
     * Validates the OpenAI API key by making a lightweight API call.
     * @returns {Promise<boolean>} - True if the API key is valid, false otherwise.
     */
    async validateApiKey(): Promise<boolean> {
        try {
            // Make a simple, low-cost API call to validate the key
            await this.openai.models.list();
            return true;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
}

