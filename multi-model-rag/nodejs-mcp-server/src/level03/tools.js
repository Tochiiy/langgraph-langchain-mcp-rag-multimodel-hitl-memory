import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts'
import { Document } from "@langchain/core/documents";
import z from 'zod'
import { llm } from './llm.js'
import { queryMultiVector } from "../level02/retrieving-pipeline.js";
import "dotenv/config";


export const retrieverTool = async ({ queries }) => {


    const retrievedDocument = [];

    const retrievedImageDocument = []

    const seenChunkIds = new Set();

    for (const question of queries) {
        const { imageSummaries, retrievedParentDocs } = await queryMultiVector(question);

        const allDocs = [...retrievedParentDocs];
        const allDocSummaries = [...imageSummaries]


        //documents
        for (const doc of allDocs) {
            const chunkId = doc.metadata?.chunkId;
            if (!chunkId) {
                retrievedDocument.push(doc);
                continue;
            }
            if (!seenChunkIds.has(chunkId)) {
                seenChunkIds.add(chunkId);
                retrievedDocument.push(doc);
            }
        }
        // end

        //image summaries 
        for (const doc of allDocSummaries) {
            const imgChunkId = doc.id;
            if (!imgChunkId) {
                retrievedImageDocument.push(doc);
                continue;
            }
            if (!seenChunkIds.has(imgChunkId)) {
                seenChunkIds.add(imgChunkId);
                retrievedImageDocument.push(doc);
            }
        }
        // end image summaries


    }


    const imageUrl = () => {
        return retrievedImageDocument.map((doc) => doc?.metadata?.imageURL).join(",");
    };


    const topDocuments = () => {
        return retrievedDocument.map((doc) => doc?.pageContent).join("\n\n");
    };

    const finalResponse = `
        <retrieved_document>
        ${topDocuments()}
        </retrieved_document>
        <retrieved_images>
        ${imageUrl()}
        </retrieved_images>
    `

    console.log(finalResponse)



    return {
        content: [
            {
                type: "text",
                text: finalResponse,
            },
        ],
    };
};





export const queryTransformerTool = async ({ query }) => {


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

    const structuredLlm = llm.withStructuredOutput(z.object({
        questions: z.array(z.string()).max(3).describe('array of questions for semantic search retrieval')
    }).describe('array of questions for semantic search retrieval'));

    const chain = QUERY_TRANSFORMATION_PROMPT.pipe(structuredLlm)


    const generatedQuestions = await chain.invoke({ question: query });

    const questions = generatedQuestions?.questions


    return {
        content: [
            {
                type: "text",
                text: `here's a List of queries : ${questions.join(',')}`,
            },
        ],
    };
};





















