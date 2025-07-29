// test/services/chunkingService.test.ts

import { expect } from 'chai';
import 'mocha';
import { ChunkingService } from '../../services/chunkingService';
import { config } from '../../config';

/**
 * @file Unit tests for the ChunkingService.
 * @description These tests verify that the text chunking logic works correctly
 * for various inputs and configurations.
 */

describe('ChunkingService', () => {
  let chunkingService: ChunkingService;

  before(() => {
    // Override config for predictable tests
    config.chunking.chunkSize = 100;
    config.chunking.chunkOverlap = 20;
    chunkingService = new ChunkingService();
  });

  it('should return an empty array for null or empty input', () => {
    expect(chunkingService.chunk('')).to.be.an('array').that.is.empty;
    // @ts-ignore to test invalid input
    expect(chunkingService.chunk(null)).to.be.an('array').that.is.empty;
  });

  it('should not chunk text smaller than the chunk size', () => {
    const shortText = 'This is a short text.';
    const chunks = chunkingService.chunk(shortText);
    expect(chunks).to.have.lengthOf(1);
    expect(chunks[0]).to.equal(shortText);
  });

  it('should chunk text larger than the chunk size', () => {
    const longText = 'a'.repeat(150);
    const chunks = chunkingService.chunk(longText);
    expect(chunks).to.have.lengthOf(2);
    expect(chunks[0]).to.have.lengthOf(100);
    expect(chunks[1]).to.have.lengthOf(70); // 150 - (100 - 20) = 70
  });

  it('should handle overlap correctly between chunks', () => {
    const text = 'a'.repeat(100) + 'b'.repeat(50);
    const chunks = chunkingService.chunk(text);
    const firstChunk = chunks[0];
    const secondChunk = chunks[1];

    const overlapContent = firstChunk.slice(config.chunking.chunkSize - config.chunking.chunkOverlap);
    expect(secondChunk.startsWith(overlapContent)).to.be.true;
  });

  it('should handle text that is exactly the chunk size', () => {
    const text = 'a'.repeat(100);
    const chunks = chunkingService.chunk(text);
    expect(chunks).to.have.lengthOf(1);
    expect(chunks[0]).to.equal(text);
  });

  it('should handle text that results in multiple full-sized chunks', () => {
    const text = 'a'.repeat(260);
    const chunks = chunkingService.chunk(text);
    // Trace:
    // 1. 0-100 (length 100)
    // 2. 80-180 (length 100)
    // 3. 160-260 (length 100)
    // Total chunks: 3
    expect(chunks).to.have.lengthOf(3);
    expect(chunks[0]).to.have.lengthOf(100);
    expect(chunks[1]).to.have.lengthOf(100);
    expect(chunks[2]).to.have.lengthOf(100);
  });
});
