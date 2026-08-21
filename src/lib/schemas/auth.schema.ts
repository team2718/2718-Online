import { z } from 'zod';

export const authLoginSchema = z.object({
	password: z.string().min(1, 'Password is required')
});

export const setMatchTypeSchema = z.object({
	matchType: z.enum(['qualification', 'practice', 'playoff'])
});

export const setAutoTbaPullSchema = z.object({
	autoTbaPull: z.enum(['true', 'false'])
});
