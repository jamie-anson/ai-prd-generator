/**
 * Defines the structure for the complete PRD output from the AI service.
 */
export interface PrdJson {
    title: string;
    purpose: string;
    goals: string[];
    userRoles: string[];
    features: Array<{ id: string; title: string; requirements: string[]; }>;
    technicalRequirements: {
        frontend: { stack: string; notes: string; };
        backend: { stack: string; notes: string; };
        database: { stack: string; notes: string; };
    };
    nonFunctionalRequirements: {
        security: string;
        scalability: string;
        performance: string;
    };
    userJourneys: Record<string, string[]>;
    successMetrics: string[];
    futureEnhancements: string[];
}

export interface PrdOutput {
    markdown: string;
    json: PrdJson;
    graph: any;
}
