export type PlanTier = "free" | "growth" | "pro";

export interface FeatureDefinition {
  key: string;
  name: string;
  minimumPlan: PlanTier;
  upgradeDescription: string;
  overrideKey?: string;
}

const PLAN_RANK: Record<PlanTier, number> = { free: 0, growth: 1, pro: 2 };

export const FEATURE_CATALOG: FeatureDefinition[] = [
  // Free
  { key: "dashboard", name: "Dashboard", minimumPlan: "free", upgradeDescription: "" },
  { key: "customers", name: "Customers", minimumPlan: "free", upgradeDescription: "" },
  { key: "loyalty_cards", name: "Loyalty Cards", minimumPlan: "free", upgradeDescription: "" },
  { key: "transactions", name: "Transactions", minimumPlan: "free", upgradeDescription: "" },
  { key: "settings", name: "Settings", minimumPlan: "free", upgradeDescription: "" },
  { key: "add_points", name: "Add Points", minimumPlan: "free", upgradeDescription: "" },
  // Growth
  { key: "campaigns", name: "Campaigns", minimumPlan: "growth", upgradeDescription: "Create targeted campaigns to boost customer retention and repeat visits.", overrideKey: "allow_campaigns" },
  { key: "rewards", name: "Rewards", minimumPlan: "growth", upgradeDescription: "Design custom rewards to keep your customers engaged and coming back.", overrideKey: "allow_rewards" },
  { key: "analytics", name: "Analytics", minimumPlan: "growth", upgradeDescription: "Gain deep insights into customer behaviour and spending patterns.", overrideKey: "allow_analytics" },
  { key: "ai_suggestions", name: "AI Suggestions", minimumPlan: "growth", upgradeDescription: "Let AI craft smarter campaign ideas based on your customer data.", overrideKey: "allow_ai_suggestions" },
  { key: "unlimited_customers", name: "Unlimited Customers", minimumPlan: "growth", upgradeDescription: "Remove the 50-customer cap and grow your loyalty base without limits." },
  // Pro
  { key: "pos_integration", name: "POS Integration", minimumPlan: "pro", upgradeDescription: "Connect Square and other POS systems to auto-sync transactions.", overrideKey: "allow_pos_integration" },
  { key: "advanced_reports", name: "Advanced Reports", minimumPlan: "pro", upgradeDescription: "Export detailed reports and access advanced business analytics.", overrideKey: "allow_advanced_reports" },
  { key: "gamification", name: "Gamification", minimumPlan: "pro", upgradeDescription: "Add gamified loyalty experiences to delight and engage your customers.", overrideKey: "allow_gamification" },
  { key: "birthday_offers", name: "Birthday Offers", minimumPlan: "pro", upgradeDescription: "Send automatic birthday rewards to keep customers feeling special.", overrideKey: "allow_birthday_offers" },
  { key: "monthly_offers", name: "Monthly Offers", minimumPlan: "pro", upgradeDescription: "Run recurring monthly promotions to drive consistent foot traffic.", overrideKey: "allow_monthly_offers" },
  { key: "priority_support", name: "Priority Support", minimumPlan: "pro", upgradeDescription: "Get dedicated priority support for your business.", overrideKey: "allow_priority_support" },
];

export const CUSTOMER_LIMIT: Record<PlanTier, number> = {
  free: 50,
  growth: Infinity,
  pro: Infinity,
};

export function getFeature(key: string): FeatureDefinition | undefined {
  return FEATURE_CATALOG.find((f) => f.key === key);
}

export function getRequiredPlan(featureKey: string): PlanTier {
  return getFeature(featureKey)?.minimumPlan ?? "pro";
}

export function hasFeatureAccess(
  plan: PlanTier,
  featureKey: string,
  overrides?: Record<string, boolean> | null
): boolean {
  const feature = getFeature(featureKey);
  if (!feature) return false;

  // Check override first
  if (overrides && feature.overrideKey && overrides[feature.overrideKey]) {
    return true;
  }

  return PLAN_RANK[plan] >= PLAN_RANK[feature.minimumPlan];
}

export function planLabel(plan: PlanTier): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
