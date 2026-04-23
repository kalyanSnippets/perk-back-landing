export const PROMOTION_RULE_OPTIONS = [
  { value: "visit_x_get_y", label: "Visit X times" },
  { value: "buy_x_get_y", label: "Buy X items" },
  { value: "spend_x_get_y", label: "Spend $X" },
] as const;

export const PROMOTION_REWARD_OPTIONS = [
  { value: "free_item", label: "Free item" },
  { value: "discount_percent", label: "Discount" },
  { value: "bonus_points", label: "Bonus points" },
] as const;

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_item: "Free item",
  discount_percent: "Discount",
  bonus_points: "Bonus points",
  discount: "Discount",
  points_bonus: "Points bonus",
  custom: "Custom reward",
};

export const getRewardTypeLabel = (rewardType: string) => REWARD_TYPE_LABELS[rewardType] || rewardType.replace(/_/g, " ");

export const getPromotionRuleLabel = (ruleType: string) => {
  return PROMOTION_RULE_OPTIONS.find((option) => option.value === ruleType)?.label || ruleType;
};

export const formatPromotionTrigger = (ruleType: string, triggerCount: number) => {
  if (ruleType === "spend_x_get_y") {
    return `Spend $${triggerCount}`;
  }

  const label = getPromotionRuleLabel(ruleType);
  return label.replace("X", String(triggerCount));
};

export const formatPromotionReward = (
  rewardType: string,
  rewardDescription: string,
  rewardValue?: string | null,
) => {
  const cleanDescription = rewardDescription.trim();
  const cleanValue = rewardValue?.trim();

  if (rewardType === "discount_percent") {
    const displayValue = cleanValue || cleanDescription;
    return displayValue.includes("%") ? `${displayValue} off` : `${displayValue} discount`;
  }

  if (rewardType === "bonus_points") {
    const displayValue = cleanValue || cleanDescription;
    return /point/i.test(displayValue) ? displayValue : `${displayValue} bonus points`;
  }

  return cleanDescription;
};

export const formatPromotionSummary = ({
  ruleType,
  triggerCount,
  rewardDescription,
  rewardType,
  rewardValue,
}: {
  ruleType: string;
  triggerCount: number;
  rewardDescription: string;
  rewardType: string;
  rewardValue?: string | null;
}) => {
  return `${formatPromotionTrigger(ruleType, triggerCount)} → ${formatPromotionReward(rewardType, rewardDescription, rewardValue)}`;
};