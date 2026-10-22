import { Document } from "@langchain/core/documents";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import "dotenv/config";

export async function webFileEmbedding() {
    const urls = [
        "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
        "https://lilianweng.github.io/posts/2023-06-23-agent/"
    ];


    const documentsArray = await Promise.all(
        urls.map(async (url) => {
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();
            return docs
        })
    );


    const docs = documentsArray.flat();


    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const allSplits = await textSplitter.splitDocuments(docs);

    // step 3. embedding

    const embeddings = new CohereEmbeddings({
        model: "embed-english-v3.0",
        apiKey: process.env.COHERE_API_KEY,
    });

    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const vectorStore = new PineconeStore(embeddings, {
        pineconeIndex,
        maxConcurrency: 5,
    });
    await vectorStore.addDocuments(allSplits);


    console.log("finished embedding..., webfile");


}


await webFileEmbedding()