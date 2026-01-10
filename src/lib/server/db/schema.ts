import { relations, sql } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/gel-core';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const teams = sqliteTable('teams', {
	number: integer('teamNumber').primaryKey(),
	name: text('name').notNull()
});

export const events = sqliteTable('events', {
	id: text('id').primaryKey(), // e.g. "2026okok"
	name: text('name').notNull(),
	year: integer('year')
});

export const matches = sqliteTable('matches', {
	id: text('id').primaryKey(), // e.g. "2026okok_qm1"
	eventId: text('eventId')
		.notNull()
		.references(() => events.id),
	matchNumber: integer('matchNumber').notNull(),
	type: text('type').default('qualification').notNull() // practice, qualification, playoff
});

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull()
});

export const scoutingReports = sqliteTable('scouting_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	matchId: text('match_id')
		.notNull()
		.references(() => matches.id),
	teamNumber: integer('team_number')
		.notNull()
		.references(() => teams.number),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	data: text('data', { mode: 'json' }), // Flexible JSON for game-specific stats
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

// admin auth consists of an cryptographic ID stored in a secure, HttpOnly cookie
// the creation date is stored and can be used for expiration policies
export const admin_sessions = sqliteTable('admin_sessions', {
	cookieId: text('cookie_id').primaryKey(),
	createdAt: integer('created_at').default(sql`(strftime('%s', 'now'))`)
});

// --- JUNCTION TABLES FOR MANY-TO-MANY ---

// Users to Teams (A user can be linked to 1+ teams)
export const usersToTeams = sqliteTable(
	'users_to_teams',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		teamNumber: integer('team_number')
			.notNull()
			.references(() => teams.number)
	},
	(t) => [primaryKey({ columns: [t.userId, t.teamNumber] })]
);

// Matches to Teams (Each match has multiple teams)
export const matchesToTeams = sqliteTable(
	'matches_to_teams',
	{
		matchId: text('match_id')
			.notNull()
			.references(() => matches.id),
		teamNumber: integer('team_number')
			.notNull()
			.references(() => teams.number),
		station: text('station') // e.g., "Red 1", "Blue 2"
	},
	(t) => [primaryKey({ columns: [t.matchId, t.teamNumber] })]
);

// Events to Teams (An event consists of multiple teams)
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

// --- RELATIONSHIP DEFINITIONS (FOR DRIZZLE QUERIES) ---

export const teamsRelations = relations(teams, ({ many }) => ({
	users: many(usersToTeams),
	matches: many(matchesToTeams),
	reports: many(scoutingReports)
}));

export const eventsRelations = relations(events, ({ many }) => ({
	matches: many(matches),
	teams: many(eventsToTeams)
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
	event: one(events, { fields: [matches.eventId], references: [events.id] }),
	teams: many(matchesToTeams),
	reports: many(scoutingReports)
}));

export const usersRelations = relations(users, ({ many }) => ({
	teams: many(usersToTeams),
	reports: many(scoutingReports)
}));

export const scoutingReportsRelations = relations(scoutingReports, ({ one }) => ({
	match: one(matches, { fields: [scoutingReports.matchId], references: [matches.id] }),
	team: one(teams, { fields: [scoutingReports.teamNumber], references: [teams.number] }),
	user: one(users, { fields: [scoutingReports.userId], references: [users.id] })
}));
