export interface ScoutingReportData {
    /** Unique identifier for the specific report */
    uid: number;
    /** Team number being scouted (e.g., 254) */
    teamNumber: number;
    /** Match number the data was collected in */
    matchNumber: number;
    /** Name of the student performing the scouting */
    scoutName: string;
    /** 0 for Red alliance, 1 for Blue alliance */
    alliance: number;
    /** 0: Left Trench (Depot side), 1: Left Bump, 2: Center, 3: Right Bump, 4: Right Trench (Outpost side) */
    startingPosition: number;
    /** Completion timestamp in Unix seconds */
    unixTimeComplete: number;
    /** 0=New, 1=Match Info, 2=Auto, etc. */
    stagesComplete: number;
    /** Qualitative scouter notes */
    notes: string;
    /** Whether the robot moved at all in Auto */
    didLeave: boolean;
    /** Total fuel/game pieces scored in Auto */
    autoFuel: number;
    /** Total fuel/game pieces missed in Auto */
    autoFuelMissed: number;
    /** Whether the robot successfully climbed in Auto */
    autoClimbed: boolean;
    /** Whether the robot scored any fuel in Teleop */
    teleFuelScoredAny?: boolean;
    /** Teleop fuel quality (1-5 scale) */
    teleFuelScore: number;
    /** Whether the robot actively passed game pieces in Teleop */
    teleDidPass?: boolean;
    /** Teleop passing efficiency (1-5 scale) */
    telePassScore: number;
    /** Whether the robot played defense in Teleop */
    teleDidDef?: boolean;
    /** Teleop defensive capability (1-5 scale) */
    teleDefScore: number;
    /** 0: None, 1: L1, 2: L2, 3: L3 */
    climbType: number;
    /** 0: None, 1: Yellow, 2: Red */
    cardReceived: number;
}

export interface PitScoutReportData {
    /** Name of the student performing the pit scouting */
    scoutName: string;
    /** Team number being scouted */
    teamNumber: string;
    /** Main driver's years of experience (e.g., "2 years") */
    driverYOE: string;
    /** Capacity of the robot's hopper (e.g., "21-40") */
    hopperCapacity: string;
    /** Type of drivetrain (e.g., "Swerve", "Tank") */
    drivetrain: string;
    /** Type of shooter mechanism used */
    shooterType: string;
    /** Intake mechanism configuration */
    intakeType: string;
    /** List of keys for autonomous capabilities (scorePreload, intakeMiddle, etc.) */
    autoFeatures: string[];
    /** Preferred starting location for autonomous */
    autoStart: string;
    /** Highest level of climbing capable */
    climb: string;
    /** Whether the robot can fit under the trench */
    canGoUnderTrench?: boolean;
    /** Scoring speed in fuel per second */
    fuelPerSecond: string;
    /** Total weight of the robot in pounds */
    weightLbs: string;
    /** Known electrical or mechanical weak points */
    knownIssues: string;
    /** General notes from the pit crew */
    comments: string;
    /** ISO timestamp of when the report was saved */
    timestamp: string;
}