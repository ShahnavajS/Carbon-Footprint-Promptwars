/**
 * Input Validators
 * Zod schemas for all API endpoints and form inputs
 *
 * Features:
 * - Type-safe validation
 * - Error messages
 * - Sanitization
 * - Schema reusability
 */

import { z } from "zod";

// ============ Shared Schemas ============

export const IdSchema = z.string().min(1, "ID is required").max(255);

export const EmailSchema = z.string().email("Invalid email address").toLowerCase();

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .min(1, "Password must contain at least 1 letter")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number");

export const NameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .trim();

export const UrlSchema = z.string().url("Invalid URL");

export const DateSchema = z
  .string()
  .or(z.date())
  .refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }, "Invalid date");

// ============ Authentication ============

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: NameSchema,
  lastName: NameSchema,
  acceptTerms: z.boolean().refine((v) => v === true, "You must accept the terms"),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: PasswordSchema,
});

export const UpdateProfileSchema = z.object({
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  preferredLanguage: z.enum(["en", "es", "fr", "de"]).optional(),
});

// ============ Activity Logging ============

export const ActivityTypeSchema = z.enum([
  "transport",
  "energy",
  "food",
  "waste",
  "water",
  "shopping",
  "entertainment",
]);

export const LogActivitySchema = z.object({
  type: ActivityTypeSchema,
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  date: DateSchema,
  metadata: z.record(z.any()).optional(),
});

export const BulkActivitySchema = z.array(LogActivitySchema);

// ============ Goals & Journey ============

export const CreateGoalSchema = z.object({
  type: z.enum(["reduction", "adoption", "learning"]),
  category: ActivityTypeSchema,
  title: NameSchema,
  description: z.string().max(500).optional(),
  targetReduction: z.number().min(0).max(100).optional(),
  durationDays: z.number().min(1).max(365),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const UpdateGoalSchema = CreateGoalSchema.partial();

export const JourneyProgressSchema = z.object({
  goalId: IdSchema,
  progressPercentage: z.number().min(0).max(100),
  notes: z.string().max(500).optional(),
});

// ============ Challenges ============

export const CreateChallengeSchema = z.object({
  title: NameSchema,
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  category: ActivityTypeSchema,
  difficulty: z.enum(["easy", "medium", "hard"]),
  duration: z.number().min(1).max(365),
  targetReduction: z.number().min(0).max(100).optional(),
  rewardPoints: z.number().min(0),
  maxParticipants: z.number().min(1).optional(),
  imageUrl: UrlSchema.optional(),
});

export const JoinChallengeSchema = z.object({
  challengeId: IdSchema,
});

export const LogChallengeEntrySchema = z.object({
  challengeId: IdSchema,
  value: z.number().min(0),
  notes: z.string().max(500).optional(),
});

// ============ Friend Circles ============

export const CreateCircleSchema = z.object({
  name: NameSchema,
  description: z.string().max(500).optional(),
  privacy: z.enum(["public", "private"]),
  category: z.enum(["family", "friends", "workplace", "community"]).optional(),
});

export const UpdateCircleSchema = CreateCircleSchema.partial();

export const InviteToCircleSchema = z.object({
  circleId: IdSchema,
  email: EmailSchema,
  message: z.string().max(500).optional(),
});

export const AcceptCircleInviteSchema = z.object({
  inviteId: IdSchema,
});

// ============ Referrals ============

export const CreateReferralSchema = z.object({
  email: EmailSchema,
  message: z.string().max(500).optional(),
});

export const ApplyReferralCodeSchema = z.object({
  code: z.string().regex(/^ECO-[A-Z0-9]{8}$/, "Invalid referral code format"),
});

// ============ Notifications ============

export const UpdateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  quietHours: z
    .object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
    })
    .optional(),
  categories: z
    .object({
      achievements: z.boolean(),
      challenges: z.boolean(),
      circles: z.boolean(),
      recommendations: z.boolean(),
    })
    .optional(),
});

export const RegisterFCMTokenSchema = z.object({
  token: z.string().min(1, "FCM token is required"),
  platform: z.enum(["web", "ios", "android"]),
});

// ============ Leaderboards ============

export const GetLeaderboardSchema = z.object({
  scope: z.enum(["global", "city", "friends", "circle"]),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// ============ Reports & Analytics ============

export const GenerateReportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  includeComparison: z.boolean().optional(),
  includeRecommendations: z.boolean().optional(),
});

export const ExportDataSchema = z.object({
  format: z.enum(["csv", "json", "pdf"]),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
});

// ============ Simulator ============

export const SimulatorScenarioSchema = z.object({
  scenario: z.enum([
    "remote-work",
    "diet-change",
    "car-free",
    "renewable-energy",
    "sustainable-shopping",
  ]),
  duration: z.number().min(1).max(365),
});

// ============ Recommendations ============

export const GetRecommendationsSchema = z.object({
  limit: z.number().min(1).max(50).optional(),
  category: ActivityTypeSchema.optional(),
});

export const RateRecommendationSchema = z.object({
  recommendationId: IdSchema,
  rating: z.number().min(1).max(5),
  helpful: z.boolean(),
  feedback: z.string().max(500).optional(),
});

// ============ Shareable Cards ============

export const CreateShareableCardSchema = z.object({
  type: z.enum(["eco-score", "monthly-report", "badge", "challenge", "streak"]),
  linkedId: IdSchema,
  title: z.string().max(200).optional(),
  customMessage: z.string().max(500).optional(),
});

export const ShareCardSchema = z.object({
  cardId: IdSchema,
  platform: z.enum(["twitter", "facebook", "linkedin", "instagram", "whatsapp", "email"]),
});

// ============ Utility Functions ============

/**
 * Validate input against schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: boolean; data?: T; errors?: string[] } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Validation failed"] };
  }
}

/**
 * Create validation middleware
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateInput(schema, data);
}
