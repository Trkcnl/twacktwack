import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutTwacker } from "@/pages/WorkoutTwacker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";

// 1. MOCK THE CUSTOM HOOKS
// We mock the hooks so we don't need real API calls for UI testing
vi.mock("@/hooks/useWorkouts", () => ({
  useWorkouts: () => ({
    workouts: [],
    workouts__isLoading: false,
    addWorkout: vi.fn(), // We can spy on this later
    editWorkout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useExerciseTypes", () => ({
  useExerciseTypes: () => ({
    exerciseTypes: [
      { id: 1, name: "Bench Press", muscle_group: "Chest" },
      { id: 2, name: "Squat", muscle_group: "Legs" },
    ],
    exerciseTypes__isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("WorkoutTwacker Component", () => {
  it("allows adding a new exercise and set", async () => {
    render(<WorkoutTwacker />, { wrapper: createWrapper() });

    // 1. Open the form
    fireEvent.click(screen.getByText(/Log Workout/i));

    // 2. Assert Exercise Row appeared
    // Note: Radix UI Selects are hard to test directly, usually we check if the trigger exists
    expect(screen.getByText(/Select exercise/i)).toBeInTheDocument();

    // 3. Add a Set to that Exercise
    fireEvent.click(screen.getByText(/Add Set/i));

    // 4. Check if inputs appeared (Weight and Reps)
    // We look for inputs with type="number"
    const inputs = screen.getAllByRole("spinbutton"); // 'spinbutton' = input type="number"
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("validates negative numbers", async () => {
    // This tests your Zod schema integration via UI
    render(<WorkoutTwacker />, { wrapper: createWrapper() });

    // Open Form
    fireEvent.click(screen.getByText(/Log Workout/i));
    fireEvent.click(screen.getByText(/Add Set/i));

    const inputs = screen.getAllByRole("spinbutton");
    const weightInput = inputs[0];

    // Enter negative weight
    fireEvent.change(weightInput, { target: { value: "-10" } });

    // Try to save
    fireEvent.click(screen.getByText(/Save Workout/i));

    // Expect validation error
    // (You might need to adjust the text string to match exactly what you put in Zod)
    expect(
      await screen.findByText(/Please enter a positive weight/i)
    ).toBeInTheDocument();
  });
});
