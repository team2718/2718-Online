export interface ScoutingReportData {
    /** Unique identifier for the specific report */
    uid: number;
    /** Team number being scouted (e.g., 254) */
    teamNumber: number;
    /** Match number the data was collected in */
    matchNumber: number;
    /** Name of the student performing the scouting */
    scoutName: string;
    /** 0 for Blue alliance, 1 for Red alliance */
    alliance: number;
    /** Starting position on the field (0-2) */
    startingPosition: number;
    /** Completion timestamp in Unix seconds */
    unixTimeComplete: number;
    /** Current stage of the scouting form completion */
    stagesComplete: number;
    /** Qualitative scouter notes */
    notes: string;
    /** Whether the robot left the starting tarmac in Auto */
    didLeave: boolean;
    /** Total fuel/game pieces scored in Auto */
    autoFuel: number;
    /** Total fuel/game pieces missed in Auto */
    autoFuelMissed: number;
    /** Whether the robot successfully climbed in Auto */
    autoClimbed: boolean;
    /** Teleop scoring rate (1-5 scale) */
    teleFuelRateScore: number;
    /** Teleop accuracy (1-5 scale) */
    teleAccScore: number;
    /** Teleop passing efficiency (1-5 scale) */
    telePassScore: number;
    /** Teleop defensive capability (1-5 scale) */
    teleDefScore: number;
    /** 0: No Climb, 1: Parked, 2: Climbed, 3: Level */
    climbType: number;
    /** Penalties received: 0 (None), 1 (Yellow), 2 (Red) */
    cardReceived: number;
}