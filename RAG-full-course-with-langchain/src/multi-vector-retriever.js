
import { Document } from "@langchain/core/documents";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from 'uuid';
import {
    ContextualCompressionRetriever
} from "@langchain/classic/retrievers/contextual_compression";
import { LLMChainExtractor } from "@langchain/classic/retrievers/document_compressors/chain_extract";

import { ChatCerebras } from "@langchain/cerebras";

import "dotenv/config";

 async function loadWeb(url) {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  return docs
}


/**
 * 
 * urls is an @Array
 * docI is a @String
 */
async function loadRawDocs(props={urls,docId}) {
    const {urls,docId}=props
    const allDocs = await Promise.all(
        urls.map(async (url) => {
             const docs = await loadWeb(url);
            return docs.map(doc => {
                doc.metadata.originalUrl = url;  
                doc.metadata.source = url;   
                doc.metadata.docId = docId;
                return doc;
            });
        })
    );
    return allDocs.flat();

}

/**
 * 
 * @param {*} props 
 * rawDocs an array of document
 * docId is a string
 */
async function createParentDocs(props={rawDocs,docId}) {
     const {rawDocs,docId}=props
    const parentSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const parentSplits = await parentSplitter.splitDocuments(rawDocs);

    return parentSplits.map((split) => {
        const chunkId = uuidv4();  // UNIQUE ID per chunk
        split.metadata.docType = "parent";
        split.metadata.chunkId = chunkId;
        split.metadata.parentId = chunkId;  // Self-reference
        split.metadata.source = chunkId;
          split.metadata.docId = docId;  

        return split;
    });
}

/**
 * 
 * @param {*} props 
 * rawDocs an array of document = Document[]
 * docId is a string
 */
async function createChildDocs(props={parentDocs,docId}) {

    const {parentDocs,docId}=props
    const childSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 400, chunkOverlap: 50 });
    const childSplits = await childSplitter.splitDocuments(parentDocs);

    return childSplits.map((split, i) => {
        // Get parent metadata for this child
        const parentIndex = Math.floor(i / 4); // ~4 children per parent chunk
        const parentMetadata = parentDocs[parentIndex]?.metadata;

        split.metadata.docType = "child";
        split.metadata.parentId = parentMetadata?.chunkId;  // Link to parent UUID
        split.metadata.chunkId = `child-${parentMetadata?.chunkId}-${i}`;
        split.metadata.source = split.metadata.chunkId;
         split.metadata.docId = docId;   

        return split;
    });
}

/**
 * 
 * urls is an @Array
 * docI is a @String
 */
export async function docEmbeddingMultiVector(props={urls,docId}) {
    const {urls,docId}=props
    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY});
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    console.log("🔄 Loading raw documents...");
    const rawDocs = await loadRawDocs({urls,docId});

    console.log("🔄 Creating parent chunks...");
    const parentDocs = await createParentDocs({rawDocs,docId});

    console.log("🔄 Creating child chunks...");
    const childDocs = await createChildDocs({parentDocs,docId});
   


    console.log("💾 Storing in Pinecone...");
    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    });

    // Store BOTH parent and child chunks in same index
    await vectorStore.addDocuments([...parentDocs, ...childDocs]);

    console.log(`✅ Single index: ${parentDocs.length} parent chunks + ${childDocs.length} child chunks`);
    console.log(`📊 Total documents: ${parentDocs.length + childDocs.length}`);
}



// RETRIEVING PIPELINE
export async function queryMultiVector(props={docId,query}) {
    console.log('retrieving.....')

    const {docId,query}=props
    const kParents = 10

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
    const childDocs = await vectorStore.similaritySearch(query, 10,
        { docType: "child",docId:docId }
    );


    // STEP 2: FIXED parent matching using parentChunkId
    const parentChunkIds = [...new Set(childDocs.map(c => c.metadata.parentId))];
    
    const filteredChunkIds=parentChunkIds.filter((item)=>item!==undefined && item!==null)
    // const parentDocs = await vectorStore.similaritySearch(query, kParents,
    //     {
    //         docType: "parent",
    //         source: { $in: filteredChunkIds }  // Now matches exactly!
    //     }
    // );


      const compressor = LLMChainExtractor.fromLLM(
        new ChatCerebras({
            model: "llama-3.3-70b",
            temperature: 0,
            apiKey: process.env.CEREBRAS_API_KEY,
        })
    )


    const retriever = new ContextualCompressionRetriever({
        baseCompressor: compressor,
        baseRetriever: vectorStore.asRetriever({
            k: kParents,
            filter: {
                docType: "parent",
                source: { $in: filteredChunkIds }
            }
        })


    })

    const retrievedDocs = await retriever.invoke(query)

 
    return {
    //    parentDocs
    retrievedDocs
    };

  
}

// docEmbeddingMultiVector({urls:['https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/'],docId:'ben123'})
// const query = 'Types of prompt engineering'

// What are the different types of prompt engineering techniques?
// Types of prompt engineering methods
// Prompt engineering approaches and their applications

/**
 * 
 * @param {*} Document[] 
 * @returns 
 */
// const formatDocumentsAsString = (documents) => {
//   return documents.map((doc) => doc?.pageContent).join("\n\n");
// };

// const result=await queryMultiVector({docId:'ben123',query:"Prompt engineering approaches and their applications"})
  
// const docToString=formatDocumentsAsString(result?.retrievedDocs)


// console.log(docToString)