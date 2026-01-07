import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import type { MeasurementType } from "../types/models";

export const useMeasurementTypes = () => {
  // 1. FETCHING (READ)
  // This hook can be used in Dashboard AND WorkoutTwacker.
  // They will share the same data cache.
  const measurementTypesQuery = useQuery({
    queryKey: ["measurementTypes"], // The unique ID for this data
    queryFn: async () => {
      const { data } = await api.get<MeasurementType[]>(
        "api/v1/measurement-types/"
      );
      return data;
    },
    staleTime: 1000 * 60 * 5, // Data is "fresh" for 5 minutes. Don't refetch if navigating.
  });

  return {
    measurementTypes: measurementTypesQuery.data || [],
    measurementTypes__isLoading: measurementTypesQuery.isLoading,
  };
};
