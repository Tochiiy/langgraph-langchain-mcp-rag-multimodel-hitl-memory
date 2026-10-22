// 
import { z } from "zod";

// 🔧 Tool Definition
export const weatherToolInput = {
  description: "Get simulated weather alerts for a US state. The tool takes Two-letter state code",
  inputSchema: {
    state: z
      .string()
      .length(2)
      .describe("Two-letter state code (e.g. CA, NY)"),
  },
};

// 🌦️ Simulated Weather Logic
const mockWeatherData= {
  CA: "🌤️ Mild temperatures with light winds.",
  NY: "🌧️ Heavy rain expected throughout the day.",
  TX: "🌪️ Tornado watch in effect.",
  FL: "⛈️ Thunderstorms likely in the afternoon.",
  WA: "🌫️ Foggy conditions with low visibility.",
};

// 🛠️ Tool التنفيذ
export const weatherTool = async ({ state }) => {
  const stateCode = state.toUpperCase();

  const forecast =
    mockWeatherData[stateCode] ||
    "❓ No data available for this state. Clear conditions assumed.";

  return {
    content: [
      {
        type: "text",
        text: `Weather for ${stateCode}: ${forecast}`,
      },
    ],
  };
};