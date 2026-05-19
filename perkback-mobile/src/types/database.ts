export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  crn: string;
  loyalty_card_number: string;
  points_balance: number;
  date_of_birth: string | null;
  phone: string | null;
  created_at: string;
}

export interface CustomerMerchant {
  id: string;
  customer_id: string;
  merchant_id: string;
  points_balance: number;
  points?: number;
  visit_count: number;
  visits?: number;
  total_spend: number;
  joined_at?: string | null;
  last_visit_at?: string | null;
  created_at: string;
  merchants?: Merchant;
}

export interface CustomerStamp {
  id: string;
  customer_id: string;
  merchant_id: string;
  stamps_count?: number | null;
  stamp_count?: number | null;
  total_stamps?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Merchant {
  id: string;
  user_id: string;
  name: string;
  store_name?: string | null;
  slug: string;
  category: string | null;
  industry_type?: string | null;
  logo_url: string | null;
  profile_image_url?: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
}

export interface Reward {
  id: string;
  merchant_id: string;
  title: string;
  description: string | null;
  points_required: number;
  reward_type?: string | null;
  expires_at?: string | null;
  image_url?: string | null;
  is_active: boolean;
  active?: boolean | null;
  merchants?: Merchant;
}

export interface Campaign {
  id: string;
  merchant_id: string;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean | null;
  active?: boolean | null;
  created_at?: string | null;
  merchants?: Merchant;
}

export interface MonthlyOffer {
  id: string;
  merchant_id: string;
  title: string;
  description?: string | null;
  points_required?: number | null;
  is_active?: boolean | null;
  merchants?: Merchant;
}

export interface PromotionRule {
  id: string;
  merchant_id: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  required_visits?: number | null;
  reward_description?: string | null;
  is_active?: boolean | null;
}

export interface MerchantCardDesign {
  id: string;
  merchant_id: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  card_style?: string | null;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Redemption {
  id: string;
  customer_id: string;
  reward_id: string;
  merchant_id?: string;
  code?: string;
  redemption_code?: string;
  reward_title?: string;
  points_spent?: number;
  status: 'active' | 'pending' | 'used' | 'expired';
  expires_at: string;
  created_at: string;
  redeemed_at?: string | null;
  rewards?: Reward;
}

export interface Transaction {
  id: string;
  customer_id: string;
  merchant_id: string | null;
  merchant_name: string;
  purchase_amount: number;
  points_awarded: number;
  source: string | null;
  transaction_date: string;
  created_at: string;
  refunded_at?: string | null;
}
