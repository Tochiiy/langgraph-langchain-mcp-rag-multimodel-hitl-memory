// learn more : https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance

import { StateGraph, Annotation, START, END, Command } from "@langchain/langgraph";

export class MyCustomError extends Error {
    constructor(message) {
        super(message);
        this.name = "MyCustomError";
    }
}


const State = Annotation.Root({
    apiUrl: Annotation(),
    apiData: Annotation(),

    success: Annotation({
        default: () => false,
    }),
    status: Annotation(),
    error: Annotation(),

});

const callPaymentApi = async (state, runtime) => {


    console.log("node attempts === ", runtime.executionInfo?.nodeAttempt)

    if (state.apiUrl === "invalid://fatal-error") {
        console.log('===fatal error occur===')
        throw new MyCustomError("Fatal Error: Invalid API endpoint target.");
    }


    // Success path on the 3rd attempt
    console.log("[callApi] API request succeeded!");

    return new Command({

        update: {
            success: true,
            apiData: {
                payload: "Fetched data securely."
            },
        },
        goto: "finalize",
    })

};


const paymentErrorHandler = (state, error) => {

    return new Command({
        update: {
            status: `compensated: ${error.error.message}`,
            success: false
        },
        goto: "finalize",
    });

}

const finalize = (state) => {
    if (state.success) {
        console.log("===========PAYMENT SUCCEED=======")
        console.log("===========PAYMENT SUCCEED=======")

    } else {
        console.log("=====PAYMENT FAILED======")
        console.log("=====PAYMENT FAILED======")

    }
}

const workflow = new StateGraph(State)
    .addNode("callPaymentApi", callPaymentApi, {
        ends: ["errorHandler", "finalize"],
        retryPolicy: {
            maxAttempts: 3,
            retryOn: (error) => {
                if (error instanceof MyCustomError) {
                    return true;
                }
                // Retry on other errors
                return false;
            },
        },
        errorHandler: paymentErrorHandler,
    }
    )
    .addNode('errorHandler', paymentErrorHandler)
    .addNode("finalize", finalize)

    .addEdge(START, "callPaymentApi")
    .addEdge('errorHandler', 'finalize')
    .addEdge("finalize", END);


export const graph = workflow.compile();





try {
    await graph.invoke({
        // apiUrl: "invalid://fatal-error",
        apiUrl: "https://example.com"
    });
} catch (error) {
    if (error instanceof MyCustomError) {
        console.error("Caught expected graph failure:", error?.message);
    } else {
        console.error("Caught unexpected failure:", error);
    }
}
