import { relations, sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { PitScoutReportData, ScoutingReportData } from '$lib/types';

export const teams = sqliteTable('teams', {
	number: integer('teamNumber').primaryKey(),
	name: text('name').notNull(),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>()
});

export const matches = sqliteTable('matches', {
	id: text('id').primaryKey(),
	matchNumber: integer('matchNumber').notNull(),
	matchType: text('matchType'), // 'practice' | 'qualification' | 'playoff'
	red1: integer('red1'),
	red2: integer('red2'),
	red3: integer('red3'),
	blue1: integer('blue1'),
	blue2: integer('blue2'),
	blue3: integer('blue3'),
	redScore: integer('red_score'),
	blueScore: integer('blue_score')
});

export const scoutingReports = sqliteTable('scouting_reports', {
	id: integer('id').primaryKey(),
	matchId: text('match_id')
		.notNull()
		.references(() => matches.id),
	teamNumber: integer('team_number')
		.notNull()
		.references(() => teams.number),
	scouterName: text('scouter_name').notNull(),
	data: text('data', { mode: 'json' }).$type<ScoutingReportData>(),
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const pitScoutingReports = sqliteTable('pit_scouting_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	teamNumber: integer('team_number')
		.notNull()
		.references(() => teams.number),
	scouterName: text('scouter_name').notNull(),
	data: text('data', { mode: 'json' }).$type<PitScoutReportData>(),
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const admin_sessions = sqliteTable('admin_sessions', {
	cookieId: text('cookie_id').primaryKey(),
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const eventSettings = sqliteTable('event_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

// --- JUNCTION TABLES ---

export const matchesToTeams = sqliteTable(
	'matches_to_teams',
	{
		matchId: text('match_id')
			.notNull()
			.references(() => matches.id),
		teamNumber: integer('team_number')
			.notNull()
			.references(() => teams.number),
		station: text('station')
	},
	(t) => [primaryKey({ columns: [t.matchId, t.teamNumber] })]
);

// --- RELATIONS ---

export const teamsRelations = relations(teams, ({ many }) => ({
	matches: many(matchesToTeams),
	reports: many(scoutingReports),
	pitReports: many(pitScoutingReports)
}));

export const matchesRelations = relations(matches, ({ many }) => ({
	teams: many(matchesToTeams),
	reports: many(scoutingReports)
}));

export const scoutingReportsRelations = relations(scoutingReports, ({ one }) => ({
	match: one(matches, { fields: [scoutingReports.matchId], references: [matches.id] }),
	team: one(teams, { fields: [scoutingReports.teamNumber], references: [teams.number] })
}));

export const pitScoutingReportsRelations = relations(pitScoutingReports, ({ one }) => ({
	team: one(teams, { fields: [pitScoutingReports.teamNumber], references: [teams.number] })
}));
