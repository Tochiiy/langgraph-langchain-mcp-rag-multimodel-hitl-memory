import { z } from "zod";

// 🔧 Tool Definition
export const fetchUserToolInput = {
  description: "Fetch user information by ID",
  inputSchema: {
    userId: z
      .string()
      .describe("Unique identifier of the user"),
  },
};

// 🧠 Mock Database (Simulation)
const mockUsers = {
  "1": {
    id: "1",
    name: "Ben",
    role: "AI Engineer",
    email: "ben@example.com",
  },
  "2": {
    id: "2",
    name: "Alice",
    role: "Product Manager",
    email: "alice@example.com",
  },
  "3": {
    id: "3",
    name: "John",
    role: "Backend Developer",
    email: "john@example.com",
  },
};

// 🛠️ Tool Implementation
export const fetchUserTool = async ({ userId }) => {
  const user = mockUsers[userId];

  if (!user) {
    return {
      content: [
        {
          type: "text",
          text: `❌ User with ID "${userId}" not found.`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `👤 User Info:
- ID: ${user.id}
- Name: ${user.name}
- Role: ${user.role}
- Email: ${user.email}`,
      },
    ],
  };
};