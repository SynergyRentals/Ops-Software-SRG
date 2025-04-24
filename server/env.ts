import { z } from 'zod';

// Zod schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Auth
  SESSION_SECRET: z.string().min(16).optional().default("super-secret-session-key-change-me"),
  
  // Webhooks
  WEBHOOK_SECRET: z.string().min(16).optional()
    .default(process.env.NODE_ENV === 'development' ? 'dev-webhook-secret-placeholder-do-not-use-in-prod' : undefined),
  HOSTAI_WEBHOOK_SECRET: z.string().min(16).optional(),
  SUITEOP_WEBHOOK_SECRET: z.string().min(16).optional(),
});

// Validate environment variables
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:", error.format());
    throw new Error("Invalid environment variables");
  }
};

// Export validated environment variables
export const env = validateEnv();