
import { Document } from "@langchain/core/documents";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import "dotenv/config";
// storing data in Vector DB
export async function docEmbedding() {
    //     const loader = new CheerioWebBaseLoader(url);
    //   const parseDocs = await loader.load();

    //     const DocsWithMeta = parseDocs.map((doc) => {
    //         doc.metadata.source = url
    //         return doc;
    //     });


    const docs = [new Document({
        pageContent: "Ben is a programmer",
        metadata: {
            userId: "ben123"
        }
    }),
    new Document({
        pageContent: "John is a Driver",
        metadata: {
            userId: "john123"
        }
    }),
    new Document({
        pageContent: "john bio ",
        metadata: {
            userId: "john123"
        }
    })
]

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4000,
        chunkOverlap: 200,
    });

    const allSplits = await textSplitter.splitDocuments(docs);

    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });


    await vectorStore.addDocuments(allSplits);


    console.log("finished embedding... doc ");


}

// await docEmbedding()


// retrieving data from vector db
 async function queryVectorDB(query) {

    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({
        apiKey:process.env.PINECONE_API_KEY,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });
    const result = await vectorStore.similaritySearch(query,10,{
        userId:"john123"
    })

    return result
}
const result=await queryVectorDB("j bio")
console.log(result)
