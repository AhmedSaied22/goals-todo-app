import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Target, CheckSquare, TrendingUp, Trophy } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useTodos } from "@/hooks/useTodos";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { buildGoalProgressMap } from "@/lib/goalProgress";

const CHART_COLORS = {
    notStarted: "#94a3b8",
    inProgress: "#8b5cf6",
    completed: "#22c55e",
};

export function DashboardPage() {
    const { data: goals, isLoading: goalsLoading } = useGoals();
    const { data: todos, isLoading: todosLoading } = useTodos();

    const goalProgressMap = useMemo(() => {
        if (!goals || !todos) return {};
        return buildGoalProgressMap(goals, todos);
    }, [goals, todos]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!goals || !todos) return null;

        const progressValues = goals.map(
            (goal) => goalProgressMap[goal.id]?.percent ?? 0
        );
        const notStarted = progressValues.filter((percent) => percent === 0).length;
        const inProgress = progressValues.filter(
            (percent) => percent > 0 && percent < 100
        ).length;
        const completed = progressValues.filter((percent) => percent === 100).length;

        const pendingTodos = todos.filter((t) => !t.isDone).length;
        const completedTodos = todos.filter((t) => t.isDone).length;

        const avgProgress =
            goals.length > 0
                ? Math.round(
                    progressValues.reduce((sum, percent) => sum + percent, 0) / goals.length
                )
                : 0;

        return {
            totalGoals: goals.length,
            notStarted,
            inProgress,
            completed,
            totalTodos: todos.length,
            pendingTodos,
            completedTodos,
            avgProgress,
        };
    }, [goals, todos, goalProgressMap]);

    // Pie chart data
    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: "Not Started", value: stats.notStarted, color: CHART_COLORS.notStarted },
            { name: "In Progress", value: stats.inProgress, color: CHART_COLORS.inProgress },
            { name: "Completed", value: stats.completed, color: CHART_COLORS.completed },
        ].filter((d) => d.value > 0);
    }, [stats]);

    // Bar chart data (top 5 goals by progress)
    const barData = useMemo(() => {
        if (!goals) return [];
        return [...goals]
            .sort(
                (a, b) =>
                    (goalProgressMap[b.id]?.percent ?? 0) -
                    (goalProgressMap[a.id]?.percent ?? 0)
            )
            .slice(0, 5)
            .map((g) => ({
                name: g.title.length > 15 ? g.title.substring(0, 15) + "..." : g.title,
                progress: goalProgressMap[g.id]?.percent ?? 0,
            }));
    }, [goals, goalProgressMap]);

    const isLoading = goalsLoading || todosLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Overview of your goals and tasks
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Goals</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.totalGoals || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Todos</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.pendingTodos || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <CheckSquare className="w-6 h-6 text-secondary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Progress</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.avgProgress || 0}%
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-accent" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.completed || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Goals Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--color-card)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-6 mt-4">
                                    {pieData.map((entry) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {entry.name} ({entry.value})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No goals yet. Create your first goal!</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Goals by Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {barData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} layout="vertical">
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--color-card)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "8px",
                                            }}
                                            formatter={(value: number) => [`${value}%`, "Progress"]}
                                        />
                                        <Bar
                                            dataKey="progress"
                                            fill="url(#barGradient)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="50%" stopColor="#06b6d4" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No goals to display. Create some goals!</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
