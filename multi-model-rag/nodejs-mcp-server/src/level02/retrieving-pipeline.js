

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { v4 as uuidv4 } from 'uuid';

import {
    ContextualCompressionRetriever
} from "@langchain/classic/retrievers/contextual_compression";
import { LLMChainExtractor } from "@langchain/classic/retrievers/document_compressors/chain_extract";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";

import { formatDocumentsAsString } from './utils.js'
import "dotenv/config";


export async function queryMultiVector(query) {

    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });


    // STEP 1: Child docs
    const childDocs = await vectorStore.similaritySearch(query, 6,
        { docType: "child" }
    );

    const imageSummaries = await vectorStore.similaritySearch(query, 2,
        { docType: "imageSummary" }
    );


    const parentChunkIds = [...new Set(childDocs.map(c => c.metadata.parentId))];
      const parentChunkIdsWithOutNull=parentChunkIds.filter((item)=>item!==null && item!==undefined)
    

    const retrievedParentDocs = await vectorStore.similaritySearch(query, 3, {
        docType: "parent",
        source: { $in: parentChunkIdsWithOutNull }
    })

   

    return {
        query,
        imageSummaries,
        retrievedParentDocs
    };
}




// queries :://
// const queries=[
//   'Different types of memory architectures in AI agents',
//   'Categories of memory systems for autonomous agents',
// //   'Agent memory types: episodic, semantic, and working memory in AI'
// ]


    









