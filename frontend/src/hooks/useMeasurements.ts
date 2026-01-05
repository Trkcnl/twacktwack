import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { Measurement } from "../types/models";

export const useMeasurements = () => {
  const queryClient = useQueryClient();

  const measurementsQuery = useQuery({
    queryKey: ["measurements"],
    queryFn: async () => {
      const { data } = await api.get<Measurement[]>("api/v1/measurements/");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const addMeasurementMutation = useMutation({
    mutationFn: (newMeasurement: any) =>
      api.post("api/v1/measurements/", newMeasurement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });

  const editMeasurementMutation = useMutation({
    mutationFn: (newMeasurement: any) =>
      api.put(`api/v1/measurements/${newMeasurement.id}/`, newMeasurement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });

  return {
    measurements: measurementsQuery.data || [],
    measurements__isLoading: measurementsQuery.isLoading,
    addMeasurement: addMeasurementMutation.mutateAsync,
    editMeasurement: editMeasurementMutation.mutateAsync,
  };
};
