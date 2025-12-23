import type { User } from "./auth.ts";

export interface MeasurementType {
    readonly id: number;
    readonly name: string;
    readonly unit: string;
    readonly created: Date;
}

export interface Measurement {
    readonly id: number;
    value: number;
    measurement_type: MeasurementType;
    user: User;
    readonly created: Date;
}

export interface UserProfile {
    readonly id: number;
    name: string;
    birthdate: Date;
    height: number;
    bio: string;
    user: User;
    readonly created: Date;
    readonly modified: Date;
}

export interface WorkoutLog {
    readonly id: number;
    begintime: Date;
    endtime: Date;
    readonly created: Date;
    user: User;
}

export interface ExerciseType {
    readonly id: number;
    readonly name: string;
    readonly created: Date;
}

export interface ExerciseLog {
    readonly id: number;
    exercise_type: ExerciseType;
    workout_log: WorkoutLog;
    readonly created: Date;
}

export interface ExerciseSet {
    readonly id: number;
    exercise_log: ExerciseLog;
    weight_kg: number;
    reps: number;
    rpe: number;
    rir: number;
    readonly created: Date;
}
