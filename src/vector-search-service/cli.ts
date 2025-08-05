#!/usr/bin/env node

import '@tensorflow/tfjs-node';
import { Command } from 'commander';
import { OrchestratorService } from './services/orchestratorService.js';
import { ChunkingService } from './services/chunkingService.js';
import { EmbeddingService } from './services/embeddingService.js';
import { VectorDbService } from './services/vectorDbService.js';

/**
 * @file Provides a command-line interface for the vector search service.
 * @description This script allows users to add files and perform searches
 * directly from the terminal.
 */

// Instantiate services with dependency injection
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();
const vectorDbService = new VectorDbService(embeddingService);
const orchestratorService = new OrchestratorService(
  chunkingService,
  embeddingService,
  vectorDbService
);

const program = new Command();

program
  .name('vector-search-cli')
  .description('A CLI to interact with the vector search service.');

program
  .command('add <file>')
  .description('Process and store a single file in the vector database.')
  .action(async (file: string) => {
    try {
      await orchestratorService.initialize();
      await orchestratorService.processAndStoreDocument(file);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Run a search query against the indexed documents.')
  .option('-k, --topK <number>', 'Number of top results to return', '5')
  .action(async (query: string, options: { topK: string }) => {
    try {
      await orchestratorService.initialize();
      const topK = parseInt(options.topK, 10);
      const results = await orchestratorService.search(query, topK);
      console.log('--- Search Results ---');
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(`Error during search for query "${query}":`, error);
      process.exit(1);
    }
  });

program.parse(process.argv);
