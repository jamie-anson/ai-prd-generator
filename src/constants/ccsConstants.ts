// @ts-nocheck
/**
 * @file ccsConstants.ts
 * @description Configuration constants for Code Comprehension Score (CCS) analysis.
 * 
 * The logic of this file is to:
 * 1. Centralize all CCS-related configuration values
 * 2. Provide type-safe constants for analysis parameters
 * 3. Define file patterns and extensions for codebase scanning
 * 4. Establish limits to prevent performance issues
 */

/**
 * Logic Step: Core CCS analysis configuration parameters.
 * These values control the depth and scope of codebase analysis.
 */
export const CCS_CONFIG = {
    /** Maximum directory recursion depth to prevent infinite loops and stack overflow */
    MAX_RECURSION_DEPTH: 5,
    
    /** Maximum number of sample files to include in AI analysis (prevents token limit issues) */
    MAX_SAMPLE_FILES: 5,
    
    /** Maximum characters to read from each sample file (prevents memory bloat) */
    SAMPLE_CONTENT_CHARS: 500,
    
    /** Maximum total files to scan before stopping (performance safeguard) */
    MAX_FILES_TO_SCAN: 1000,
    
    /** Timeout for file operations in milliseconds */
    FILE_OPERATION_TIMEOUT: 5000
} as const;

/**
 * Logic Step: File and directory patterns to skip during analysis.
 * These patterns help avoid scanning irrelevant or generated files.
 */
export const SKIP_PATTERNS = [
    // Dependencies and build artifacts
    'node_modules',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    
    // Version control and IDE
    '.git',
    '.svn',
    '.hg',
    '.vscode',
    '.idea',
    
    // OS and temporary files
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '*.cache',
    
    // Package manager files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
] as const;

/**
 * Logic Step: File extensions considered as code files for analysis.
 * Organized by language category for better maintainability.
 */
export const CODE_EXTENSIONS = {
    // Web technologies
    WEB: ['.html', '.css', '.scss', '.sass', '.less'],
    
    // JavaScript ecosystem
    JAVASCRIPT: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'],
    
    // Backend languages
    BACKEND: ['.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.php', '.rb'],
    
    // Mobile
    MOBILE: ['.swift', '.kt', '.dart'],
    
    // Functional
    FUNCTIONAL: ['.scala', '.clj', '.hs', '.elm'],
    
    // Configuration and markup
    CONFIG: ['.json', '.yaml', '.yml', '.toml', '.xml'],
    
    // Documentation
    DOCS: ['.md', '.rst', '.txt', '.adoc']
} as const;

/**
 * Logic Step: Flattened array of all code extensions for easy checking.
 */
export const ALL_CODE_EXTENSIONS = [
    ...CODE_EXTENSIONS.WEB,
    ...CODE_EXTENSIONS.JAVASCRIPT,
    ...CODE_EXTENSIONS.BACKEND,
    ...CODE_EXTENSIONS.MOBILE,
    ...CODE_EXTENSIONS.FUNCTIONAL,
    ...CODE_EXTENSIONS.CONFIG,
    ...CODE_EXTENSIONS.DOCS
] as const;

/**
 * Logic Step: Patterns for detecting test files and directories.
 * Used to assess test coverage in the codebase.
 */
export const TEST_PATTERNS = [
    // Directory patterns
    'test',
    'tests',
    '__tests__',
    'spec',
    'specs',
    'e2e',
    'integration',
    
    // File patterns (without extensions)
    '*.test',
    '*.spec',
    '*.e2e',
    '*.integration'
] as const;

/**
 * Logic Step: Patterns for detecting documentation directories.
 * Used to assess documentation quality in the codebase.
 */
export const DOCUMENTATION_PATTERNS = [
    'docs',
    'documentation',
    'doc',
    'wiki',
    'guides',
    'manual',
    'help'
] as const;

/**
 * Logic Step: Common README file variations.
 * Used to detect project documentation presence.
 */
export const README_PATTERNS = [
    'README.md',
    'README.txt',
    'README.rst',
    'README',
    'readme.md',
    'readme.txt',
    'Readme.md'
] as const;

/**
 * Logic Step: TypeScript-specific files that indicate type safety.
 * Used to assess type definition usage in the project.
 */
export const TYPESCRIPT_PATTERNS = [
    'tsconfig.json',
    'tsconfig.*.json',
    '*.d.ts',
    'types.ts',
    'index.d.ts'
] as const;

/**
 * Logic Step: Configuration files that indicate project structure quality.
 * Used to assess overall project organization and tooling.
 */
export const CONFIG_FILES = [
    // Package managers
    'package.json',
    'composer.json',
    'Cargo.toml',
    'pom.xml',
    'build.gradle',
    
    // Build tools
    'webpack.config.js',
    'vite.config.js',
    'rollup.config.js',
    'gulpfile.js',
    'Makefile',
    
    // Linting and formatting
    '.eslintrc.json',
    '.prettierrc',
    '.editorconfig',
    
    // CI/CD
    '.github/workflows',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    
    // Docker
    'Dockerfile',
    'docker-compose.yml'
] as const;
