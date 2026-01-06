import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { WorkoutLog } from "../types/models";
import { format, parseISO } from "date-fns";

export const useWorkouts = () => {
  const queryClient = useQueryClient();

  // 1. FETCHING (READ)
  // This hook can be used in Dashboard AND WorkoutTwacker.
  // They will share the same data cache.
  const workoutsQuery = useQuery({
    queryKey: ["workouts"], // The unique ID for this data
    queryFn: async () => {
      const { data } = await api.get<WorkoutLog[]>("api/v1/workouts/");

      return data.map((w) => ({
        ...w,
        workoutdate: format(parseISO(w.begintime), "yyyy-MM-dd"),
      }));
    },
    staleTime: 1000 * 60 * 5, // Data is "fresh" for 5 minutes. Don't refetch if navigating.
  });

  // 2. MUTATION (CREATE)
  // When we add a workout, we force everyone using ['workouts'] to refresh.
  const addWorkoutMutation = useMutation({
    mutationFn: (newWorkout: any) => api.post("api/v1/workouts/", newWorkout),
    onSuccess: () => {
      // This is the magic. It tells Dashboard to re-fetch automatically!
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const editWorkoutMutation = useMutation({
    mutationFn: (newWorkout: any) =>
      api.put(`api/v1/workouts/${newWorkout.id}/`, newWorkout),
    onSuccess: () => {
      // This is the magic. It tells Dashboard to re-fetch automatically!
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  return {
    workouts: workoutsQuery.data || [],
    workouts__isLoading: workoutsQuery.isLoading,
    addWorkout: addWorkoutMutation.mutateAsync,
    editWorkout: editWorkoutMutation.mutateAsync,
  };
};
