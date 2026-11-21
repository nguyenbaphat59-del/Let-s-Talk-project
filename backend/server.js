import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { readBackendEnv } from "./src/config/env.js";
import { createSupabaseClient } from "./src/config/supabase.js";
import { SupabaseContentRepository } from "./src/repositories/supabase-content.repository.js";
import { GameplayService } from "./src/services/gameplay.service.js";
import { createApp } from "./src/app.js";
import { initMonitoring } from "./src/config/monitoring.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

const env = readBackendEnv();
const monitoring = await initMonitoring({
  dsn: env.sentryDsn,
  environment: env.nodeEnv,
  release: `lets-talk-backend@${process.env.npm_package_version || "1.0.0"}`
});
console.log(`[MONITORING] Sentry error monitoring ${monitoring.enabled ? "enabled" : "disabled (SENTRY_DSN not set)"}.`);
console.log(
  "[CORS] Configured allowed origins:",
  env.allowedOrigins
);
const supabase = createSupabaseClient(env);
const repository = new SupabaseContentRepository(supabase);
const gameplayService = new GameplayService(repository);

const app = createApp({
  gameplayService,
  nodeEnv: env.nodeEnv,
  allowedOrigins: env.allowedOrigins,
  reportError: monitoring.reportError
});

export default app;

// Local development uses app.listen(); Vercel imports the default Express app.
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (process.env.VERCEL !== "1" && invokedPath === fileURLToPath(import.meta.url)) {
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`LET'S TALK API listening on http://localhost:${env.port}`);
  });
}
