import { useQuery} from '@tanstack/react-query';
import api from '../services/api';
import type { ExerciseType } from '../types/models';

export const useExerciseTypes = () => {

    // 1. FETCHING (READ)
    // This hook can be used in Dashboard AND WorkoutTwacker.
    // They will share the same data cache.
    const exerciseTypesQuery = useQuery({
        queryKey: ['exerciseTypes'], // The unique ID for this data
        queryFn: async () => {
            const { data } = await api.get<ExerciseType[]>("api/v1/exercise-types/");
            return data;
        },
        staleTime: 1000 * 60 * 5, // Data is "fresh" for 5 minutes. Don't refetch if navigating.
    });

    return {
        exerciseTypes: exerciseTypesQuery.data || [],
        exerciseTypes__isLoading: exerciseTypesQuery.isLoading,
    };
};