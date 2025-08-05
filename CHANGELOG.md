# Change Log

## [0.1.22] - 2025-08-05

### 🎯 Root Cause Fix - Duplicate Script Execution Prevention

- **Fixed Duplicate Script Loading**: Implemented global flag to prevent webview script from executing multiple times, which was the root cause of VS Code API "already been acquired" errors
- **Eliminated Race Conditions**: Script now initializes only once, preventing message passing conflicts and state corruption
- **Resolved Core Architecture Issue**: Addressed the fundamental problem that was causing all previous fixes to fail

## [0.1.21] - 2025-08-05

### 🌍 Universal Workspace Support & Core Messaging Fixes

- **Universal Workspace Support**: Removed workspace-specific detection logic - extension now works in any workspace and any VS Code variant
- **Robust VS Code API Acquisition**: Implemented comprehensive fallback strategies for `acquireVsCodeApi()` with multiple detection methods and functional fallbacks
- **Fixed Message Structure Issues**: Added detailed logging and validation to ensure `projectState` is properly structured and sent to webview
- **Complete Fallback State**: Updated fallback project state to include all required fields for proper validation
- **Enhanced Error Handling**: Comprehensive error handling and logging throughout the message passing system

## [0.1.20] - 2025-08-05

### 🚨 Critical Bug Fixes - Root Cause Resolution

- **Fixed Workspace Detection Logic**: Added comprehensive logging and improved workspace detection algorithm in `configManager.ts` to properly identify the ai-prd-generator workspace among multiple open workspaces
- **Resolved VS Code API Acquisition Error**: Implemented robust global singleton pattern for `acquireVsCodeApi()` in `main.ts` with fallback handling to prevent "already been acquired" errors
- **Fixed Project State Validation**: Updated `isValidProjectState()` function in `uiUtils.ts` to include all required fields (`hasHandover`, `handoverFiles`, `handoverCount`, `workspaceUri`) that were causing validation failures
- **Enhanced Error Logging**: Added detailed diagnostic logging throughout the workspace detection and validation processes for better debugging

## [0.1.19] - 2025-08-05

### 🐞 Bug Fixes & Stability Improvements

- **Fixed Workspace Detection**: Implemented a more robust workspace detection strategy in `configManager.ts` to correctly identify the `ai-prd-generator` workspace, even when other projects are open or no file is active. This resolves issues with incorrect project state on initial load.
- **Fixed VS Code API Error**: Resolved the `An instance of the VS Code API has already been acquired` error in the webview by implementing a singleton pattern for `acquireVsCodeApi()` in `main.ts`. This ensures the API is only acquired once, stabilizing webview functionality like setting the API key.

## [0.1.18] - 2025-08-05

### 🏗️ Architectural Redesign - UI Race Condition Fix

**Major Architectural Improvement:**

- **Complete Webview Initialization Redesign**: Implemented comprehensive architectural redesign of webview initialization and message passing system to eliminate recurring UI race conditions
- **New Coordination Protocol**: Added proper handshake between extension and webview to ensure messages are only sent when UI is truly ready
- **Fixed Initial Project State Detection**: Project state is now properly detected and sent on panel load, eliminating blank panel issues
- **Robust Message Sequencing**: API key status is sent immediately, but project state waits for UI confirmation to prevent race conditions

**Technical Implementation:**

- **Added `handleUiReady.ts`**: New handler for UI readiness confirmation from webview
- **Enhanced `handleWebviewReady.ts`**: Proper coordination protocol that waits for UI confirmation
- **Updated UI Initialization**: Webview now sends `uiReady` message after DOM elements are confirmed cached
- **Fixed Missing HTML Elements**: Added required `post-generation-controls` container to webview HTML
- **Message Router Integration**: Registered new coordination protocol handlers

**New Initialization Flow:**
1. Webview loads → sends `webviewReady`
2. Extension responds → sends `apiKeyStatus` immediately
3. Webview initializes UI → sends `uiReady` when DOM ready
4. Extension receives `uiReady` → sends `updateState` with project state
5. Webview processes state → UI updates safely

**Fixes:**
- ✅ Eliminates recurring UI race conditions
- ✅ Fixes blank panel on load
- ✅ Proper initial project state detection
- ✅ Stable UI behavior across all scenarios
- ✅ Foundation for future semantic search integration

## [0.1.14] - 2025-08-03

### 🌐 Cross-Platform Compatibility & Bug Fixes

**Major Improvements:**

- **Enhanced Workspace Detection**: Added multiple fallback strategies for reliable workspace detection across all VS Code variants (VS Code, VS Code Insiders, Cursor, Windsurf, etc.)
- **Robust DOM Initialization**: Implemented retry mechanism for DOM element discovery with cross-platform timing compatibility
- **Fixed Critical Bug**: Resolved `ReferenceError: prdFiles is not defined` in ProjectStateDetector that was preventing project state detection
- **Cross-Platform Path Handling**: Updated all path operations to use VS Code URI APIs for Windows, macOS, and Linux compatibility
- **Enhanced Error Handling**: Added comprehensive error logging with VS Code variant detection for better debugging

**Technical Details:**

- Added `getWorkspaceUri()` with multiple detection strategies (workspace folders, active editor, workspace file)
- Implemented `initializeElementsWithRetry()` for robust DOM element initialization
- Fixed variable scope issue in `ProjectStateDetector.findPRDFiles` method
- Added DOM ready state checking and DOMContentLoaded event handling
- Enhanced error logging with structured context including VS Code variant information

**Compatibility:**

- ✅ VS Code (all versions)
- ✅ VS Code Insiders
- ✅ Cursor
- ✅ Windsurf
- ✅ Other VS Code-based editors
- ✅ Windows, macOS, Linux
- ✅ Any project workspace configuration

## [0.1.13] - 2025-08-03

### Added

- **Enhanced CCS Backend Infrastructure**: Complete backend implementation for semantic-powered Code Comprehension Score analysis
  - `CodebaseLensIntegrationService`: Integrates with Codebase Lens extension for semantic search capabilities
  - `EnhancedCcsService`: Weighted scoring algorithm using semantic metrics (25% documentation, 20% code quality, 20% testing, 15% architecture, 10% debt penalty, 10% structure)
  - `EnhancedCodebaseAnalysis` interfaces: Comprehensive type definitions for enhanced analysis, score breakdowns, and comparison reports
  - `handleGenerateEnhancedCCS`: Webview handler for enhanced CCS generation with progress reporting
  - `EnhancedCCSPromptTemplate`: AI prompt generation leveraging semantic search results

### Enhanced

- **CCS Scoring Range**: Expanded from 30-70% (basic analysis) to 15-95% (semantic analysis) for more nuanced assessment
- **Semantic Analysis Capabilities**:
  - Documentation quality assessment beyond file existence
  - Technical debt quantification (TODO/FIXME tracking, known issues, legacy code indicators)
  - Architecture pattern recognition (auth systems, data flow, API design, database modeling)
  - Code quality indicators (testing maturity, security practices, performance considerations)

### Technical

- **Fallback Mechanisms**: Graceful degradation when Codebase Lens extension unavailable
- **Command Registration**: Added `GENERATE_ENHANCED_CCS` command for enhanced analysis
- **Type Safety**: Fixed TypeScript compilation errors in test fixtures for ProjectState interface
- **Error Handling**: Comprehensive error handling and user feedback for semantic analysis

### Notes

- Enhanced CCS backend infrastructure complete (Phase 1)
- UI integration for enhanced CCS pending (Phase 2)
- Maintains full backward compatibility with existing basic CCS analysis

## [0.1.12] - 2025-07-30

### Fixed

- Resolved an issue with the "Generate Handover Document" command by ensuring it uses the shared `PanelManager` instance correctly, preventing UI conflicts.
- Added the missing command registration for handover document generation in the message handler.

### Changed

- Refactored the test runner to execute the entire test suite, not just a single file, by creating a centralized test suite entry point.
- Improved and standardized documentation for `codebaseAnalysisService.ts` and `fileSystemUtils.ts` for better clarity and maintainability.

### Added

- Created a new test suite entry point (`src/test/suite/index.ts`) to discover and run all tests dynamically.

All notable changes to the "ai-prd-generator" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.11] - 2025-07-28

### Fixed

- **TypeScript Test Suite**: Resolved 37+ TypeScript errors across test files
- **Error Handling**: Added comprehensive unknown error type checking in catch blocks
- **Dependency Resolution**: Removed @types/glob in favor of built-in glob types
- **Test Stability**: Fixed property initialization issues in test base classes
- **Type Safety**: Added proper type assertions and null checks

### Improved

- **Test Coverage**: Enhanced test reliability and maintainability
- **Code Quality**: Added defensive programming patterns throughout test suite
- **Build Process**: Clean TypeScript compilation with strict type checking
- **Dependency Management**: Resolved version conflicts in test dependencies

### Technical

- **Test Infrastructure**: Improved mock implementations and test isolation
- **Type Definitions**: Enhanced type safety in test utilities and fixtures
- **Error Messages**: More descriptive error reporting in test failures

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
