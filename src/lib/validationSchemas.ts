import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be ≤100 characters"),
  description: z.string().trim().max(500, "Description must be ≤500 characters").optional(),
});

export const rewardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80, "Title must be ≤80 characters"),
  description: z.string().trim().max(500, "Description must be ≤500 characters").optional(),
  points_required: z.number().int().min(1, "Points must be ≥1").max(10000, "Points must be ≤10,000"),
  reward_type: z.string().min(1, "Reward type is required"),
  image_url: z.string().url("Invalid image URL").or(z.literal("")).optional(),
});

export const promotionSchema = z.object({
  rule_type: z.string().min(1, "Rule type is required"),
  trigger_count: z.number().int().min(1, "Trigger must be ≥1").max(100, "Trigger must be ≤100"),
  reward_description: z.string().trim().min(1, "Reward description is required").max(200, "Description must be ≤200 characters"),
  reward_type: z.string().min(1, "Reward type is required"),
});

export const monthlyOfferSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be ≤100 characters"),
  description: z.string().trim().max(500, "Description must be ≤500 characters").optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
}).refine((data) => {
  if (data.valid_from && data.valid_to) {
    return new Date(data.valid_to) >= new Date(data.valid_from);
  }
  return true;
}, { message: "End date must be on or after start date", path: ["valid_to"] });

export const birthdaySchema = z.object({
  days_before: z.number().int().min(0, "Must be ≥0").max(30, "Must be ≤30"),
  days_valid: z.number().int().min(1, "Must be ≥1").max(60, "Must be ≤60"),
  reward_value: z.string().min(1, "Reward value is required").max(100),
  message: z.string().trim().max(300, "Message must be ≤300 characters").optional(),
});

export const firstZodError = (err: z.ZodError): string => {
  return err.issues[0]?.message || "Invalid input";
};
