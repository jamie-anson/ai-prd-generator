// test/services/embeddingService.test.ts

import { expect } from 'chai';
import * as sinon from 'sinon';
import 'mocha';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { EmbeddingService } from '../../services/embeddingService';

/**
 * @file Unit tests for the EmbeddingService.
 * @description These tests verify that the embedding generation logic works correctly,
 * including model loading and interaction with the TensorFlow.js library.
 */

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let loadStub: sinon.SinonStub;
  let embedStub: sinon.SinonStub;

  beforeEach(() => {
    // Mock the tensorflow model and its methods
    embedStub = sinon.stub().resolves({
      array: sinon.stub().resolves([[0.1, 0.2, 0.3]]),
      dispose: sinon.stub(),
    });

    loadStub = sinon.stub(use, 'load').resolves({
      embed: embedStub,
    } as any);

    embeddingService = new EmbeddingService();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should load the model if not already loaded', async () => {
    await embeddingService.generateEmbedding('test');
    expect(loadStub.calledOnce).to.be.true;
  });

  it('should not load the model if it is already loaded', async () => {
    await embeddingService.generateEmbedding('test');
    await embeddingService.generateEmbedding('another test');
    expect(loadStub.calledOnce).to.be.true; // Should only be called once
  });

  it('should generate a single embedding', async () => {
    const embedding = await embeddingService.generateEmbedding('hello world');
    expect(embedding).to.deep.equal([0.1, 0.2, 0.3]);
    expect(embedStub.calledWith(['hello world'])).to.be.true;
  });

  it('should generate batch embeddings', async () => {
    // Adjust the mock for batch behavior
    embedStub.resolves({
      array: sinon.stub().resolves([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]),
      dispose: sinon.stub(),
    });

    const embeddings = await embeddingService.batchEmbed(['hello', 'world']);
    expect(embeddings).to.have.lengthOf(2);
    expect(embeddings[0]).to.deep.equal([0.1, 0.2, 0.3]);
    expect(embeddings[1]).to.deep.equal([0.4, 0.5, 0.6]);
    expect(embedStub.calledWith(['hello', 'world'])).to.be.true;
  });

  it('should throw an error if the model fails to load', async () => {
    sinon.restore(); // remove previous stubs
    loadStub = sinon.stub(use, 'load').rejects(new Error('Failed to load model'));
    embeddingService = new EmbeddingService(); // re-instantiate with new stub

    try {
      await embeddingService.generateEmbedding('test');
      // Should not reach here
      expect.fail('Expected an error to be thrown');
    } catch (error: any) {
      expect(error.message).to.equal('Could not load the embedding model.');
    }
  });
});
