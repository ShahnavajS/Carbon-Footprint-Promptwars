import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth Domain is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID is required"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase Storage Bucket is required"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "Firebase Messaging Sender ID is required"),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required"),
  FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "Firebase Client Email is required"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "Firebase Private Key is required"),
});

const isServer = typeof window === "undefined";

const getEnv = () => {
  const clientEnv = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const parsedClient = clientSchema.safeParse(clientEnv);
  if (!parsedClient.success) {
    console.error("❌ Invalid client-side environment variables:", parsedClient.error.format());
    throw new Error("Invalid client environment variables");
  }

  if (isServer) {
    const serverEnv = {
      NODE_ENV: process.env.NODE_ENV,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      FIREBASE_PROJECT_ID:
        process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    };

    const parsedServer = serverSchema.safeParse(serverEnv);
    if (!parsedServer.success) {
      console.error("❌ Invalid server-side environment variables:", parsedServer.error.format());
      throw new Error("Invalid server environment variables");
    }

    return {
      ...parsedClient.data,
      ...parsedServer.data,
    };
  }

  return {
    ...parsedClient.data,
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };
};

export const env = getEnv();
export type Env = typeof env;
export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;
