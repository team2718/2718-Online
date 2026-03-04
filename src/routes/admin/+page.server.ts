import { db } from '$lib/server/db';
import { scoutingReports, pitScoutingReports, matches, teams, matchesToTeams, admin_sessions } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { notInArray, eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
    logout: async ({ cookies }) => {
        const sessionToken = cookies.get('admin-auth');
        
        if (sessionToken) {
            // 👇 REPLACE ".key" with the actual column name from your schema.ts
            // (e.g., admin_sessions.id, admin_sessions.token, etc.)
            await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionToken)).run();
        }

        // Delete the cookie
        cookies.delete('admin-auth', { path: '/' });

        throw redirect(303, '/admin-login');
    },

    wipeDatabase: async () => {
        try {
            await db.delete(scoutingReports).run();
            await db.delete(pitScoutingReports).run();
            await db.delete(matchesToTeams).run();
            await db.delete(matches).run();
            await db.delete(teams).run();
            await db.delete(admin_sessions).run();
            
            return { success: true, action: 'wipe' };
        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Failed to wipe database' });
        }
    },

    cleanupDatabase: async () => {
        try {
            // Get all existing matches and teams to compare later
            const allMatches = await db.select({ id: matches.id }).from(matches);
            const allTeams = await db.select({ number: teams.number }).from(teams);

            // --- Clean Up Unused Matches ---
            const matchReports = await db.select({ matchId: scoutingReports.matchId }).from(scoutingReports);
            const activeMatchIds = [...new Set(matchReports.map(r => r.matchId).filter(Boolean))] as string[];

            // Calculate which matches are being deleted
            const deletedMatchIds = allMatches.map(m => m.id).filter(id => !activeMatchIds.includes(id));

            if (activeMatchIds.length > 0) {
                await db.delete(matchesToTeams).where(notInArray(matchesToTeams.matchId, activeMatchIds)).run();
                await db.delete(matches).where(notInArray(matches.id, activeMatchIds)).run();
            } else {
                await db.delete(matchesToTeams).run();
                await db.delete(matches).run();
            }

            // --- Clean Up Unused Teams ---
            const mTeams = await db.select({ teamNum: scoutingReports.teamNumber }).from(scoutingReports);
            const pTeams = await db.select({ teamNum: pitScoutingReports.teamNumber }).from(pitScoutingReports);
            const activeTeamNums = [...new Set([
                ...mTeams.map(r => r.teamNum),
                ...pTeams.map(r => r.teamNum)
            ].filter(Boolean))] as number[];

            // Calculate which teams are being deleted
            const deletedTeamNums = allTeams.map(t => t.number).filter(num => !activeTeamNums.includes(num));

            if (activeTeamNums.length > 0) {
                await db.delete(matchesToTeams).where(notInArray(matchesToTeams.teamNumber, activeTeamNums)).run();
                await db.delete(teams).where(notInArray(teams.number, activeTeamNums)).run();
            } else {
                await db.delete(matchesToTeams).run(); 
                await db.delete(teams).run();
            }

            return { 
                success: true, 
                action: 'cleanup',
                deletedMatches: deletedMatchIds,
                deletedTeams: deletedTeamNums 
            };
        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Failed to cleanup database' });
        }
    }
};