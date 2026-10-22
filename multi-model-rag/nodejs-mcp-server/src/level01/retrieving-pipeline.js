
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { Document } from "@langchain/core/documents";
import z from 'zod'
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";

import "dotenv/config";



const llm = new ChatFireworks({
    model: "accounts/fireworks/models/minimax-m2p5",
    temperature: 0.7,
    apiKey: process.env.FIRE_WORKS_API_KEY
});

// retrieving data from vector db
export async function queryVectorDB(query) {

   

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
    const result = await vectorStore.similaritySearch(query,5)

    return result
}

const query = 'Types of Agent Memory'




const QUERY_TRANSFORMATION_PROMPT = PromptTemplate.fromTemplate(`
You are an expert at query rewriting for semantic search and retrieval-augmented generation (RAG).

Step back and think about the user's underlying intent before rewriting the query.

Instructions:
1. Analyze the original question.
2. Identify the core goal, concepts, and implied context.
3. Generate at least 3 alternative rewritten queries that better express the same intent.
4. Each rewritten query should be clear, specific, and optimized for semantic retrieval.
5. Do NOT add explanations or reasoning.

Original question:
-------
{question}
-------
`);


export const GENERATE_RESPONSE_PROMPT = PromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know.
    Question: {question} 
    Context: {context} 
    Answer:

`
);




const structuredLlm = llm.withStructuredOutput(z.object({
    questions: z.array(z.string()).max(3).describe('array of questions for semantic search retrieval')
}).describe('array of questions for semantic search retrieval'));

const chain = QUERY_TRANSFORMATION_PROMPT.pipe(structuredLlm)


const generatedQuestions = await chain.invoke({ question: query });



const formatDocumentsAsString = (documents) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
};

// const docToString = formatDocumentsAsString(result)
const questions = generatedQuestions?.questions


const retrievedDoc = []

console.log(questions)


for (const question of questions) {
    const result = await queryVectorDB(query) 
    retrievedDoc.push(result?.retrievedDocs)
}


// const flatteredDocs = retrievedDoc.flat();

// const flatteredDocsToString=formatDocumentsAsString(flatteredDocs)

// const chainResult = GENERATE_RESPONSE_PROMPT.pipe(llm);

// const aiResponse = await chainResult.invoke({
//    question:query,
//    context:flatteredDocsToString
// });

// console.log(aiResponse)
