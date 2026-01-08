import { renderHook, waitFor } from "@testing-library/react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import api from "@/services/api"; // We will mock this

// MOCK AXIOS
vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// WRAPPER FOR REACT QUERY
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useWorkouts Hook", () => {
  it("fetches and transforms workout dates correctly", async () => {
    // 1. Mock the API response (Raw Backend Data)
    const mockData = [
      {
        id: 1,
        begintime: "2023-10-05T08:00:00Z",
        endtime: "2023-10-05T09:00:00Z",
        exercise_logs: [],
      },
    ];

    // Tell the mock what to return
    (api.get as any).mockResolvedValue({ data: mockData });

    // 2. Render the Hook
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    // 3. Wait for loading to finish
    await waitFor(() => expect(result.current.workouts__isLoading).toBe(false));

    // 4. Assert Transformation
    expect(result.current.workouts).toHaveLength(1);
    // Check if format(parseISO(...)) worked
    expect(result.current.workouts[0].workoutdate).toBe("2023-10-05");
  });
});
