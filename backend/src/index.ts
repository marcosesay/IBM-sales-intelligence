import "dotenv/config";

// Debug: log env vars at startup (mask the key)
console.log("Starting up...");
console.log("PORT:", process.env.PORT);
console.log("WATSONX_PROJECT_ID:", process.env.WATSONX_PROJECT_ID);
console.log("WATSONX_API_KEY set:", !!process.env.WATSONX_API_KEY);
console.log("WATSONX_API_URL:", process.env.WATSONX_API_URL);

import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] ?? 8080);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
