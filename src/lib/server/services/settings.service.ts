import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { eventSettings } from '$lib/server/db/schema';
import type { MatchType } from '$lib/types';

/**
 * Retrieves an event setting by key.
 */
export async function getEventSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
	const row = await db
		.select()
		.from(eventSettings)
		.where(eq(eventSettings.key, key))
		.get();
	return row?.value ?? defaultValue;
}

/**
 * Sets or updates an event setting.
 */
export async function setEventSetting(key: string, value: string): Promise<void> {
	await db
		.insert(eventSettings)
		.values({ key, value })
		.onConflictDoUpdate({ target: eventSettings.key, set: { value } })
		.run();
}

/**
 * Helper to get the configured default match type ('qualification' | 'practice').
 */
export async function getDefaultMatchType(): Promise<MatchType> {
	const val = await getEventSetting('defaultMatchType', 'qualification');
	if (val === 'practice' || val === 'playoff') return val;
	return 'qualification';
}

/**
 * Helper to check if TBA auto-polling is enabled.
 */
export async function isAutoTbaPullEnabled(): Promise<boolean> {
	const val = await getEventSetting('autoTbaPull');
	return val === 'true';
}

/**
 * Helper to get the active TBA event code (e.g. "2026okok").
 */
export async function getEventCode(): Promise<string | null> {
	return await getEventSetting('eventCode');
}

