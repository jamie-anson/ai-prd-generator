// src/vector-search-service/services/vectorDbService.ts

import { ChromaClient, Collection } from 'chromadb';
import { config } from '../config.js';
import { EmbeddingService } from './embeddingService.js';

/**
 * @file Manages interactions with the ChromaDB vector store.
 * @description This service handles the connection to ChromaDB, collection management,
 * and the insertion and querying of vector embeddings.
 */

export class VectorDbService {
  private client: ChromaClient;
  private collectionName: string;
  private embeddingService: EmbeddingService;
  private collection: Collection | null = null;

  constructor(embeddingService: EmbeddingService, client?: ChromaClient) {
    this.embeddingService = embeddingService;
    this.client = client || new ChromaClient({ path: 'http://localhost:8000' });
    this.collectionName = config.chroma.collectionName;
  }

  /**
   * Initializes the service by getting or creating the ChromaDB collection.
   */
  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: {
          generate: (texts: string[]) => this.embeddingService.batchEmbed(texts),
        },
      });
      console.log(`ChromaDB collection '${this.collectionName}' is ready.`);
    } catch (error) {
      console.error('Failed to initialize ChromaDB collection:', error);
      const initError = new Error(`Could not initialize ChromaDB collection '${this.collectionName}'.`);
      (initError as any).cause = error;
      throw initError;
    }
  }

  /**
   * Adds a batch of documents to the vector store.
   * @param documents An array of text chunks.
   * @param ids An array of unique identifiers for each chunk.
   * @param metadatas Optional array of metadata objects for each chunk.
   */
  public async addDocuments(documents: string[], ids: string[], metadatas?: any[]): Promise<void> {
    if (!this.collection) {
      throw new Error('VectorDbService is not initialized. Call initialize() first.');
    }

    // The embedding function provided during initialization will handle embedding generation.
    await this.collection.add({
      ids,
      documents,
      metadatas,
    });
  }

  /**
   * Performs a semantic search for a given query.
   * @param query The search query text.
   * @param topK The number of top results to return.
   * @returns A promise that resolves to the search results.
   */
  async search(query: string, topK: number = 5): Promise<any> {
    if (!this.collection) {
      throw new Error('VectorDbService is not initialized. Call initialize() first.');
    }

    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const results = await this.collection!.query({ 
      queryEmbeddings: [queryEmbedding], 
      nResults: topK 
    });

    return results;
  }
}
