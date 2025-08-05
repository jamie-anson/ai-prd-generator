// src/vector-search-service/services/chunkingService.ts

import { config } from '../config.js';

/**
 * @file Implements the logic for splitting text into chunks.
 * @description This service is responsible for breaking down large documents into smaller,
 * overlapping chunks to prepare them for the embedding process.
 */

export class ChunkingService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor() {
    this.chunkSize = config.chunking.chunkSize;
    this.chunkOverlap = config.chunking.chunkOverlap;
  }

  /**
   * Splits a given text into smaller, overlapping chunks.
   * @param text The full text of the document to be chunked.
   * @returns An array of text chunks.
   */
  chunk(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      const end = Math.min(i + this.chunkSize, text.length);
      chunks.push(text.slice(i, end));
      if (end === text.length) {
        break;
      }
      i += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}
