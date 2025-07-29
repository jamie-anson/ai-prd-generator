# Vector Storage Implementation Plan: Standalone Vector Search Service

This document outlines the implementation plan for creating a standalone vector storage and semantic search module. This module will be developed independently first and then integrated into the `ai-prd-generator` VS Code extension in a later phase.

---

## Phase 1: Core Standalone Module

**Goal:** Build the fundamental components for document processing, embedding, and vector storage, completely decoupled from the VS Code extension.

**Tasks:**

1.  **Project Setup:**
    *   Create a new directory `src/vector-search-service` to house the standalone module.
    *   Initialize a `package.json` with necessary dependencies:
        *   `@chroma-core/client` for ChromaDB interaction.
        *   `@tensorflow/tfjs-node` and `@tensorflow-models/universal-sentence-encoder` for embedding generation.
        *   `typescript`, `ts-node`, `@types/node` for development.

2.  **Configuration Service (`src/vector-search-service/config.ts`):**
    *   Develop a simple configuration manager for model names, ChromaDB connection details, and chunking parameters.

3.  **Core Services:**
    *   **Chunking Service (`src/vector-search-service/services/chunkingService.ts`):**
        *   Implement logic to split large text documents into smaller, overlapping chunks suitable for embedding.
    *   **Embedding Service (`src/vector-search-service/services/embeddingService.ts`):**
        *   Create a service to generate vector embeddings for text chunks using the Universal Sentence Encoder.
    *   **Vector DB Service (`src/vector-search-service/services/vectorDbService.ts`):**
        *   Implement a wrapper around the ChromaDB client to handle collection creation, document insertion, and querying.

4.  **Main Orchestrator (`src/vector-search-service/index.ts`):**
    *   Create a main entry point that orchestrates the services to process and index a given file or directory.

---

## Phase 2: API & CLI

**Goal:** Expose the core module's functionality through a simple API and provide a command-line tool for testing and interaction.

**Tasks:**

1.  **Simple API Layer (`src/vector-search-service/api.ts`):**
    *   Use `express` to create a lightweight server.
    *   Define endpoints:
        *   `POST /index`: To index a file or directory path provided in the request body.
        *   `GET /search`: To perform a semantic search with a given query.
        *   `GET /status`: To check the status of the vector database.

2.  **CLI Tool (`src/vector-search-service/cli.ts`):**
    *   Develop a basic command-line interface using `commander` or a similar library.
    *   Implement commands:
        *   `index <path>`: To index a specified file or directory.
        *   `search "<query>"`: To run a search query against the indexed documents.

---

## Phase 3: Testing

**Goal:** Ensure the reliability and correctness of the standalone service.

**Tasks:**

1.  **Unit Tests:**
    *   Write unit tests for the `ChunkingService` with various text inputs.
    *   Mock the `EmbeddingService` and `VectorDbService` to test the main orchestrator's logic.

2.  **Integration Tests:**
    *   Write integration tests for the API endpoints to ensure they work end-to-end.
    *   Use the CLI tool in test scripts to validate the full workflow.

---

## Phase 4: Integration Strategy for VS Code Extension

**Goal:** Define a clear plan for integrating the standalone service into the `ai-prd-generator` extension.

**Tasks:**

1.  **Communication Protocol:**
    *   Decide on the integration method: running the service as a child process, calling the local API, or packaging it as a library.
    *   Define the data contracts for communication between the extension and the service.

2.  **Extension-Side Implementation:**
    *   Create a new `VectorSearchManager` in the extension to handle communication with the standalone service.
    *   Develop the UI components in the webview to trigger indexing and display search results.

3.  **Packaging and Deployment:**
    *   Determine how to bundle the standalone service with the VSIX package or manage it as a separate dependency.

#### `src/services/embedding/embeddingService.ts`
```typescript
interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  batchEmbed(documents: string[]): Promise<number[][]>;
  findSimilar(embedding: number[], topK: number): Promise<SearchResult[]>;
}
```

#### `src/services/vectorStore/vectorStore.ts`
```typescript
interface VectorStore {
  addDocument(id: string, content: string, metadata: object): Promise<void>;
  search(query: string, topK: number): Promise<SearchResult[]>;
  findSimilarVectors(embedding: number[], topK: number): Promise<SearchResult[]>;
  deleteDocument(id: string): Promise<boolean>;
}
```

## Phase 2: UI/UX Design

### 2.1 Navigation Structure
```
┌───────────────────────────────────────────────────────┐
│  [🔍 Explore]  [📝 Create]  [⚡ Actions]  [⚙️ Manage]  │  ← Top-level navigation
├───────────────────────────────────────────────────────┤
│  Context Panel (dynamic based on selection)           │
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │              Main Content Area                │    │
│  │  (Changes based on user selection/context)    │    │
│  └───────────────────────────────────────────────┘    │
│                                                       │
│  [🔄 Refresh]  [💾 Save]  [📤 Export]  [❓ Help]       │  ← Global actions
└───────────────────────────────────────────────────────┘
```

### 2.2 Core UI Components

#### 2.2.1 Explore Panel (🔍)
- **Semantic Search**
  - Natural language search across all content
  - Visual results with relevance scores
  - Filter by content type (PRDs, Code, Docs)

#### 2.2.2 Create Panel (📝)
- **New Document Wizard**
  - Template selection
  - Context-aware suggestions
  - Quick start with AI assistance

#### 2.2.3 Actions Panel (⚡)
- **Quick Actions**
  - Find Similar (🔄)
  - Generate Documentation (📄)
  - Create Diagram (📊)

#### 2.2.4 Manage Panel (⚙️)
- **Vector Management**
  - Storage statistics
  - Indexing status
  - Cleanup tools

### 2.3 Context-Aware Interface
- **Dynamic Sidebar**
  - Shows relevant controls based on current file/context
  - Quick access to related documents
  - Task-specific actions

### 2.4 Visual Design
- **Theming**
  - Light/Dark mode support
  - Customizable accent colors
  - Consistent iconography

- **Responsive Layout**
  - Adapts to different window sizes
  - Collapsible panels
  - Touch-friendly controls

## Phase 3: Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Set up ChromaDB
- [ ] Implement embedding service
- [ ] Create vector store implementation

### Week 2: Document Processing
- [ ] Implement document chunking
- [ ] Add embedding generation
- [ ] Set up vector indexing

### Week 3: UI Integration
- [ ] Add search panel component
- [ ] Implement search results display
- [ ] Add vector management UI

### Week 4: Testing & Optimization
- [ ] Add unit tests
- [ ] Performance testing
- [ ] Optimize embedding generation

## UI Mockups

### 3.1 Main Workspace
```
┌───────────────────────────────────────────────────────┐
│  [🔍] Explore  [📝] Create  [⚡] Actions  [⚙️] Manage  │
├───────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │  Context Panel  │  │                          │   │
│  │  • Recent Files │  │                          │   │
│  │  • Related Docs │  │                          │   │
│  │  • Quick Tasks  │  │                          │   │
│  └─────────────────┘  │                          │   │
│                       │                          │   │
│                       │                          │   │
│                       │                          │   │
│                       │                          │   │
│                       │                          │   │
│                       └──────────────────────────┘   │
│                                                      │
│  [🔄] Refresh  [💾] Save  [📤] Export  [❓] Help       │
└──────────────────────────────────────────────────────┘
```

### 3.2 Search Interface
```
┌───────────────────────────────────────────────────────┐
│  [🔍] Explore  [📝] Create  [⚡] Actions  [⚙️] Manage  │
├───────────────────────────────────────────────────────┤
│  Search: [Find authentication middleware   ] [🔍]    │
│  ┌───────────────────────────────────────────────┐   │
│  │  Results for "authentication" (12 found)      │   │
│  │  ┌───────────────────────────────────────┐    │   │
│  │  │ auth-middleware.js (92% match)        │    │   │
│  │  │ src/middleware/authentication.js      │    │   │
│  │  └───────────────────────────────────────┘    │   │
│  │  ┌───────────────────────────────────────┐    │   │
│  │  │ PRD: Auth Flow (88% match)            │    │   │
│  │  │ docs/prd/authentication.md            │    │   │
│  │  └───────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  [🔄] New Search  [💾] Save Search  [⚙️] Filters    │
└──────────────────────────────────────────────────────┘
```

## Technical Considerations

### Performance
- Batch processing for large documents
- Background indexing
- Caching frequent queries

### Security
- Secure storage of embeddings
- Access control for vector operations
- Data privacy considerations

## Future Enhancements
- Automatic tagging using embeddings
- Duplicate detection
- Content gap analysis
- Cross-project search
