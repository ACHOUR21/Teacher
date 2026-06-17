-- Migration: 20260611000008_add_coupons
-- Adds applicablePlans (text array) and description columns to the Coupon table.
-- The Coupon model already exists from the initial migration; this extends it.

ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "applicablePlans" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "description"     TEXT;
