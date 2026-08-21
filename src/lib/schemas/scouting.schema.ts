import { z } from 'zod';
import type { ScoutingReportData } from '$lib/types';

export const scoutingReportDataSchema = z.object({
	uid: z.coerce.number().int().positive(),
	teamNumber: z.coerce.number().int().positive(),
	matchNumber: z.coerce.number().int().positive(),
	scoutName: z.string().trim().min(1, 'Scout name is required'),
	alliance: z.coerce.number().int().min(0).max(1), // 0: Red, 1: Blue
	startingPosition: z.coerce.number().int().min(0).max(4).default(2),
	unixTimeComplete: z.coerce.number().optional(),
	stagesComplete: z.coerce.number().int().min(0).default(4),
	notes: z.string().trim().default(''),
	didLeave: z.boolean().default(false),
	autoFuel: z.coerce.number().nonnegative().default(0),
	autoFuelMissed: z.coerce.number().nonnegative().default(0),
	autoClimbed: z.boolean().default(false),
	teleFuelScoredAny: z.boolean().optional(),
	teleFuelScore: z.coerce.number().min(0).max(5).default(0),
	teleDidPass: z.boolean().optional(),
	telePassScore: z.coerce.number().min(0).max(5).default(0),
	teleDidDef: z.boolean().optional(),
	teleDefScore: z.coerce.number().min(0).max(5).default(0),
	climbType: z.coerce.number().int().min(0).max(3).default(0), // 0: None, 1: L1, 2: L2, 3: L3
	cardReceived: z.coerce.number().int().min(0).max(2).default(0) // 0: None, 1: Yellow, 2: Red
});

export type ValidatedScoutingReportData = z.infer<typeof scoutingReportDataSchema>;

/**
 * Parses and validates raw QR code data string.
 */
export function parseScoutingQr(rawString: string):
	| {
			success: true;
			data: ScoutingReportData;
	  }
	| {
			success: false;
			error: string;
	  } {
	if (!rawString || typeof rawString !== 'string') {
		return { success: false, error: 'No QR code data received' };
	}

	let json: unknown;
	try {
		json = JSON.parse(rawString);
	} catch {
		return { success: false, error: 'Invalid QR code JSON format' };
	}

	const result = scoutingReportDataSchema.safeParse(json);
	if (!result.success) {
		const firstError = result.error.issues[0]?.message || 'Invalid scouting report fields';
		return { success: false, error: firstError };
	}

	if (result.data.stagesComplete < 4) {
		return { success: false, error: 'Scouting report is incomplete (stagesComplete < 4)' };
	}

	return { success: true, data: result.data };
}
