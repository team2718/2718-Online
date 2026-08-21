import { z } from 'zod';
import type { PitScoutReportData } from '$lib/types';

export const pitReportDataSchema = z.object({
	teamNumber: z.union([z.string().trim().min(1), z.number().int().positive()]),
	scoutName: z.string().trim().min(1, 'Scout name is required'),
	driverYOE: z.string().trim().default(''),
	hopperCapacity: z.string().trim().default(''),
	drivetrain: z.string().trim().default(''),
	shooterType: z.string().trim().default(''),
	intakeType: z.string().trim().default(''),
	autoFeatures: z.array(z.string()).default([]),
	autoStart: z.string().trim().default(''),
	climb: z.string().trim().default(''),
	canGoUnderTrench: z.boolean().optional(),
	fuelPerSecond: z.string().trim().default(''),
	weightLbs: z.string().trim().default(''),
	knownIssues: z.string().trim().default(''),
	comments: z.string().trim().default(''),
	timestamp: z.string().default(() => new Date().toISOString())
});

export type ValidatedPitReportData = z.infer<typeof pitReportDataSchema>;

/**
 * Parses and validates pit scouting payload from string or object.
 */
export function parsePitReport(rawInput: unknown):
	| {
			success: true;
			data: PitScoutReportData;
	  }
	| {
			success: false;
			error: string;
	  } {
	let json: unknown = rawInput;
	if (typeof rawInput === 'string') {
		try {
			json = JSON.parse(rawInput);
		} catch {
			return { success: false, error: 'Invalid JSON payload' };
		}
	}

	if (!json || typeof json !== 'object') {
		return { success: false, error: 'Expected pit scouting data object' };
	}

	const result = pitReportDataSchema.safeParse(json);
	if (!result.success) {
		const firstError = result.error.issues[0]?.message || 'Invalid pit scouting report fields';
		return { success: false, error: firstError };
	}

	return { success: true, data: result.data };
}
