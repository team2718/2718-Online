// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			admin: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	var TBA_POLLING_JOB: schedule.Job | undefined;
	var DB_BACKUP_JOB: schedule.Job | undefined;
}

export {};
