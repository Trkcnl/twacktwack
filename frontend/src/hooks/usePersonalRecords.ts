// hooks/usePersonalRecords.ts
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type { WorkoutLog, PersonalBest } from "../types/models"; // Import your types

export const usePersonalRecords = () => {
  const recordsQuery = useQuery({
    queryKey: ["workouts"], // Must match your main workouts key
    queryFn: async () => {
      // It's okay to define this again, React Query dedupes the request
      const { data } = await api.get<WorkoutLog[]>("api/v1/workouts/");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes

    // THE MAGIC: The select function runs only when data changes
    select: (data) => {
      const bestsMap: Record<string, PersonalBest> = {};

      data.forEach((workout) => {
        workout.exercise_logs.forEach((log) => {
          const exerciseName = log.exercise_type.name;
          log.exercise_sets.forEach((set) => {
            const currentWeight = Number(set.weight_kg);
            if (!currentWeight || currentWeight <= 0) return;

            if (
              !bestsMap[exerciseName] ||
              currentWeight > bestsMap[exerciseName].weight_kg
            ) {
              bestsMap[exerciseName] = {
                exercise_type: log.exercise_type,
                weight_kg: currentWeight,
                reps: set.reps,
                date: workout.workoutdate,
              };
            }
          });
        });
      });

      return Object.values(bestsMap).sort((a, b) =>
        a.exercise_type.name.localeCompare(b.exercise_type.name)
      );
    },
  });

  return {
    records: recordsQuery.data || [],
    records__isLoading: recordsQuery.isLoading,
  };
};
