-- Seed sample image URLs for rewards (only NULLs)
UPDATE public.rewards r
SET image_url = CASE
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%coffee%' OR lower(coalesce(m.industry_type, '')) LIKE '%cafe%'
    THEN 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%restaurant%' OR lower(coalesce(m.industry_type, '')) LIKE '%food%' OR lower(coalesce(m.industry_type, '')) LIKE '%dining%'
    THEN 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%retail%' OR lower(coalesce(m.industry_type, '')) LIKE '%shop%' OR lower(coalesce(m.industry_type, '')) LIKE '%store%'
    THEN 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%beauty%' OR lower(coalesce(m.industry_type, '')) LIKE '%salon%' OR lower(coalesce(m.industry_type, '')) LIKE '%spa%'
    THEN 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%bakery%' OR lower(coalesce(m.industry_type, '')) LIKE '%dessert%'
    THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80&auto=format&fit=crop'
END
FROM public.merchants m
WHERE r.merchant_id = m.id
  AND (r.image_url IS NULL OR r.image_url = '');

-- Seed sample image URLs for campaigns (only NULLs)
UPDATE public.campaigns c
SET image_url = CASE
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%coffee%' OR lower(coalesce(m.industry_type, '')) LIKE '%cafe%'
    THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%restaurant%' OR lower(coalesce(m.industry_type, '')) LIKE '%food%' OR lower(coalesce(m.industry_type, '')) LIKE '%dining%'
    THEN 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%retail%' OR lower(coalesce(m.industry_type, '')) LIKE '%shop%' OR lower(coalesce(m.industry_type, '')) LIKE '%store%'
    THEN 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%beauty%' OR lower(coalesce(m.industry_type, '')) LIKE '%salon%' OR lower(coalesce(m.industry_type, '')) LIKE '%spa%'
    THEN 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&auto=format&fit=crop'
  WHEN lower(coalesce(m.industry_type, '')) LIKE '%bakery%' OR lower(coalesce(m.industry_type, '')) LIKE '%dessert%'
    THEN 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=800&q=80&auto=format&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80&auto=format&fit=crop'
END
FROM public.merchants m
WHERE c.merchant_id = m.id
  AND (c.image_url IS NULL OR c.image_url = '');