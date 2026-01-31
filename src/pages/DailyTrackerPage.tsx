import { useEffect, useMemo, useState } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    format,
    parseISO,
    startOfMonth,
    subDays,
} from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import {
    Button,
    Card,
    CardContent,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Skeleton,
} from "@/components/ui";
import {
    useActivities,
    useAddDailyLog,
    useDailyLogs,
    useDeleteDailyLog,
    useUpdateDailyLog,
} from "@/hooks/useDailyTracker";
import { cn } from "@/lib/utils";
import type { DailyLog } from "@/types";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyTrackerPage() {
    const [selectedActivityId, setSelectedActivityId] = useState("");
    const [reportActivityId, setReportActivityId] = useState("all");
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [durationMinutes, setDurationMinutes] = useState("");
    const [notes, setNotes] = useState("");
    const [month, setMonth] = useState(new Date());

    const { data: activities, isLoading: activitiesLoading } = useActivities();
    const { data: dailyLogs, isLoading: logsLoading } = useDailyLogs({ month });
    const addDailyLog = useAddDailyLog();
    const deleteDailyLog = useDeleteDailyLog();
    const updateDailyLog = useUpdateDailyLog();

    useEffect(() => {
        if (!selectedActivityId && activities && activities.length > 0) {
            setSelectedActivityId(activities[0].id);
        }
    }, [activities, selectedActivityId]);

    useEffect(() => {
        if (reportActivityId !== "all" && activities && activities.length > 0) {
            const exists = activities.some((activity) => activity.id === reportActivityId);
            if (!exists) {
                setReportActivityId("all");
            }
        }
    }, [activities, reportActivityId]);

    const activityMap = useMemo(() => {
        if (!activities) return {};
        return activities.reduce<Record<string, string>>((acc, activity) => {
            acc[activity.id] = activity.name;
            return acc;
        }, {});
    }, [activities]);

    const todayKey = format(new Date(), "yyyy-MM-dd");

    const todayLogs = useMemo(() => {
        if (!dailyLogs) return [];
        return dailyLogs.filter((log) => log.date === todayKey);
    }, [dailyLogs, todayKey]);

    const reportLogs = useMemo(() => {
        if (!dailyLogs) return [];
        if (reportActivityId === "all") return dailyLogs;
        return dailyLogs.filter((log) => log.activityId === reportActivityId);
    }, [dailyLogs, reportActivityId]);

    const monthDays = useMemo(
        () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
        [month]
    );

    const monthlyChartData = useMemo(() => {
        return monthDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const totalMinutes = reportLogs
                .filter((log) => log.date === dayKey)
                .reduce((sum, log) => sum + log.durationMinutes, 0);
            return {
                date: format(day, "d"),
                totalMinutes,
            };
        });
    }, [monthDays, reportLogs]);

    const totalMinutes = useMemo(
        () => reportLogs.reduce((sum, log) => sum + log.durationMinutes, 0),
        [reportLogs]
    );

    const averagePerDay = monthDays.length
        ? Math.round(totalMinutes / monthDays.length)
        : 0;

    const weekdayTotals = useMemo(() => {
        return reportLogs.reduce<number[]>((acc, log) => {
            const weekday = parseISO(log.date).getDay();
            acc[weekday] += log.durationMinutes;
            return acc;
        }, Array.from({ length: 7 }).fill(0));
    }, [reportLogs]);

    const bestWeekdayIndex = weekdayTotals.reduce(
        (bestIndex, value, index, arr) => (value > arr[bestIndex] ? index : bestIndex),
        0
    );

    const streakCount = useMemo(() => {
        if (reportLogs.length === 0) return 0;
        const loggedDates = new Set(reportLogs.map((log) => log.date));
        let streak = 0;
        let cursor = parseISO(todayKey);
        while (loggedDates.has(format(cursor, "yyyy-MM-dd"))) {
            streak += 1;
            cursor = subDays(cursor, 1);
        }
        return streak;
    }, [reportLogs, todayKey]);

    const handleAddLog = () => {
        if (!selectedActivityId || !durationMinutes) return;
        const activityName = activityMap[selectedActivityId];
        if (!activityName) return;
        const minutes = Number(durationMinutes);
        if (!Number.isFinite(minutes) || minutes <= 0) return;

        addDailyLog.mutate({
            activityId: selectedActivityId,
            activityName,
            date: selectedDate,
            durationMinutes: minutes,
            notes: notes.trim() || undefined,
        });
        setDurationMinutes("");
        setNotes("");
        setSelectedDate(todayKey);
    };

    const isLoading = activitiesLoading || logsLoading;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Daily Tracker</h1>
                <p className="text-muted-foreground mt-1">
                    Log recurring activities and review monthly insights
                </p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        Add daily log
                    </div>
                    <div className="grid gap-4 md:grid-cols-[1fr_180px_160px]">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Activity
                            </label>
                            <Select
                                value={selectedActivityId}
                                onValueChange={setSelectedActivityId}
                                disabled={!activities || activities.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            activities?.length ? "Select activity" : "No activities"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {activities?.map((activity) => (
                                        <SelectItem key={activity.id} value={activity.id}>
                                            {activity.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Date</label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(event) => setSelectedDate(event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Duration (minutes)
                            </label>
                            <Input
                                type="number"
                                min={1}
                                value={durationMinutes}
                                onChange={(event) => setDurationMinutes(event.target.value)}
                                placeholder="60"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Notes</label>
                        <Input
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Optional notes"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddLog}
                            disabled={addDailyLog.isPending || !selectedActivityId}
                        >
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Today</h2>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(), "MMMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((item) => (
                                <Skeleton key={item} className="h-16" />
                            ))}
                        </div>
                    ) : todayLogs.length ? (
                        <div className="space-y-3">
                            {todayLogs.map((log) => (
                                <TodayLogRow
                                    key={log.id}
                                    log={log}
                                    onDelete={() =>
                                        deleteDailyLog.mutate({ logId: log.id, date: log.date })
                                    }
                                    onUpdate={(updates) =>
                                        updateDailyLog.mutate({
                                            logId: log.id,
                                            date: log.date,
                                            updates,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No logs for today yet.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Monthly report
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {format(month, "MMMM yyyy")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setMonth((prev) => addMonths(prev, -1))}
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setMonth((prev) => addMonths(prev, 1))}
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Select value={reportActivityId} onValueChange={setReportActivityId}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All activities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All activities</SelectItem>
                                    {activities?.map((activity) => (
                                        <SelectItem key={activity.id} value={activity.id}>
                                            {activity.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="border border-border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total minutes</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {totalMinutes}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Average per day</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {averagePerDay}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Current streak</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {streakCount} days
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="rounded-xl border border-border p-4">
                            <p className="text-sm font-medium text-muted-foreground mb-3">
                                Minutes per day
                            </p>
                            {isLoading ? (
                                <Skeleton className="h-48" />
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyChartData}>
                                            <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                width={32}
                                            />
                                            <Tooltip
                                                cursor={{ fill: "hsl(var(--muted))" }}
                                                contentStyle={{
                                                    borderRadius: "0.75rem",
                                                    borderColor: "hsl(var(--border))",
                                                }}
                                            />
                                            <Bar
                                                dataKey="totalMinutes"
                                                fill="hsl(var(--primary))"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="rounded-xl border border-border p-4 space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Best weekday</p>
                                <p className="text-xl font-semibold text-foreground">
                                    {weekdayLabels[bestWeekdayIndex]}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {weekdayTotals.map((value, index) => (
                                    <div key={weekdayLabels[index]} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{weekdayLabels[index]}</span>
                                            <span>{value} min</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className={cn(
                                                    "h-2 rounded-full bg-primary transition-all"
                                                )}
                                                style={{
                                                    width: totalMinutes
                                                        ? `${(value / totalMinutes) * 100}%`
                                                        : "0%",
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function TodayLogRow({
    log,
    onDelete,
    onUpdate,
}: {
    log: DailyLog;
    onDelete: () => void;
    onUpdate: (updates: Partial<Pick<DailyLog, "durationMinutes" | "notes">>) => void;
}) {
    const [duration, setDuration] = useState(String(log.durationMinutes));
    const [noteValue, setNoteValue] = useState(log.notes ?? "");

    useEffect(() => {
        setDuration(String(log.durationMinutes));
        setNoteValue(log.notes ?? "");
    }, [log.durationMinutes, log.notes]);

    const handleBlur = () => {
        const minutes = Number(duration);
        const updates: Partial<Pick<DailyLog, "durationMinutes" | "notes">> = {};
        if (Number.isFinite(minutes) && minutes > 0 && minutes !== log.durationMinutes) {
            updates.durationMinutes = minutes;
        }
        if (noteValue.trim() !== (log.notes ?? "")) {
            updates.notes = noteValue.trim() || undefined;
        }
        if (Object.keys(updates).length) {
            onUpdate(updates);
        }
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">{log.activityName}</p>
                <div className="flex flex-wrap gap-3">
                    <Input
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        onBlur={handleBlur}
                        className="w-32"
                    />
                    <Input
                        value={noteValue}
                        onChange={(event) => setNoteValue(event.target.value)}
                        onBlur={handleBlur}
                        placeholder="Notes"
                        className="flex-1 min-w-[180px]"
                    />
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                aria-label="Delete log"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
