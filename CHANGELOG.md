# Change Log

All notable changes to the "ai-prd-generator" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.4] - 2025-07-28

### Added
- **Intelligent Context Card Generator**: Completely redesigned context card generation to be proactive and intelligent
- **Project Structure Analysis**: Analyzes manifest.json, PRD files, and existing artifacts to understand project needs
- **Smart Context File Recommendations**: Determines what context files would be most valuable based on project type
- **Comprehensive Context Files**: Generates up to 10 different types of context files:
  - Architecture Overview - System design and architectural decisions
  - Data Models Guide - Data structures and database schema
  - API Specification - Endpoints, request/response formats
  - User Flows Guide - User journeys and interaction patterns
  - Component Structure - Frontend organization patterns
  - Security Considerations - Security best practices
  - Deployment Guide - Environment setup and deployment
  - Testing Strategy - Quality assurance guidelines
  - Code Standards - Coding conventions and best practices
  - Project Glossary - Key terms and definitions
- **Windsurf Agent Optimization**: Context files specifically designed to provide rich context for AI development assistance
- **Project Type Detection**: Automatically detects web-app, mobile-app, API, or library projects
- **Technology Stack Analysis**: Extracts tech stack information from PRD content

### Changed
- **Context Card Generation Approach**: Moved from analyzing existing source code to generating proactive guidance documents
- **User Experience**: Context card generation now works on new projects without existing source code
- **File Output**: Generates comprehensive markdown files with detailed guidance instead of simple code analysis

### Fixed
- **Webview Message Handling**: Added proper handlers for info, success, and error messages during context generation
- **User Feedback**: Progress messages and completion notifications now display correctly
- **Empty Project Support**: Context card generation now works effectively on projects with minimal existing code

## [0.1.1] - 2025-01-27

### Fixed
- **Testing Framework**: Completely fixed all failing tests (11 tests resolved)
- **Test Infrastructure**: Established robust, maintainable testing framework with comprehensive mocking
- **Extension Context**: Fixed extension context setup and activation simulation in tests
- **File System Mocking**: Improved VS Code API mocking patterns for FileSystemUtils
- **Webview Communication**: Fixed message handling and property name mismatches in webview tests
- **API Key Storage**: Enhanced secrets storage mocking with proper behavior simulation
- **Command Registration**: Fixed extension activation and command registration testing
- **Type Safety**: Resolved all TypeScript compilation errors in test files

### Improved
- **Test Coverage**: All test categories now passing (unit, integration, extension, webview)
- **Mock Utilities**: Enhanced testUtils.ts with comprehensive VS Code API mocks
- **Test Reliability**: Consistent mocking patterns across all test types
- **CI/CD Ready**: Testing framework now ready for continuous integration
- **Developer Experience**: Robust test foundation for ongoing development

## [0.1.0] - 2025-01-25

### Added
- AI-powered PRD (Product Requirements Document) generation
- Context-aware UI that adapts based on existing project artifacts
- Context Cards generation for detailed feature documentation
- Context Templates generation for structured development guidance
- Visual diagram generation (Data Flow and Component Hierarchy)
- Mermaid diagram viewer for interactive visualization
- Comprehensive type safety with TypeScript interfaces
- Centralized error handling and configuration management
- Project state detection for intelligent UI updates
- OpenAI API integration with configurable models
- Extensible handler architecture for future features

### Features
- Generate comprehensive PRDs from codebase analysis
- Create context cards for individual features and components
- Generate context templates for development workflows
- Visual data flow and component hierarchy diagrams
- Interactive Mermaid diagram rendering
- Smart UI that shows/hides sections based on project state
- Configurable output paths for all generated artifacts
- Real-time project state detection and UI updates

### Technical Improvements
- Complete refactoring with Phase 1-3 implementation
- Eliminated duplicate code across handlers (~600 lines reduced)
- Centralized configuration and error management
- Type-safe UI utilities and comprehensive interfaces
- Structured comment system following project standards
- Extensible base classes for diagram generation

## [Unreleased]

- Future enhancements and feature additions