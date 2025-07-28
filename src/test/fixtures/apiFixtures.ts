/**
 * @ts-nocheck
 * API Response Fixtures for Testing
 * 
 * Logic: Provides standardized API response mocks and scenarios
 * for consistent testing of OpenAI API interactions and error handling.
 */

import * as sinon from 'sinon';

/**
 * OpenAI API response fixtures
 */
export class OpenAIFixtures {
    /**
     * Logic Step: Successful PRD generation response
     */
    public static readonly PRD_GENERATION_SUCCESS = {
        id: 'chatcmpl-test-prd-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: `# Product Requirements Document

## Overview
This is a comprehensive PRD for the AI-powered extension that helps developers generate product requirements documents from their codebase.

## Features
1. **Codebase Analysis**: Automatically scans and analyzes project structure
2. **AI-Powered Generation**: Uses OpenAI GPT models to generate comprehensive PRDs
3. **Context Cards**: Creates reusable context cards for development patterns
4. **Visual Diagrams**: Generates Mermaid diagrams for data flow and component hierarchy

## Technical Requirements
- VS Code Extension API compatibility
- OpenAI API integration
- TypeScript implementation
- Comprehensive testing framework

## Success Metrics
- User adoption rate > 80%
- PRD generation accuracy > 90%
- Time savings > 50% compared to manual PRD creation`
            },
            finish_reason: 'stop'
        }],
        usage: {
            prompt_tokens: 1500,
            completion_tokens: 800,
            total_tokens: 2300
        }
    };

    /**
     * Logic Step: Successful context card generation response
     */
    public static readonly CONTEXT_CARD_SUCCESS = {
        id: 'chatcmpl-test-context-456',
        object: 'chat.completion',
        created: 1234567891,
        model: 'gpt-4o',
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: `# Architecture Context Card

## Component Overview
The AI PRD Generator follows a modular architecture with clear separation of concerns:

### Core Components
1. **Extension Host**: Main VS Code extension entry point
2. **Webview Manager**: Handles UI rendering and user interactions
3. **AI Service**: Manages OpenAI API communications
4. **File System Service**: Handles file operations and project scanning
5. **State Manager**: Manages project state and configuration

### Data Flow
User Input → Webview → Extension Host → AI Service → OpenAI API → Response Processing → File Output

### Key Patterns
- Command Pattern for user actions
- Observer Pattern for state changes
- Factory Pattern for service creation
- Strategy Pattern for different AI models`
            },
            finish_reason: 'stop'
        }],
        usage: {
            prompt_tokens: 1200,
            completion_tokens: 600,
            total_tokens: 1800
        }
    };

    /**
     * Logic Step: Successful CCS analysis response
     */
    public static readonly CCS_ANALYSIS_SUCCESS = {
        id: 'chatcmpl-test-ccs-789',
        object: 'chat.completion',
        created: 1234567892,
        model: 'gpt-4o',
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: `# Code Comprehension Score Analysis

## Overall Score: 86/100

### Breakdown
- **Documentation Quality**: 9/10 - Comprehensive README and inline comments
- **Code Organization**: 8/10 - Clear modular structure with some room for improvement
- **Test Coverage**: 8/10 - Good test coverage with comprehensive test suite
- **Type Safety**: 9/10 - Strong TypeScript usage throughout
- **Error Handling**: 8/10 - Consistent error handling patterns
- **Maintainability**: 9/10 - Well-structured with clear separation of concerns

### Recommendations
1. Add more integration tests for complex workflows
2. Improve error message consistency across modules
3. Consider adding performance benchmarks
4. Enhance API documentation with examples

### Strengths
- Excellent TypeScript implementation
- Comprehensive testing framework
- Clear architectural patterns
- Good documentation coverage`
            },
            finish_reason: 'stop'
        }],
        usage: {
            prompt_tokens: 2000,
            completion_tokens: 1000,
            total_tokens: 3000
        }
    };

    /**
     * Logic Step: API rate limit error response
     */
    public static readonly RATE_LIMIT_ERROR = {
        error: {
            message: 'Rate limit reached for requests',
            type: 'rate_limit_error',
            param: null,
            code: 'rate_limit_exceeded'
        }
    };

    /**
     * Logic Step: API authentication error response
     */
    public static readonly AUTH_ERROR = {
        error: {
            message: 'Invalid API key provided',
            type: 'invalid_request_error',
            param: null,
            code: 'invalid_api_key'
        }
    };

    /**
     * Logic Step: API quota exceeded error response
     */
    public static readonly QUOTA_ERROR = {
        error: {
            message: 'You exceeded your current quota, please check your plan and billing details',
            type: 'insufficient_quota',
            param: null,
            code: 'insufficient_quota'
        }
    };

    /**
     * Logic Step: API server error response
     */
    public static readonly SERVER_ERROR = {
        error: {
            message: 'The server had an error while processing your request',
            type: 'server_error',
            param: null,
            code: 'server_error'
        }
    };

    /**
     * Logic Step: Network timeout error
     */
    public static readonly TIMEOUT_ERROR = new Error('Request timeout after 30000ms');

    /**
     * Logic Step: Create custom OpenAI response
     * @param content Response content
     * @param model Model used
     * @param usage Token usage information
     * @returns Custom OpenAI response
     */
    public static createCustomResponse(
        content: string,
        model: string = 'gpt-4o',
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } = {
            prompt_tokens: 1000,
            completion_tokens: 500,
            total_tokens: 1500
        }
    ) {
        return {
            id: `chatcmpl-custom-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content
                },
                finish_reason: 'stop'
            }],
            usage
        };
    }

    /**
     * Logic Step: Create custom error response
     * @param message Error message
     * @param type Error type
     * @param code Error code
     * @returns Custom error response
     */
    public static createCustomError(
        message: string,
        type: string = 'invalid_request_error',
        code: string = 'invalid_request'
    ) {
        return {
            error: {
                message,
                type,
                param: null,
                code
            }
        };
    }
}

/**
 * Mock OpenAI API factory for testing
 */
export class MockOpenAIFactory {
    /**
     * Logic Step: Create successful OpenAI API mock
     * @param responses Array of responses to return in sequence
     * @returns Mock OpenAI API instance
     */
    public static createSuccessfulMock(responses: any[] = [OpenAIFixtures.PRD_GENERATION_SUCCESS]): any {
        let callCount = 0;
        
        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        const response = responses[callCount % responses.length];
                        callCount++;
                        return response;
                    })
                }
            }
        };
    }

    /**
     * Logic Step: Create failing OpenAI API mock
     * @param error Error to throw
     * @returns Mock OpenAI API instance that throws errors
     */
    public static createFailingMock(error: any = OpenAIFixtures.AUTH_ERROR): any {
        return {
            chat: {
                completions: {
                    create: sinon.stub().rejects(error)
                }
            }
        };
    }

    /**
     * Logic Step: Create mixed success/failure OpenAI API mock
     * @param successResponses Successful responses
     * @param errors Errors to throw
     * @param pattern Pattern of success/failure (e.g., [true, false, true])
     * @returns Mock OpenAI API with mixed responses
     */
    public static createMixedMock(
        successResponses: any[] = [OpenAIFixtures.PRD_GENERATION_SUCCESS],
        errors: any[] = [OpenAIFixtures.RATE_LIMIT_ERROR],
        pattern: boolean[] = [true, false, true]
    ): any {
        let callCount = 0;
        let successIndex = 0;
        let errorIndex = 0;

        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        const shouldSucceed = pattern[callCount % pattern.length];
                        callCount++;

                        if (shouldSucceed) {
                            const response = successResponses[successIndex % successResponses.length];
                            successIndex++;
                            return response;
                        } else {
                            const error = errors[errorIndex % errors.length];
                            errorIndex++;
                            throw error;
                        }
                    })
                }
            }
        };
    }

    /**
     * Logic Step: Create rate-limited OpenAI API mock
     * @param successAfterAttempts Number of failures before success
     * @returns Mock OpenAI API that succeeds after rate limit attempts
     */
    public static createRateLimitedMock(successAfterAttempts: number = 3): any {
        let callCount = 0;

        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        callCount++;
                        
                        if (callCount <= successAfterAttempts) {
                            throw OpenAIFixtures.RATE_LIMIT_ERROR;
                        }
                        
                        return OpenAIFixtures.PRD_GENERATION_SUCCESS;
                    })
                }
            }
        };
    }

    /**
     * Logic Step: Create timeout simulation mock
     * @param timeoutAfterMs Milliseconds before timeout
     * @returns Mock OpenAI API that times out
     */
    public static createTimeoutMock(timeoutAfterMs: number = 1000): any {
        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        return new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(OpenAIFixtures.TIMEOUT_ERROR);
                            }, timeoutAfterMs);
                        });
                    })
                }
            }
        };
    }
}

/**
 * API request fixtures for testing
 */
export class APIRequestFixtures {
    /**
     * Logic Step: Standard PRD generation request
     */
    public static readonly PRD_GENERATION_REQUEST = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are an expert product manager and technical writer...'
            },
            {
                role: 'user',
                content: 'Generate a comprehensive PRD based on this codebase analysis...'
            }
        ],
        max_tokens: 4000,
        temperature: 0.7
    };

    /**
     * Logic Step: Context card generation request
     */
    public static readonly CONTEXT_CARD_REQUEST = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are an expert software architect...'
            },
            {
                role: 'user',
                content: 'Generate context cards for this codebase...'
            }
        ],
        max_tokens: 3000,
        temperature: 0.5
    };

    /**
     * Logic Step: CCS analysis request
     */
    public static readonly CCS_ANALYSIS_REQUEST = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are an expert code reviewer and documentation analyst...'
            },
            {
                role: 'user',
                content: 'Analyze this codebase for comprehension score...'
            }
        ],
        max_tokens: 2000,
        temperature: 0.3
    };

    /**
     * Logic Step: Create custom API request
     * @param type Request type (prd, context, ccs)
     * @param content User content
     * @param options Additional options
     * @returns Custom API request
     */
    public static createCustomRequest(
        type: 'prd' | 'context' | 'ccs',
        content: string,
        options: {
            model?: string;
            maxTokens?: number;
            temperature?: number;
        } = {}
    ) {
        const baseRequests = {
            prd: APIRequestFixtures.PRD_GENERATION_REQUEST,
            context: APIRequestFixtures.CONTEXT_CARD_REQUEST,
            ccs: APIRequestFixtures.CCS_ANALYSIS_REQUEST
        };

        const baseRequest = baseRequests[type];
        
        return {
            ...baseRequest,
            model: options.model || baseRequest.model,
            max_tokens: options.maxTokens || baseRequest.max_tokens,
            temperature: options.temperature || baseRequest.temperature,
            messages: [
                baseRequest.messages[0], // Keep system message
                {
                    role: 'user',
                    content
                }
            ]
        };
    }
}

/**
 * API performance fixtures for testing
 */
export class APIPerformanceFixtures {
    /**
     * Logic Step: Fast response simulation (< 1 second)
     */
    public static readonly FAST_RESPONSE = {
        response: OpenAIFixtures.PRD_GENERATION_SUCCESS,
        delay: 500
    };

    /**
     * Logic Step: Normal response simulation (1-5 seconds)
     */
    public static readonly NORMAL_RESPONSE = {
        response: OpenAIFixtures.PRD_GENERATION_SUCCESS,
        delay: 2000
    };

    /**
     * Logic Step: Slow response simulation (5-10 seconds)
     */
    public static readonly SLOW_RESPONSE = {
        response: OpenAIFixtures.PRD_GENERATION_SUCCESS,
        delay: 7000
    };

    /**
     * Logic Step: Create performance-aware mock
     * @param scenarios Array of response scenarios with delays
     * @returns Mock with realistic response times
     */
    public static createPerformanceMock(scenarios: Array<{ response: any; delay: number }>) {
        let callCount = 0;

        return {
            chat: {
                completions: {
                    create: sinon.stub().callsFake(async () => {
                        const scenario = scenarios[callCount % scenarios.length];
                        callCount++;

                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(scenario.response);
                            }, scenario.delay);
                        });
                    })
                }
            }
        };
    }
}
