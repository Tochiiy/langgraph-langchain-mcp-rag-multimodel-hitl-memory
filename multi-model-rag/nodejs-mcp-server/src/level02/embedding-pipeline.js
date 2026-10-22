import { Document } from "@langchain/core/documents";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fetch from 'node-fetch';
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';

import {  loadRawDocsWithImagesAndTables } from './utils.js'

import "dotenv/config";



/**
 * 2. CHUNKING FUNCTIONS
 */
async function createParentDocs(rawDocs) {
    const parentSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 200 });
    const parentSplits = await parentSplitter.splitDocuments(rawDocs);

    return parentSplits.map((split) => {
        const chunkId = uuidv4();
     
        split.metadata.docType = "parent";
        split.metadata.chunkId = chunkId;
        split.metadata.parentId = chunkId;  // Self-reference
        split.metadata.source = chunkId;
        return split;
    });
}

async function createChildDocs(parentDocs) {
    const childSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 400, chunkOverlap: 50 });
    const childSplits = await childSplitter.splitDocuments(parentDocs);

    return childSplits.map((split, i) => {
     
        const parentIndex = Math.floor(i / 4);
        const parentMetadata = parentDocs[parentIndex]?.metadata;
        split.metadata.docType = "child";
        split.metadata.parentId = parentMetadata?.chunkId; 
        split.metadata.chunkId = `child-${parentMetadata?.chunkId}-${i}`;
        split.metadata.source = split.metadata.chunkId;
     
        return split;
    });
}



/**
 * 4. MAIN ORCHESTRATOR
 */
export async function docEmbeddingMultiVector(urls) {
    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    console.log("🔄 Extraction Phase (Text, Images, Tables)...");
    const {documents:rawDocs,imageSummaries} = await loadRawDocsWithImagesAndTables(urls);

    console.log("🔄 Chunking Phase...");
    const parentDocs = await createParentDocs(rawDocs);
    const childDocs = await createChildDocs(parentDocs);


    console.log("💾 Storing in Pinecone...");
    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    });

    // Final storage push
    await vectorStore.addDocuments([
        ...parentDocs,
        ...childDocs,
        ...imageSummaries
    ]);

    console.log(`✅Finished embedding.....`);
}

// Usage
// await docEmbeddingMultiVector(['https://lilianweng.github.io/posts/2023-06-23-agent/']);



const res=await docEmbeddingMultiVector(['https://lilianweng.github.io/posts/2023-06-23-agent/'])







