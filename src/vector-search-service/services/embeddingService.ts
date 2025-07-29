// src/vector-search-service/services/embeddingService.ts

import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { config } from '../config';

/**
 * @file Manages the generation of vector embeddings from text.
 * @description This service loads a pre-trained Universal Sentence Encoder model
 * and uses it to convert text chunks into high-dimensional vectors.
 */

export class EmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;

  constructor() {}

  /**
   * Loads the Universal Sentence Encoder model.
   * This needs to be called before embeddings can be generated.
   */
  private async loadModel(): Promise<void> {
    if (this.model) {
      return;
    }
    try {
      this.model = await use.load();
      console.log('Universal Sentence Encoder model loaded successfully.');
    } catch (error) {
      console.error('Failed to load the embedding model:', error);
      throw new Error('Could not load the embedding model.');
    }
  }

  /**
   * Generates a vector embedding for a single piece of text.
   * @param text The text to embed.
   * @returns A promise that resolves to an array of numbers representing the embedding.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.model) {
      await this.loadModel();
    }
    if (!this.model) {
      throw new Error('Embedding model is not loaded.');
    }

    const tensor = await this.model.embed([text]);
    const embedding = await tensor.array();
    tensor.dispose(); // Correctly dispose the tensor
    return embedding[0];
  }

  /**
   * Generates embeddings for a batch of documents.
   * @param documents An array of text chunks to embed.
   * @returns A promise that resolves to a 2D array of embeddings.
   */
  async batchEmbed(documents: string[]): Promise<number[][]> {
    if (!this.model) {
      await this.loadModel();
    }
    if (!this.model) {
      throw new Error('Embedding model is not loaded.');
    }

    const tensor = await this.model.embed(documents);
    const embeddings = await tensor.array();
    tensor.dispose(); // Correctly dispose the tensor
    return embeddings;
  }
}
