import { db } from '$lib/server/db';
import { scoutingReports, pitScoutingReports, matches, teams, matchesToTeams, admin_sessions } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    wipeDatabase: async () => {
        try {
            // Delete in order to respect foreign key constraints
            await db.delete(scoutingReports).run();
            await db.delete(pitScoutingReports).run();
            await db.delete(matchesToTeams).run();
            await db.delete(matches).run();
            await db.delete(teams).run();
            await db.delete(admin_sessions).run();
            
            return { success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Failed to wipe database' });
        }
    }
};