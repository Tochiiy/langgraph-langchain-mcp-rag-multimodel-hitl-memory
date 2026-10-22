
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { ChatCerebras } from "@langchain/cerebras";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'

import { Document } from "@langchain/core/documents";
import z from 'zod'
import {queryMultiVector} from './multi-vector-retriever.js'


import "dotenv/config";


import { ChatCerebras } from "@langchain/cerebras";

// // free 200K
const llm = new ChatCerebras({
    model: "llama-3.3-70b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.CEREBRAS_API_KEY
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
    const result = await vectorStore.similaritySearch(query,10)

    return result
}


const query = 'what is Chain-of-Thought (CoT)'




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


export const GENERATE_RESPONSE_PROMPT = PromptTemplate.fromTemplate(
    `
You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
If you don't know the answer, just say that you don't know.
Question: {question} 
Context: {context} 
Answer:

`
);




const structuredLlm = llm.withStructuredOutput(z.object({
    questions: z.array(z.string()).describe('array of questions for semantic search retrieval')
}).describe('array of questions for semantic search retrieval'));

const chain = QUERY_TRANSFORMATION_PROMPT.pipe(structuredLlm)


const generatedQuestions = await chain.invoke({ question: query });



const formatDocumentsAsString = (documents) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
};

// const docToString = formatDocumentsAsString(result)
const questions = generatedQuestions?.questions


const retrievedDoc = []




for (const question of questions) {
    console.log(question)
    const result = await queryMultiVector({docId:"ben123",query:question}) 
    retrievedDoc.push(result?.retrievedDocs)
}

const flatteredDocs = retrievedDoc.flat();

const flatteredDocsToString=formatDocumentsAsString(flatteredDocs)

const chain2 = GENERATE_RESPONSE_PROMPT.pipe(llm);

const aiResponse = await chain2.invoke({
   question:query,
   context:flatteredDocsToString
});

console.log(aiResponse)


// const user1='1'
// const user2='é'



// const doc1=new Document({
//     pageContent:"data....",
//     metadata:{
//         source:"",
//         url:"",
//         pageNumber:"",
//         user1
//     }
// })

// const doc2=new Document({
//     pageContent:"data....",
//     metadata:{
//         source:"",
//         url:"",
//         pageNumber:"",
//         user2
//     }
// })
// 
// function fetchDocsFromVector(userId,query)