
import "dotenv/config";

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'].trim();


  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const formatDocumentsAsString = (documents) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
};