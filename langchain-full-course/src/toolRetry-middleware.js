import { tool } from "@langchain/core/tools";
// import { z } from "zod";
import * as z from "zod";

import {

  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";

import { createMiddleware, AIMessage, initChatModel } from "langchain";


import "dotenv/config";
/**
 * Simulated weather data for different cities
 */
const WEATHER_DATA= {
  "new york": { temp: 72, condition: "Partly Cloudy", humidity: 65 },
  "san francisco": { temp: 68, condition: "Foggy", humidity: 80 },
  "los angeles": { temp: 75, condition: "Sunny", humidity: 50 },
  "chicago": { temp: 65, condition: "Cloudy", humidity: 70 },
  "miami": { temp: 85, condition: "Sunny", humidity: 75 },
  "seattle": { temp: 60, condition: "Rainy", humidity: 85 },
};


const callCounts = new Map();

// retrun a boolean 
async function simulateNetworkFailure(threadId,city){
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const key = `${threadId || "default"}:${city.toLowerCase()}`;
  console.log('key    : ',key)
  const currentCount = (callCounts.get(key) || 0) + 1;
  console.log('c : : ',currentCount)
  callCounts.set(key, currentCount);

  console.log((currentCount <= 2))

  return currentCount <= 3;
}

/**
 * Custom error class for network failures
 */
class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}



  const getWeather = tool(
    async ({ city }) => {
      if (await simulateNetworkFailure("ben_thread_1", city)) {
        throw new NetworkError(
          `Network request failed: Unable to connect to weather service for ${city}. This may be a temporary issue.`
        );
      }

      const cityKey = city.toLowerCase();
      const weather = WEATHER_DATA[cityKey];

      if (!weather) {
        throw new Error(`Weather data not available for ${city}`);
      }

      return {
        city: city,
        temperature: `${weather.temp}°F`,
        condition: weather.condition,
        humidity: `${weather.humidity}%`,
        timestamp: new Date().toISOString(),
      };
    },
    {
      name: "get_weather",
      description: "Get current weather information for a city. This tool may experience temporary network failures that will be automatically retried.",
      schema: z.object({
        city: z.string().describe("The name of the city to get weather for (e.g., 'New York', 'San Francisco', 'Los Angeles')"),
      }),
    }
  );


  const qweenModel = await initChatModel("cerebras:qwen-3-32b");




  const customRetryMiddleware = (config) => {
  return createMiddleware({
    name: "CustomRetryMiddleware",
    wrapToolCall: async (request, handler) => {
      let attempt = 0;
      while (attempt <= config.maxRetries) {
        try {
          return await handler(request);
        } catch (error) {
          // Check if error is from our tool and matches NetworkError
          const isNetworkError = error.message.includes("NetworkError") || error instanceof NetworkError;
          
          if (!isNetworkError || attempt === config.maxRetries) {
            
             return new ToolMessage({
              content: `Error: Tool failed after ${attempt} retries. Details: ${error.message}`,
              tool_call_id: request.toolCall.id, // REQUIRED: links result to the agent's call
              name: request.tool.name,
            });
          }

          attempt++;
          const delay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1);
          console.log(`[Middleware] Retry ${attempt}/${config.maxRetries} in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    },
  });
};

  const agent = createAgent({
    model:qweenModel,
    tools: [getWeather],
    middleware: [
     customRetryMiddleware({
      maxRetries: 2,
      initialDelayMs: 1000,
      backoffFactor: 2,
    }),
    ],
  });

 
  const agentOutput = await agent.invoke({
    messages: [
      new HumanMessage('what is the current weather is new york'),
 
    ],
  
  });
  const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content
  
  console.log(aiResponse)
  
