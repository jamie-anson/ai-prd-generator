// src/vector-search-service/config.ts

/**
 * @file Manages configuration for the standalone vector search service.
 * @description Centralizes settings for ChromaDB, embedding models, and document processing.
 */

export const config = {
  /**
   * Configuration for the ChromaDB vector store.
   */
  chroma: {
    /**
     * The URL path for the ChromaDB instance.
     * Assumes ChromaDB is running locally.
     */
    path: 'http://localhost:8000',
    /**
     * The name of the collection to store the vectors in.
     */
    collectionName: 'codebase-embeddings',
  },

  /**
   * Configuration for the embedding model.
   */
  embedding: {
    /**
     * The model to use for generating embeddings.
     * We are using the Universal Sentence Encoder from TensorFlow.js.
     */
    model: '@tensorflow-models/universal-sentence-encoder',
  },

  /**
   * Configuration for document chunking.
   */
  chunking: {
    /**
     * The maximum number of characters for each text chunk.
     */
    chunkSize: 1000,
    /**
     * The number of characters to overlap between consecutive chunks.
     * This helps maintain context between chunks.
     */
    chunkOverlap: 200,
  },
};
