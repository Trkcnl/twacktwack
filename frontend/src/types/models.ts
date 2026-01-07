export interface MeasurementType {
  readonly id: number;
  readonly name: string;
  readonly unit: string;
}

export interface Measurement {
  readonly id: number;
  date: string;
  value: number;
  measurement_type: MeasurementType;
}

export interface WorkoutLog {
  readonly id: number;
  workoutdate: string;
  begintime: string;
  endtime: string;
  exercise_logs: ExerciseLog[];
}

export interface ExerciseType {
  readonly id: number;
  readonly name: string;
  readonly created: Date;
}

export interface ExerciseLog {
  readonly id: number;
  exercise_type: ExerciseType;
  exercise_sets: ExerciseSet[];
}

export interface ExerciseSet {
  readonly id: number;
  weight_kg: number;
  reps: number;
  rpe: number;
  rir: number;
}

export interface PersonalBest {
  exercise_type: ExerciseType;
  weight_kg: number;
  reps: number;
  date: string;
}
