import { useMemo } from "react";
import { compareAsc, subDays, format } from "date-fns";
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

// ------------------------------------------------------------------
// 1. MOCK DATA (Replace with API calls later)
// ------------------------------------------------------------------

const USER_STATS = {
  name: "Alex",
  currentWeight: 78.5,
  totalGymDays: 142,
  weeklySets: 45,
};

// Activity Data: Which days the user went to the gym
const WEEKLY_ACTIVITY = [
  { day: "Mon", active: true },
  { day: "Tue", active: true },
  { day: "Wed", active: false },
  { day: "Thu", active: true },
  { day: "Fri", active: true },
  { day: "Sat", active: false },
  { day: "Sun", active: false },
];

// Colors for the Pie Chart slices
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PERSONAL_RECORDS = [
  { exercise: "Bench Press", value: "100 kg", date: "2024-02-15" },
  { exercise: "Deadlift", value: "140 kg", date: "2024-03-01" },
  { exercise: "Squat", value: "120 kg", date: "2024-01-20" },
];

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
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
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

  // Pick a random PR to display
  const randomPR = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PERSONAL_RECORDS.length);
    return PERSONAL_RECORDS[randomIndex];
  }, []);

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

  const exerciseTypeSetCount = useMemo(() => {
    const today = new Date();
    // 1. Filter: Get workouts from the last 7 days
    const recentWorkouts = workouts.filter(
      (w) =>
        compareAsc(new Date(w.begintime), today) < 1 &&
        compareAsc(new Date(w.begintime), subDays(today, 7)) === 1
    );

    const countMap = new Map();

    // 2. Aggregate: Loop through workouts -> logs -> sum up sets
    recentWorkouts.forEach((workout) => {
      workout.exercise_logs.forEach((log) => {
        const typeName = log.exercise_type.name;
        const numberOfSets = log.exercise_sets.length;

        // Add to existing total or initialize with current number
        const currentTotal = countMap.get(typeName) || 0;
        countMap.set(typeName, currentTotal + numberOfSets);
      });
    });

    // 3. Transform: Return an array of objects for easy display/charting
    return Array.from(countMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [workouts]);

  const totalWeeklySets = exerciseTypeSetCount.reduce(
    (sum, item) => sum + item.count,
    0
  );

  if (measurements__isLoading || workouts__isLoading) {
    return <div>Loading.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      {/* --- SECTION 1: HEADER STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Weight"
          value={`${parseFloat(weightHistory.at(-1).value).toFixed(1)} kg`}
          icon={Scale}
        />
        <StatCard
          title="Total Gym Days"
          value={USER_STATS.totalGymDays}
          icon={CalendarCheck}
          subtext="Lifetime total"
        />
        <StatCard
          title="Weekly Volume"
          value={totalWeeklySets}
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
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-orange-600/80 font-medium">
                    {randomPR.exercise}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {randomPR.value}
                  </h3>
                </div>
                <span className="text-xs text-orange-400 bg-white/50 px-2 py-1 rounded">
                  {randomPR.date}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* B2. WEEKLY ACTIVITY TRACKER */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                {WEEKLY_ACTIVITY.map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    {/* The Dot */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                                            ${
                                              item.active
                                                ? "bg-green-500 text-white shadow-md shadow-green-200"
                                                : "bg-gray-100 text-gray-300"
                                            }`}
                    >
                      {item.active && <Activity className="w-4 h-4" />}
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
          <CardContent className="h-62.5 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exerciseTypeSetCount}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {exerciseTypeSetCount.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
