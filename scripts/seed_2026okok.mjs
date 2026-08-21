import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function seed() {
	console.log('Seeding 2026okok dummy data...');

	// 1. Settings
	await client.execute({
		sql: `INSERT OR REPLACE INTO event_settings (key, value) VALUES ('eventCode', '2026okok')`,
		args: []
	});

	// 2. Clear old data
	await client.execute('DELETE FROM scouting_reports');
	await client.execute('DELETE FROM pit_scouting_reports');
	await client.execute('DELETE FROM matches');
	await client.execute('DELETE FROM teams');

	// 3. Insert Teams
	const teamsList = [
		{
			number: 2718,
			name: 'Team Driven',
			city: 'Shawnee',
			state: 'OK',
			rank: 4,
			rp: 2.75,
			epa: 38.5
		},
		{
			number: 16,
			name: 'Bomb Squad',
			city: 'Mountain Home',
			state: 'AR',
			rank: 1,
			rp: 3.4,
			epa: 46.2
		},
		{
			number: 1986,
			name: 'Team Titanium',
			city: "Lee's Summit",
			state: 'MO',
			rank: 2,
			rp: 3.1,
			epa: 44.8
		},
		{
			number: 4522,
			name: 'Team SCREAM',
			city: 'Sedalia',
			state: 'MO',
			rank: 3,
			rp: 2.9,
			epa: 41.0
		},
		{ number: 3937, name: 'Breakaway', city: 'Searcy', state: 'AR', rank: 5, rp: 2.6, epa: 36.2 },
		{
			number: 4911,
			name: 'CyberKnights',
			city: 'Seattle',
			state: 'WA',
			rank: 6,
			rp: 2.5,
			epa: 37.8
		},
		{ number: 2341, name: 'Sprockets', city: 'Shawnee', state: 'OK', rank: 7, rp: 2.3, epa: 31.4 },
		{
			number: 2410,
			name: 'Metal Mustangers',
			city: 'Overland Park',
			state: 'KS',
			rank: 8,
			rp: 2.2,
			epa: 33.1
		},
		{
			number: 5454,
			name: 'Dentures',
			city: 'Bentonville',
			state: 'AR',
			rank: 9,
			rp: 2.1,
			epa: 30.5
		},
		{
			number: 5801,
			name: 'CTC Inspire',
			city: 'Independence',
			state: 'MO',
			rank: 10,
			rp: 2.0,
			epa: 29.0
		},
		{ number: 2352, name: 'Metal Mayhem', city: 'Enid', state: 'OK', rank: 11, rp: 1.9, epa: 26.5 },
		{
			number: 2395,
			name: 'Team Ninja',
			city: 'Oklahoma City',
			state: 'OK',
			rank: 12,
			rp: 1.8,
			epa: 25.0
		},
		{ number: 2457, name: 'The Law', city: 'Lawton', state: 'OK', rank: 13, rp: 1.7, epa: 24.2 },
		{
			number: 6424,
			name: 'Stealth Panther',
			city: 'Knob Noster',
			state: 'MO',
			rank: 14,
			rp: 1.6,
			epa: 23.5
		},
		{ number: 7426, name: 'PARE', city: 'Stillwater', state: 'OK', rank: 15, rp: 1.5, epa: 21.0 },
		{ number: 8044, name: 'Denali', city: 'Fairbanks', state: 'AK', rank: 16, rp: 1.4, epa: 19.5 },
		{
			number: 8840,
			name: 'Bayou Robotics',
			city: 'New Orleans',
			state: 'LA',
			rank: 17,
			rp: 1.3,
			epa: 18.2
		},
		{
			number: 9401,
			name: 'Midnight Robotics',
			city: 'Broken Arrow',
			state: 'OK',
			rank: 18,
			rp: 1.1,
			epa: 16.0
		}
	];

	for (const t of teamsList) {
		const metadata = JSON.stringify({
			city: t.city,
			state_prov: t.state,
			country: 'USA',
			rank: t.rank,
			ranking_score: t.rp,
			opr: t.epa - 2,
			epa: t.epa
		});
		await client.execute({
			sql: `INSERT INTO teams (teamNumber, name, metadata) VALUES (?, ?, ?)`,
			args: [t.number, t.name, metadata]
		});
	}

	// 4. Insert Matches
	const matchesData = [
		{
			id: 'qm1',
			num: 1,
			type: 'qualification',
			r1: 16,
			r2: 2341,
			r3: 5801,
			b1: 1986,
			b2: 2410,
			b3: 7426,
			rs: 112,
			bs: 98
		},
		{
			id: 'qm2',
			num: 2,
			type: 'qualification',
			r1: 4522,
			r2: 2352,
			r3: 8044,
			b1: 3937,
			b2: 5454,
			b3: 8840,
			rs: 88,
			bs: 76
		},
		{
			id: 'qm3',
			num: 3,
			type: 'qualification',
			r1: 2718,
			r2: 4911,
			r3: 9401,
			b1: 2395,
			b2: 2457,
			b3: 6424,
			rs: 104,
			bs: 62
		},
		{
			id: 'qm4',
			num: 4,
			type: 'qualification',
			r1: 1986,
			r2: 4522,
			r3: 2341,
			b1: 16,
			b2: 2718,
			b3: 5454,
			rs: 125,
			bs: 130
		},
		{
			id: 'qm5',
			num: 5,
			type: 'qualification',
			r1: 3937,
			r2: 2410,
			r3: 2352,
			b1: 4911,
			b2: 5801,
			b3: 2395,
			rs: 85,
			bs: 92
		},
		{
			id: 'qm6',
			num: 6,
			type: 'qualification',
			r1: 6424,
			r2: 7426,
			r3: 8840,
			b1: 2457,
			b2: 8044,
			b3: 9401,
			rs: 55,
			bs: 48
		},
		{
			id: 'qm7',
			num: 7,
			type: 'qualification',
			r1: 16,
			r2: 3937,
			r3: 2457,
			b1: 4522,
			b2: 4911,
			b3: 8044,
			rs: 108,
			bs: 95
		},
		{
			id: 'qm8',
			num: 8,
			type: 'qualification',
			r1: 2718,
			r2: 1986,
			r3: 8840,
			b1: 2341,
			b2: 2410,
			b3: 2352,
			rs: 118,
			bs: 82
		},
		{
			id: 'qm9',
			num: 9,
			type: 'qualification',
			r1: 5454,
			r2: 5801,
			r3: 6424,
			b1: 2395,
			b2: 7426,
			b3: 9401,
			rs: 72,
			bs: 58
		},
		{
			id: 'qm10',
			num: 10,
			type: 'qualification',
			r1: 16,
			r2: 4522,
			r3: 2718,
			b1: 1986,
			b2: 3937,
			b3: 4911,
			rs: 142,
			bs: 138
		},
		{
			id: 'qm11',
			num: 11,
			type: 'qualification',
			r1: 2341,
			r2: 5454,
			r3: 2395,
			b1: 2410,
			b2: 5801,
			b3: 2457,
			rs: 78,
			bs: 80
		},
		{
			id: 'qm12',
			num: 12,
			type: 'qualification',
			r1: 2352,
			r2: 6424,
			r3: 7426,
			b1: 8044,
			b2: 8840,
			b3: 9401,
			rs: 60,
			bs: 52
		},
		{
			id: 'qm13',
			num: 13,
			type: 'qualification',
			r1: 16,
			r2: 1986,
			r3: 2410,
			b1: 4522,
			b2: 2718,
			b3: 3937,
			rs: 135,
			bs: 128
		},
		{
			id: 'qm14',
			num: 14,
			type: 'qualification',
			r1: 4911,
			r2: 2341,
			r3: 5801,
			b1: 5454,
			b2: 2352,
			b3: 6424,
			rs: 96,
			bs: 74
		},
		{
			id: 'qm15',
			num: 15,
			type: 'qualification',
			r1: 2395,
			r2: 2457,
			r3: 7426,
			b1: 8044,
			b2: 8840,
			b3: 9401,
			rs: 64,
			bs: 60
		},
		{
			id: 'sf1m1',
			num: 1,
			type: 'playoff',
			r1: 16,
			r2: 2718,
			r3: 2341,
			b1: 4522,
			b2: 3937,
			b3: 5454,
			rs: 138,
			bs: 115
		},
		{
			id: 'sf2m1',
			num: 2,
			type: 'playoff',
			r1: 1986,
			r2: 4911,
			r3: 2410,
			b1: 5801,
			b2: 2352,
			b3: 2395,
			rs: 126,
			bs: 90
		},
		{
			id: 'f1m1',
			num: 1,
			type: 'playoff',
			r1: 16,
			r2: 2718,
			r3: 2341,
			b1: 1986,
			b2: 4911,
			b3: 2410,
			rs: 145,
			bs: 140
		}
	];

	for (const m of matchesData) {
		await client.execute({
			sql: `INSERT INTO matches (id, matchNumber, matchType, red1, red2, red3, blue1, blue2, blue3, red_score, blue_score)
			      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [m.id, m.num, m.type, m.r1, m.r2, m.r3, m.b1, m.b2, m.b3, m.rs, m.bs]
		});
	}

	// 5. Insert Pit Scouting Reports
	const drivetrains = ['SDS Mk4i Swerve', 'WCP Swerve X', 'REV MAXSwerve', '6-Wheel Tank Drive'];
	const shooters = ['Dual Flywheel Turret', 'Hooded Shooter', 'Fixed Angle Flywheel', 'Catapult'];
	const intakes = ['Under-Bumper Roller', 'Over-Bumper 4-Bar', 'Ground Roller Claw'];

	for (let i = 0; i < teamsList.length; i++) {
		const t = teamsList[i];
		const pitData = {
			scoutName: i % 2 === 0 ? 'Alex' : 'Jordan',
			drivetrain: drivetrains[i % drivetrains.length],
			shooterType: shooters[i % shooters.length],
			intakeType: intakes[i % intakes.length],
			climb: i < 6 ? 'Level 3' : i < 12 ? 'Level 2' : 'Level 1',
			canGoUnderTrench: i % 3 !== 0,
			weightLbs: Math.round(105 + i * 1.5),
			hopperCapacity: Math.round(40 + i * 2),
			fuelPerSecond: (3.5 - i * 0.1).toFixed(1),
			driverYOE: Math.max(1, 4 - Math.floor(i / 5)),
			autoStart: i % 3 === 0 ? 'Left Subwoofer' : i % 3 === 1 ? 'Center' : 'Right Trench',
			autoFeatures: ['mobility', 'preloadFuel', 'trenchRun', 'centerNotePickup'].slice(
				0,
				Math.max(1, 4 - Math.floor(i / 5))
			),
			knownIssues: i % 4 === 0 ? 'Intake belt tension slips after heavy collisions.' : null,
			comments: `Solid robot structure from ${t.name}. Fast cycle time and agile swerve tuning.`,
			timestamp: new Date().toISOString()
		};

		await client.execute({
			sql: `INSERT INTO pit_scouting_reports (team_number, scouter_name, data, created_at)
			      VALUES (?, ?, ?, strftime('%s', 'now'))`,
			args: [t.number, pitData.scoutName, JSON.stringify(pitData)]
		});
	}

	// 6. Insert Match Scouting Observations
	const scouters = ['Noah', 'Sarah', 'Alex', 'Taylor', 'Chris', 'Jordan'];
	let reportId = 1001;

	for (const m of matchesData.slice(0, 15)) {
		const redTeams = [m.r1, m.r2, m.r3];
		const blueTeams = [m.b1, m.b2, m.b3];

		for (const teamNum of redTeams) {
			const teamInfo = teamsList.find((x) => x.number === teamNum);
			const quality = (teamInfo?.rank ?? 10) <= 6 ? 4.5 : (teamInfo?.rank ?? 10) <= 12 ? 3.5 : 2.5;

			const data = {
				alliance: 0,
				startingPosition: 2,
				stagesComplete: 4,
				didLeave: true,
				autoClimbed: quality > 4,
				autoFuel: Math.round(quality * 1.2),
				autoFuelMissed: Math.round(Math.max(0, 5 - quality)),
				teleFuelScoredAny: true,
				teleFuelScore: Math.min(5, Math.round(quality)),
				teleDidPass: quality > 3,
				telePassScore: quality > 3 ? Math.min(5, Math.round(quality)) : 0,
				teleDidDef: quality <= 3.5,
				teleDefScore: quality <= 3.5 ? 4 : 0,
				climbType: quality > 4 ? 3 : quality > 3 ? 2 : 1,
				cardReceived: 0,
				notes: `Strong match from ${teamNum}. Smooth cycles and consistent teleop.`
			};

			await client.execute({
				sql: `INSERT INTO scouting_reports (id, match_id, team_number, scouter_name, data, created_at)
				      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))`,
				args: [
					reportId++,
					m.id,
					teamNum,
					scouters[reportId % scouters.length],
					JSON.stringify(data)
				]
			});
		}

		for (const teamNum of blueTeams) {
			const teamInfo = teamsList.find((x) => x.number === teamNum);
			const quality = (teamInfo?.rank ?? 10) <= 6 ? 4.5 : (teamInfo?.rank ?? 10) <= 12 ? 3.5 : 2.5;

			const data = {
				alliance: 1,
				startingPosition: 1,
				stagesComplete: 4,
				didLeave: true,
				autoClimbed: quality > 4,
				autoFuel: Math.round(quality * 1.1),
				autoFuelMissed: Math.round(Math.max(0, 5 - quality)),
				teleFuelScoredAny: true,
				teleFuelScore: Math.min(5, Math.round(quality)),
				teleDidPass: quality > 3,
				telePassScore: quality > 3 ? Math.min(5, Math.round(quality)) : 0,
				teleDidDef: quality <= 3.5,
				teleDefScore: quality <= 3.5 ? 3 : 0,
				climbType: quality > 4 ? 3 : quality > 3 ? 2 : 1,
				cardReceived: 0,
				notes: `Good performance in match ${m.id}.`
			};

			await client.execute({
				sql: `INSERT INTO scouting_reports (id, match_id, team_number, scouter_name, data, created_at)
				      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))`,
				args: [
					reportId++,
					m.id,
					teamNum,
					scouters[reportId % scouters.length],
					JSON.stringify(data)
				]
			});
		}
	}

	console.log(
		`Seeded ${teamsList.length} teams, ${matchesData.length} matches, ${teamsList.length} pit reports, and ${reportId - 1001} scouting reports.`
	);
}

seed().catch(console.error);
