/**
 * @ts-nocheck
 * Project State Fixtures for Testing
 * 
 * Logic: Provides standardized project state scenarios and configurations
 * for consistent testing across all project state detection and UI tests.
 */

import { ProjectState } from '../../webview/types';

/**
 * Standard project state scenarios for testing
 */
export class ProjectStateFixtures {
    /**
     * Logic Step: Empty project with no artifacts
     */
    public static readonly EMPTY_PROJECT: ProjectState = {
        hasPRD: false,
        prdFiles: [],
        prdCount: 0,
        hasContextCards: false,
        contextCardFiles: [],
        contextCardCount: 0,
        hasContextTemplates: false,
        contextTemplateFiles: [],
        contextTemplateCount: 0,
        hasDataFlowDiagram: false,
        dataFlowDiagramFiles: [],
        hasComponentHierarchy: false,
        componentHierarchyFiles: [],
        hasCCS: false,
        ccsFiles: [],
        ccsCount: 0
    };

    /**
     * Logic Step: Project with only PRD generated
     */
    public static readonly PRD_ONLY_PROJECT: ProjectState = {
        ...ProjectStateFixtures.EMPTY_PROJECT,
        hasPRD: true,
        prdFiles: ['/workspace/mise-en-place-output/prd/product-requirements.md'],
        prdCount: 1
    };

    /**
     * Logic Step: Project with PRD and context artifacts
     */
    public static readonly PRD_WITH_CONTEXT_PROJECT: ProjectState = {
        ...ProjectStateFixtures.PRD_ONLY_PROJECT,
        hasContextCards: true,
        contextCardFiles: [
            '/workspace/mise-en-place-output/context-cards/architecture-card.md',
            '/workspace/mise-en-place-output/context-cards/api-card.md'
        ],
        contextCardCount: 2,
        hasContextTemplates: true,
        contextTemplateFiles: [
            '/workspace/mise-en-place-output/context-templates/component-template.md'
        ],
        contextTemplateCount: 1
    };

    /**
     * Logic Step: Fully populated project with all artifacts
     */
    public static readonly COMPLETE_PROJECT: ProjectState = {
        hasPRD: true,
        prdFiles: [
            '/workspace/mise-en-place-output/prd/product-requirements.md',
            '/workspace/mise-en-place-output/prd/technical-specs.md'
        ],
        prdCount: 2,
        hasContextCards: true,
        contextCardFiles: [
            '/workspace/mise-en-place-output/context-cards/architecture-card.md',
            '/workspace/mise-en-place-output/context-cards/api-card.md',
            '/workspace/mise-en-place-output/context-cards/database-card.md'
        ],
        contextCardCount: 3,
        hasContextTemplates: true,
        contextTemplateFiles: [
            '/workspace/mise-en-place-output/context-templates/component-template.md',
            '/workspace/mise-en-place-output/context-templates/service-template.md'
        ],
        contextTemplateCount: 2,
        hasDataFlowDiagram: true,
        dataFlowDiagramFiles: ['/workspace/mise-en-place-output/diagrams/data-flow.mmd'],
        hasComponentHierarchy: true,
        componentHierarchyFiles: ['/workspace/mise-en-place-output/diagrams/component-hierarchy.mmd'],
        hasCCS: true,
        ccsFiles: [
            '/workspace/mise-en-place-output/ccs/analysis.md',
            '/workspace/mise-en-place-output/ccs/documentation.md'
        ],
        ccsCount: 2
    };

    /**
     * Logic Step: Project with multiple PRDs (edge case)
     */
    public static readonly MULTI_PRD_PROJECT: ProjectState = {
        ...ProjectStateFixtures.EMPTY_PROJECT,
        hasPRD: true,
        prdFiles: [
            '/workspace/mise-en-place-output/prd/product-requirements-v1.md',
            '/workspace/mise-en-place-output/prd/product-requirements-v2.md',
            '/workspace/mise-en-place-output/prd/technical-specs.md',
            '/workspace/mise-en-place-output/prd/api-specs.md'
        ],
        prdCount: 4
    };

    /**
     * Logic Step: Project with diagrams but no other artifacts
     */
    public static readonly DIAGRAMS_ONLY_PROJECT: ProjectState = {
        ...ProjectStateFixtures.EMPTY_PROJECT,
        hasDataFlowDiagram: true,
        dataFlowDiagramFiles: ['/workspace/mise-en-place-output/diagrams/data-flow.mmd'],
        hasComponentHierarchy: true,
        componentHierarchyFiles: ['/workspace/mise-en-place-output/diagrams/component-hierarchy.mmd']
    };

    /**
     * Logic Step: Create custom project state with overrides
     * @param overrides Partial project state to override defaults
     * @returns Custom project state
     */
    public static createCustomProject(overrides: Partial<ProjectState>): ProjectState {
        return {
            ...ProjectStateFixtures.EMPTY_PROJECT,
            ...overrides
        };
    }

    /**
     * Logic Step: Get all standard project scenarios
     * @returns Array of all predefined project states with labels
     */
    public static getAllScenarios(): Array<{ label: string; state: ProjectState }> {
        return [
            { label: 'Empty Project', state: ProjectStateFixtures.EMPTY_PROJECT },
            { label: 'PRD Only Project', state: ProjectStateFixtures.PRD_ONLY_PROJECT },
            { label: 'PRD with Context Project', state: ProjectStateFixtures.PRD_WITH_CONTEXT_PROJECT },
            { label: 'Complete Project', state: ProjectStateFixtures.COMPLETE_PROJECT },
            { label: 'Multi-PRD Project', state: ProjectStateFixtures.MULTI_PRD_PROJECT },
            { label: 'Diagrams Only Project', state: ProjectStateFixtures.DIAGRAMS_ONLY_PROJECT }
        ];
    }
}

/**
 * File system mock data for project state scenarios
 */
export class FileSystemFixtures {
    /**
     * Logic Step: Mock file system structure for empty project
     */
    public static readonly EMPTY_PROJECT_FILES: Record<string, string[]> = {
        '/workspace/mise-en-place-output': [],
        '/workspace/mise-en-place-output/prd': [],
        '/workspace/mise-en-place-output/context-cards': [],
        '/workspace/mise-en-place-output/context-templates': [],
        '/workspace/mise-en-place-output/diagrams': [],
        '/workspace/mise-en-place-output/ccs': []
    };

    /**
     * Logic Step: Mock file system structure for complete project
     */
    public static readonly COMPLETE_PROJECT_FILES: Record<string, string[]> = {
        '/workspace/mise-en-place-output': [
            'prd', 'context-cards', 'context-templates', 'diagrams', 'ccs'
        ],
        '/workspace/mise-en-place-output/prd': [
            'product-requirements.md', 'technical-specs.md'
        ],
        '/workspace/mise-en-place-output/context-cards': [
            'architecture-card.md', 'api-card.md', 'database-card.md'
        ],
        '/workspace/mise-en-place-output/context-templates': [
            'component-template.md', 'service-template.md'
        ],
        '/workspace/mise-en-place-output/diagrams': [
            'data-flow.mmd', 'component-hierarchy.mmd'
        ],
        '/workspace/mise-en-place-output/ccs': [
            'analysis.md', 'documentation.md'
        ]
    };

    /**
     * Logic Step: Generate file system mock data for project state
     * @param projectState The project state to generate files for
     * @returns Mock file system structure
     */
    public static generateFileSystemMock(projectState: ProjectState): Record<string, string[]> {
        const files: Record<string, string[]> = {
            '/workspace/mise-en-place-output': [],
            '/workspace/mise-en-place-output/prd': [],
            '/workspace/mise-en-place-output/context-cards': [],
            '/workspace/mise-en-place-output/context-templates': [],
            '/workspace/mise-en-place-output/diagrams': [],
            '/workspace/mise-en-place-output/ccs': []
        };

        // Add PRD files
        if (projectState.hasPRD && projectState.prdFiles.length > 0) {
            files['/workspace/mise-en-place-output/prd'] = projectState.prdFiles.map(
                path => path.split('/').pop() || ''
            );
            files['/workspace/mise-en-place-output'].push('prd');
        }

        // Add context card files
        if (projectState.hasContextCards && projectState.contextCardFiles.length > 0) {
            files['/workspace/mise-en-place-output/context-cards'] = projectState.contextCardFiles.map(
                path => path.split('/').pop() || ''
            );
            files['/workspace/mise-en-place-output'].push('context-cards');
        }

        // Add context template files
        if (projectState.hasContextTemplates && projectState.contextTemplateFiles.length > 0) {
            files['/workspace/mise-en-place-output/context-templates'] = projectState.contextTemplateFiles.map(
                path => path.split('/').pop() || ''
            );
            files['/workspace/mise-en-place-output'].push('context-templates');
        }

        // Add diagram files
        if (projectState.hasDataFlowDiagram || projectState.hasComponentHierarchy) {
            const diagramFiles: string[] = [];
            if (projectState.hasDataFlowDiagram) {
                diagramFiles.push(...projectState.dataFlowDiagramFiles.map(path => path.split('/').pop() || ''));
            }
            if (projectState.hasComponentHierarchy) {
                diagramFiles.push(...projectState.componentHierarchyFiles.map(path => path.split('/').pop() || ''));
            }
            files['/workspace/mise-en-place-output/diagrams'] = diagramFiles;
            files['/workspace/mise-en-place-output'].push('diagrams');
        }

        // Add CCS files
        if (projectState.hasCCS && projectState.ccsFiles.length > 0) {
            files['/workspace/mise-en-place-output/ccs'] = projectState.ccsFiles.map(
                path => path.split('/').pop() || ''
            );
            files['/workspace/mise-en-place-output'].push('ccs');
        }

        return files;
    }
}

/**
 * Workspace configuration fixtures for testing
 */
export class WorkspaceFixtures {
    /**
     * Logic Step: Standard workspace folder structure
     */
    public static readonly STANDARD_WORKSPACE = {
        uri: { fsPath: '/workspace' },
        name: 'test-workspace',
        index: 0
    };

    /**
     * Logic Step: Multi-root workspace structure
     */
    public static readonly MULTI_ROOT_WORKSPACE = [
        { uri: { fsPath: '/workspace/frontend' }, name: 'frontend', index: 0 },
        { uri: { fsPath: '/workspace/backend' }, name: 'backend', index: 1 }
    ];

    /**
     * Logic Step: Workspace with custom output paths
     */
    public static readonly CUSTOM_PATHS_WORKSPACE = {
        uri: { fsPath: '/custom/workspace' },
        name: 'custom-workspace',
        index: 0
    };

    /**
     * Logic Step: Create workspace folder mock
     * @param fsPath File system path for workspace
     * @param name Workspace name
     * @returns Mock workspace folder
     */
    public static createWorkspaceFolder(fsPath: string, name: string = 'test-workspace') {
        return {
            uri: { fsPath },
            name,
            index: 0
        };
    }
}

/**
 * Error scenarios for testing error handling
 */
export class ErrorScenarioFixtures {
    /**
     * Logic Step: File system access error
     */
    public static readonly FILE_SYSTEM_ERROR = new Error('EACCES: permission denied, scandir');

    /**
     * Logic Step: Workspace not found error
     */
    public static readonly NO_WORKSPACE_ERROR = new Error('No workspace folders found');

    /**
     * Logic Step: Configuration read error
     */
    public static readonly CONFIG_ERROR = new Error('Failed to read configuration');

    /**
     * Logic Step: Path resolution error
     */
    public static readonly PATH_ERROR = new Error('Invalid path configuration');

    /**
     * Logic Step: Create custom error for testing
     * @param message Error message
     * @param code Optional error code
     * @returns Custom error instance
     */
    public static createCustomError(message: string, code?: string): Error {
        const error = new Error(message);
        if (code) {
            (error as any).code = code;
        }
        return error;
    }
}
