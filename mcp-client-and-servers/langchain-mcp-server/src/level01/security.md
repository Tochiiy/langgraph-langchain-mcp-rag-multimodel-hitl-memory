const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Disable the X-Powered-By header










# Generates a secure, URL-safe base64 string
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"


