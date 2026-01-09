import { useMemo } from "react";
import {
  compareAsc,
  subDays,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Trophy, Activity, Dumbbell, Scale, CalendarCheck } from "lucide-react";

// --- HOOKS
import { useAuth } from "@/context/AuthHook";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useMeasurements } from "@/hooks/useMeasurements";

// --- SHADCN IMPORTS ---
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { Navigate } from "react-router-dom";

// Colors for the Pie Chart slices
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ------------------------------------------------------------------
// 2. SUB-COMPONENTS (For cleaner code)
// ------------------------------------------------------------------

// A simple helper to render a "Stat Box" in the header
const StatCard = ({ title, value, icon: Icon, subtext }: any) => (
  <Card>
    <CardContent className="p-6 flex items-center gap-4">
      <div className="p-3 bg-blue-50 rounded-full text-blue-600">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground pb-2">
          {title}
        </p>
        <h3 className="text-2xl font-bold">{value || "No records found."}</h3>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </CardContent>
  </Card>
);

// ------------------------------------------------------------------
// 3. MAIN DASHBOARD COMPONENT
// ------------------------------------------------------------------

export const Dashboard = () => {
  const { user } = useAuth();
  const { workouts, workouts__isLoading } = useWorkouts();
  const { measurements, measurements__isLoading } = useMeasurements();
  const { records, records__isLoading } = usePersonalRecords();

  if (workouts.length === 0) {
    return (<Navigate to={"/workout_twacker"}></Navigate>)
  }

  if (measurements.length === 0) {
    return (<Navigate to={"/workout_twacker"}></Navigate>)
  }

  // Pick a random PR to display
  const randomRecord =
    records && records.length > 0
      ? records[Math.floor(Math.random() * records.length)]
      : null;

  const weightHistory = useMemo(() => {
    const today = new Date();

    // 1. Filter: Last 7 days + Weight type
    const lastWeekData = measurements.filter(
      (m) =>
        m.measurement_type.name === "Weight" &&
        compareAsc(new Date(m.date), today) < 1 &&
        compareAsc(new Date(m.date), subDays(today, 7)) === 1
    );

    // 2. Group: Ensure unique entry per day (Map overwrites duplicates, keeping the last one)
    const dailyMap = new Map();
    lastWeekData.forEach((item) => {
      dailyMap.set(item.date, item);
    });

    // 3. Sort: Convert to array and sort ASCENDING by date
    // (Crucial for Moving Average calculation)
    const sortedData = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 4. Transform: Add 'weekday' and 'movingAverage'
    return sortedData.map((item, index, array) => {
      const currentValue = parseFloat(item.value);

      // --- Calculate 3-Day Moving Average ---
      // Grab previous 2 days if they exist in the filtered list
      const prev1 = array[index - 1]
        ? parseFloat(array[index - 1].value)
        : null;
      const prev2 = array[index - 2]
        ? parseFloat(array[index - 2].value)
        : null;

      let sum = currentValue;
      let count = 1;

      if (prev1 !== null) {
        sum += prev1;
        count++;
      }
      if (prev2 !== null) {
        sum += prev2;
        count++;
      }

      const movingAvg = sum / count;

      return {
        ...item,
        // Format date to "Sun", "Mon", etc.
        weekday: format(new Date(item.date), "eee"),
        // Format average to 2 decimal places
        movingAverage: movingAvg.toFixed(2),
      };
    });
  }, [measurements]);

  const recentWorkouts = useMemo(() => {
    const today = new Date();
    return workouts.filter(
      (w) =>
        compareAsc(new Date(w.workoutdate), today) < 1 &&
        compareAsc(new Date(w.workoutdate), subDays(today, 7)) === 1
    );
  }, [workouts]);

  const weeklyActivity = useMemo(() => {
    // 1. Create a Lookup Set for fast checking
    // Format matches your backend date string "YYYY-MM-DD"
    const activeDates = new Set(recentWorkouts.map((w) => w.workoutdate));

    const today = new Date();

    // 2. Define the Week Range (Mon - Sun)
    // Note: weekStartsOn: 1 ensures the array starts on Monday
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });

    // 3. Generate all 7 days of this week
    const calendarDays = eachDayOfInterval({ start, end });
    // 4. Map to your desired format
    return calendarDays.map((date) => {
      const dateString = format(date, "yyyy-MM-dd");
      return {
        day: format(date, "eee"), // "Mon", "Tue", etc.
        active: activeDates.has(dateString),
        future: compareAsc(date, today),
      };
    });
  }, [recentWorkouts]);

  const exerciseTypeSetCount = (() => {
    const countMap = new Map();
    recentWorkouts.forEach((workout) => {
      workout.exercise_logs.forEach((log) => {
        const muscleGroup = log.exercise_type.muscle_group;
        const numberOfSets = log.exercise_sets.length;
        countMap.set(muscleGroup, (countMap.get(muscleGroup) || 0) + numberOfSets);
      });
    });
    return Array.from(countMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  })();

  const totalSetsThisWeek = exerciseTypeSetCount.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const distinctDaysAllTime = new Set(workouts.map((w) => w.workoutdate)).size;

  if (measurements__isLoading || workouts__isLoading || records__isLoading) {
    return <div>Loading.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      {/* --- SECTION 1: HEADER STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Weight"
          value={
            weightHistory.at(-1)
              ? `${parseFloat(weightHistory.at(-1).value).toFixed(1)} kg`
              : null
          }
          icon={Scale}
        />
        <StatCard
          title="Total Gym Days"
          value={distinctDaysAllTime}
          icon={CalendarCheck}
          subtext="Lifetime total"
        />
        <StatCard
          title="Weekly Volume"
          value={totalSetsThisWeek}
          icon={Dumbbell}
          subtext="Total sets this week"
        />
        <StatCard
          title="Welcome Back"
          value={user ? user.username : "Undefined"}
          icon={Activity}
          subtext="Keep pushing!"
        />
      </div>

      {/* --- SECTION 2: BODY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. WEIGHT LINE GRAPH (Takes up 2 columns on large screens) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weight Trends</CardTitle>
            <CardDescription>
              Your weight vs. weekly moving average.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="weekday"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend verticalAlign="bottom" height={12} />
                {/* Actual Weight Line */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                  name="Weight"
                />
                {/* Average Line (Dashed) */}
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Moving Avg"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* B. RIGHT COLUMN STACK */}
        <div className="space-y-6">
          {/* B1. RANDOM PR CARD */}
          <Card className="bg-linear-to-br from-yellow-50 to-orange-50 border-orange-100">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
                <Trophy className="w-5 h-5" /> Personal Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              {randomRecord ? (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-orange-600/80 font-medium">
                      {randomRecord.exercise_type.name}
                    </p>
                    <h3 className="text-3xl font-bold text-gray-800">
                      {randomRecord.weight_kg} kg
                    </h3>
                  </div>
                  <span className="text-xs text-orange-400 bg-white/50 px-2 py-1 rounded">
                    {randomRecord.date}
                  </span>
                </div>
              ) : (
                <div className="text-2xl">No records found!</div>
              )}
            </CardContent>
          </Card>

          {/* B2. WEEKLY ACTIVITY TRACKER */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                {weeklyActivity.map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    {/* The Dot */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                                            ${
                                              item.future === 1
                                                ? "bg-gray-100 text-gray-300"
                                                : item.active
                                                  ? "bg-green-500 text-white shadow-md shadow-green-200"
                                                  : "bg-yellow-500 text-white shadow-md shadow-yellow-200"
                                            }`}
                    >
                      <Activity className="w-4 h-4" />
                    </div>
                    {/* The Label */}
                    <span
                      className={`text-xs font-semibold ${item.active ? "text-gray-800" : "text-gray-400"}`}
                    >
                      {item.day.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* C. MUSCLE PIE CHART (Bottom Row) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Muscle Group Distribution</CardTitle>
            <CardDescription>
              Total sets performed per muscle group this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-50 flex items-center justify-center">
            {totalSetsThisWeek > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exerciseTypeSetCount}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {exerciseTypeSetCount.map((entry, index) => (
                      <Cell
                        key={`cell-${index}-${entry.name}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div>No exercise acivity for the current week!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
