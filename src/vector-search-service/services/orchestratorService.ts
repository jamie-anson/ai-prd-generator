import { ChunkingService } from './chunkingService.js';
import { EmbeddingService } from './embeddingService.js';
import { VectorDbService } from './vectorDbService.js';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * @file Orchestrates the vector search workflow.
 * @description This service coordinates the chunking, embedding, and vector database services
 * to process documents and perform semantic searches.
 */
export class OrchestratorService {
  private chunkingService: ChunkingService;
  private embeddingService: EmbeddingService;
  private vectorDbService: VectorDbService;

  constructor(
    chunkingService: ChunkingService,
    embeddingService: EmbeddingService,
    vectorDbService: VectorDbService
  ) {
    this.chunkingService = chunkingService;
    this.embeddingService = embeddingService;
    this.vectorDbService = vectorDbService;
  }

  /**
   * Initializes the underlying services.
   */
  public async initialize(): Promise<void> {
    console.log('Initializing orchestrator service...');
    await this.vectorDbService.initialize();
    console.log('Orchestrator service initialized.');
  }

  /**
   * Processes a file, chunks its content, and stores the embeddings in the vector database.
   * @param filePath The path to the file to process.
   */
  public async processAndStoreDocument(filePath: string): Promise<void> {
    try {
      console.log(`Processing document: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      const chunks = this.chunkingService.chunk(content);
      const ids = chunks.map(() => uuidv4());

      await this.vectorDbService.addDocuments(chunks, ids);
      console.log(`Successfully processed and stored ${chunks.length} chunks from ${filePath}`);
    } catch (error) {
      console.error(`Failed to process document ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Performs a semantic search against the vector database.
   * @param query The search query.
   * @param topK The number of results to return.
   * @returns The search results.
   */
  public async search(query: string, topK: number = 5): Promise<any> {
    console.log(`Performing search for query: "${query}"`);
    const results = await this.vectorDbService.search(query, topK);
    console.log('Search completed.');
    return results;
  }
}
