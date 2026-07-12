import { z } from 'zod';

/**
 * Money fields are stored as PostgreSQL `integer` (32-bit, max 2,147,483,647).
 * Cap slightly below that so multiplications/sums don't overflow either.
 */
export const MAX_MONEY = 2_000_000_000; // 2 tỷ VND

const overflowMsg = 'Giá trị tiền quá lớn (tối đa 2 tỷ đồng)';

/** A non-negative integer VND amount, bounded to a safe range. */
export const moneyField = z.coerce.number().int().min(0).max(MAX_MONEY, overflowMsg);
