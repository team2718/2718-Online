import { relations, sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable('teams', {
	number: integer('teamNumber').primaryKey(),
	name: text('name').notNull()
});

export const events = sqliteTable('events', {
	id: text('id').primaryKey(), 
	name: text('name').notNull(),
	year: integer('year')
});

export const matches = sqliteTable('matches', {
	id: text('id').primaryKey(), 
	eventId: text('eventId')
		.notNull()
		.references(() => events.id),
	matchNumber: integer('matchNumber').notNull(),
	type: text('type').default('qualification').notNull() 
});

export const scoutingReports = sqliteTable('scouting_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	matchId: text('match_id')
		.notNull()
		.references(() => matches.id),
	teamNumber: integer('team_number')
		.notNull()
		.references(() => teams.number),
	scouterName: text('scouter_name').notNull(),
	data: text('data', { mode: 'json' }), 
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const pitScoutingReports = sqliteTable('pit_scouting_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	teamNumber: integer('team_number')
		.notNull()
		.references(() => teams.number),
	scouterName: text('scouter_name').notNull(),
	data: text('data', { mode: 'json' }), 
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

export const admin_sessions = sqliteTable('admin_sessions', {
	cookieId: text('cookie_id').primaryKey(),
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
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

export const eventsToTeams = sqliteTable(
	'events_to_teams',
	{
		eventId: text('event_id')
			.notNull()
			.references(() => events.id),
		teamNumber: integer('team_number')
			.notNull()
			.references(() => teams.number)
	},
	(t) => [primaryKey({ columns: [t.eventId, t.teamNumber] })]
);

// --- RELATIONS ---

export const teamsRelations = relations(teams, ({ many }) => ({
	matches: many(matchesToTeams),
	reports: many(scoutingReports),
	pitReports: many(pitScoutingReports)
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
	event: one(events, { fields: [matches.eventId], references: [events.id] }),
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