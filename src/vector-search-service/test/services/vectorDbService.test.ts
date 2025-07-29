// test/services/vectorDbService.test.ts

import { expect } from 'chai';
import * as sinon from 'sinon';
import 'mocha';
import { ChromaClient, Collection } from 'chromadb';
import { VectorDbService } from '../../services/vectorDbService';
import { EmbeddingService } from '../../services/embeddingService';
import { config } from '../../config';

/**
 * @file Unit tests for the VectorDbService.
 * @description These tests verify the interaction with the ChromaDB client
 * and the embedding service, ensuring documents are added and searched correctly.
 */

describe('VectorDbService', () => {
  let vectorDbService: VectorDbService;
  let embeddingServiceStub: sinon.SinonStubbedInstance<EmbeddingService>;
  let chromaClientStub: sinon.SinonStubbedInstance<ChromaClient>;
  let collectionStub: any;

  beforeEach(() => {
    // Stub the EmbeddingService
    embeddingServiceStub = sinon.createStubInstance(EmbeddingService);

    // Stub the ChromaDB client and its collection
    collectionStub = {
      add: sinon.stub(),
      query: sinon.stub().resolves({ ids: [], documents: [], distances: [] }),
    };
    chromaClientStub = sinon.createStubInstance(ChromaClient);
    chromaClientStub.getOrCreateCollection.resolves(collectionStub as any);

    config.chroma.collectionName = 'test-collection';

    // Instantiate the service with the mocked client
    vectorDbService = new VectorDbService(embeddingServiceStub as any, chromaClientStub as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize and get or create a collection', async () => {
    await vectorDbService.initialize();
    expect(chromaClientStub.getOrCreateCollection.calledOnceWith({ name: 'test-collection' })).to.be.true;
  });

  it('should add documents with embeddings to the collection', async () => {
    const documents = ['doc1', 'doc2'];
    const ids = ['id1', 'id2'];
    const embeddings = [[1], [2]];
    embeddingServiceStub.batchEmbed.resolves(embeddings);

    await vectorDbService.initialize();
    await vectorDbService.addDocuments(documents, ids);

    expect(embeddingServiceStub.batchEmbed.calledOnceWith(documents)).to.be.true;
    expect(collectionStub.add.calledOnceWith({
      ids,
      embeddings,
      documents,
      metadatas: undefined,
    })).to.be.true;
  });

  it('should perform a search query', async () => {
    const query = 'search query';
    const queryEmbedding = [0.5];
    const searchResults = { ids: [['id1']], documents: [['doc1']], distances: [[0.1]] };
    embeddingServiceStub.generateEmbedding.resolves(queryEmbedding);
    collectionStub.query.resolves(searchResults as any);

    await vectorDbService.initialize();
    const results = await vectorDbService.search(query);

    expect(embeddingServiceStub.generateEmbedding.calledOnceWith(query)).to.be.true;
    expect(collectionStub.query.calledOnceWith({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
    })).to.be.true;
    expect(results).to.deep.equal(searchResults);
  });

  it('should throw an error if initialization fails', async () => {
    const initError = new Error('Failed to connect');
    chromaClientStub.getOrCreateCollection.rejects(initError);

    try {
      await vectorDbService.initialize();
      expect.fail('Expected an error to be thrown');
    } catch (error: any) {
      expect(error.message).to.contain(`Could not initialize ChromaDB collection 'test-collection'.`);
      expect(error.cause).to.equal(initError);
    }
  });
});
