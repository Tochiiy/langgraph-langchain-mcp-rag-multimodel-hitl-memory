import {
    END,
    START,
    StateGraph,
    Annotation,
    MessagesAnnotation,
} from "@langchain/langgraph";
import { createAgent } from "langchain";
import { z } from "zod";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";

import {
    HALLUCINATION_CHECKER_PROMPT,
    QUERY_REWRITE_PROMPT, GRADE_SYSTEM_PROMPT, SYNTENSIS_RESPONSE_PROMPT, CATEGORIZATION_SYSTEM_PROMPT

} from "./prompts.js";
import { retriever } from "./retrieving-pipeline.js";
import { tool } from "@langchain/core/tools";
import { ChatCerebras } from "@langchain/cerebras";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import "dotenv/config";


const model = new ChatCerebras({
    model: "gpt-oss-120b",
    temperature: 0.7,
    apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    rewriteQueries: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => []
    }),
    nextNode: Annotation({
        default: () => null,
    }),
    retrievedDocuments: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => []
    }),
     generatedAnswer: Annotation({
        default: () => null
    }),
});

// Create the graph
// mainnode
const initialNode = async (state) => {
    const messageHistory = state.messages;


    const structuredLlm = model.withStructuredOutput(z.object({
        nextNode: z.enum(['QUERY_REWRITE', 'OUT_OF_SCOPE'])
    }).describe('nextnode to route to'));

    const result = await structuredLlm.invoke([
        {
            role: "system",
            content: CATEGORIZATION_SYSTEM_PROMPT,
        },
        ...messageHistory
    ]);

    return { nextNode: result?.nextNode };
};


const queryRewriterNode = async (state) => {
    const last = state.messages
        .filter((m) => m._getType() === "human")
        .slice(-1)[0];


    const structuredLlm = model.withStructuredOutput(z.object({
        questions: z.array(z.string()).length(1)
    }).describe('rewrite queries'));

    const result = await structuredLlm.invoke([
        {
            role: "ai",
            content: QUERY_REWRITE_PROMPT,
        },
        {
            role: "user",
            content: last?.content,
        },
    ]);

    const questions = result?.questions

    if (state.rewriteQueries.length === 3) {
        return { nextNode: "searchWebNode",retrievedDocuments: [] }
    }
    return { nextNode: 'retrieverNode', rewriteQueries: [...questions] };
};

const retrieverNode = async (state) => {

    console.log('========Retriever node==========')
    const retrievedDocs = []
    for (const query of state.rewriteQueries) {
        const docs = await retriever(query)
        retrievedDocs.push(docs)
    }
    const flatten = retrievedDocs.flat()
    console.log('========Finished Retrieving ==========')
    return { retrievedDocuments: [...flatten] };
};


const generateNode = async (state) => {

    console.log('====================GENERATION NODE==================')
    const agent = createAgent({
        model,
        systemPrompt: SYNTENSIS_RESPONSE_PROMPT
    })

    const retrievedDocToString = formatDocumentsAsString(state.retrievedDocuments)

    const agentOutput = await agent.invoke({
        messages: [new HumanMessage(`
            User Question:
            <user_questions>
            ${state.rewriteQueries.join("\n")}
            </user_questions>

            Retrieved Data:
            <retrieved_data>
            ${retrievedDocToString}
            </retrieved_data>

      `)],
    });
    const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content

    // console.log('FINAL RESPONSE=================', aiResponse)
     console.log('====================END GENERATION NODE==================')

    return{
        generatedAnswer:aiResponse
    }
};



const hallucinationChecker = async (state) => {

  console.log('============HALLUCINATION CHECKER=================')
    const structuredLlm = model.withStructuredOutput(z.object({
        hallucination: z.enum(['yes','no'])
    }));

    const result = await structuredLlm.invoke([
        {
            role: "ai",
            content: HALLUCINATION_CHECKER_PROMPT,
        },
        {
            role: "user",
            content: `
            User Question:
            <user_questions>
            ${state.rewriteQueries.join("\n")}
            </user_questions>


            Retrieved Data:
            <retrieved_data>
            ${state.generatedAnswer}
            </retrieved_data>

      `,
        },
    ]);
 console.log('============HALLUCINATION CHECKER=================')
    const res=result?.hallucination
    if(res==="yes"){
         console.log('....rewrite....')
        return {nextNode:"QUERY_REWRITE"}
    }
   
};






const formatDocumentsAsString = (documents) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
};


const outOfScopeNode = async (state) => {
    const aiResponse = new AIMessage({
        content:
            "Sorry, I cant assist you with that",
    });

    return { messages: [aiResponse] };
};




const gradeNode = async (state) => {

    console.log('==================grade node=============')
    const structuredLlm = model.withStructuredOutput(
        z.object({
            binaryScore: z.enum(['yes', 'no']).describe("Relevance score 'yes' or 'no'"),
        }));

    const formatDocToString = formatDocumentsAsString(state.retrievedDocuments)

    const result = await structuredLlm.invoke([
        {
            role: "ai",
            content: GRADE_SYSTEM_PROMPT,
        },
        {
            role: "user",
            content: `
                User Question:
                <user_questions>
                ${state.rewriteQueries.join("\n")}
                </user_questions>

                Retrieved Data:
                <retrieved_data>
                ${formatDocToString}
                </retrieved_data>
      `,
        },
    ]);

    const score = result?.binaryScore

    console.log("BINARY SCORE===========", score)
    if (score === "yes") {
        return { nextNode: "generateNode" };
    }
    return { nextNode: "queryRewriterNode" };

}



const searchWebNode = async (state) => {
console.log('========web search=====')
    const client = new Exa(process.env.EXA_SEARCH_API_KEY);
const searchTool = tool(
    async ({ query }) => {

        const exaTool = new ExaSearchResults({
            client,
            searchArgs: {
                numResults: 1,
                type: "auto",
            },
        })

        const result = await exaTool.invoke(query);
      
        return result


    },
    {
        name: "search_web",
        description: "Search the web  to find real-time information.",
        schema: z.object({
            query: z.string(),
        }),
    }
);

const lastQuery=state.rewriteQueries.pop()

const result=await searchTool.invoke({query:lastQuery})
  console.log('========END web search=====')
// console.log('========web result=======',result)

const docs=new Document({pageContent:result})

    return { retrievedDocuments:[docs] };
};





const builder = new StateGraph(StateAnnotation)
    .addNode("initialNode", initialNode)
    .addNode("queryRewriterNode", queryRewriterNode)
    .addNode("retrieverNode", retrieverNode)
    .addNode("generateNode", generateNode)
    .addNode("outOfScopeNode", outOfScopeNode)
    .addNode("gradeNode", gradeNode)
    .addNode("searchWebNode", searchWebNode)
    .addNode("hallucinationChecker", hallucinationChecker)





    .addEdge(START, "initialNode")

    .addConditionalEdges("initialNode", (state) => {
        console.log("state.nextNode :-:: ", state.nextNode);

        if (state.nextNode === "QUERY_REWRITE") return "queryRewriterNode";

        if (state.nextNode === "OUT_OF_SCOPE") return "outOfScopeNode";
        return END;
    })
    .addConditionalEdges("queryRewriterNode", (state) => {
        if (state.nextNode === "retrieverNode") {
            return "retrieverNode";
        } else if (state.nextNode === "searchWebNode") {
             return "searchWebNode";
        }
        else {
            return [END];
        }
    })


    .addEdge("retrieverNode", "gradeNode")
    .addConditionalEdges("gradeNode", (state) => {
        if (state.nextNode === "generateNode") return "generateNode";
        if (state.nextNode === "queryRewriterNode") return "queryRewriterNode";
    })
    .addConditionalEdges('hallucinationChecker',(state) => {
        if (state.nextNode === "QUERY_REWRITE") 
            return "queryRewriterNode";
       return END
    })
     .addEdge("searchWebNode", 'generateNode')

     .addEdge('generateNode','hallucinationChecker')
    .addEdge("outOfScopeNode", END);

const graph = builder.compile();
// Invoke the graph

const result = await graph.invoke({
    messages: [
        new HumanMessage({ content: "What is Corrective RAG ?" }),

    ],
});
console.log("graph state==================", result);
