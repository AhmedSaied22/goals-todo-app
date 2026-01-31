import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, endOfMonth, startOfMonth } from "date-fns";
import {
    addDailyLog,
    addActivity,
    deleteDailyLog,
    getActivities,
    getDailyLogs,
    updateDailyLog,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import type { DailyLog } from "@/types";

export function useActivities() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["activities", user?.uid],
        queryFn: () => getActivities(user!.uid),
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useAddActivity() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => addActivity(user!.uid, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Activity added");
        },
        onError: () => {
            toast.error("Failed to add activity");
        },
    });
}

export function useDailyLogs({ month }: { month: Date }) {
    const { user } = useAuth();
    const monthKey = format(month, "yyyy-MM");
    const startDate = format(startOfMonth(month), "yyyy-MM-dd");
    const endDate = format(endOfMonth(month), "yyyy-MM-dd");

    return useQuery({
        queryKey: ["dailyLogs", user?.uid, monthKey],
        queryFn: () => getDailyLogs(user!.uid, startDate, endDate),
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        select: (logs) =>
            logs.map((log) => ({
                ...log,
                durationMinutes: Number.isFinite(log.durationMinutes)
                    ? log.durationMinutes
                    : 0,
            })),
    });
}

export function useAddDailyLog() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<DailyLog, "id" | "createdAt">) =>
            addDailyLog(user!.uid, payload),
        onMutate: async (payload) => {
            const monthKey = payload.date.slice(0, 7);
            await queryClient.cancelQueries({
                queryKey: ["dailyLogs", user?.uid, monthKey],
            });

            const previousLogs = queryClient.getQueryData<DailyLog[]>([
                "dailyLogs",
                user?.uid,
                monthKey,
            ]);
            const tempId = crypto.randomUUID();

            queryClient.setQueryData<DailyLog[]>(
                ["dailyLogs", user?.uid, monthKey],
                (old) => {
                    const newLog: DailyLog = {
                        id: tempId,
                        createdAt: Timestamp.now(),
                        ...payload,
                        durationMinutes: Number(payload.durationMinutes),
                    };
                    return old ? [...old, newLog] : [newLog];
                }
            );

            return { previousLogs, monthKey, tempId };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousLogs) {
                queryClient.setQueryData(
                    ["dailyLogs", user?.uid, context.monthKey],
                    context.previousLogs
                );
            }
            toast.error("Failed to add daily log");
        },
        onSuccess: (logId, _payload, context) => {
            if (!context?.tempId) return;
            queryClient.setQueryData<DailyLog[]>(
                ["dailyLogs", user?.uid, context.monthKey],
                (old) =>
                    old?.map((log) => (log.id === context.tempId ? { ...log, id: logId } : log))
            );
            toast.success("Daily log added");
        },
        onSettled: (_data, _err, payload, context) => {
            const monthKey = context?.monthKey ?? payload.date.slice(0, 7);
            queryClient.invalidateQueries({
                queryKey: ["dailyLogs", user?.uid, monthKey],
            });
        },
    });
}

export function useUpdateDailyLog() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            logId,
            updates,
        }: {
            logId: string;
            date: string;
            updates: Partial<Pick<DailyLog, "durationMinutes" | "notes" | "date">>;
        }) => updateDailyLog(user!.uid, logId, updates),
        onMutate: async ({ logId, updates, date }) => {
            const monthKey = date.slice(0, 7);
            await queryClient.cancelQueries({
                queryKey: ["dailyLogs", user?.uid, monthKey],
            });

            const previousLogs = queryClient.getQueryData<DailyLog[]>([
                "dailyLogs",
                user?.uid,
                monthKey,
            ]);

            queryClient.setQueryData<DailyLog[]>(
                ["dailyLogs", user?.uid, monthKey],
                (old) =>
                    old?.map((log) => (log.id === logId ? { ...log, ...updates } : log))
            );

            return { previousLogs, monthKey };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousLogs && context.monthKey) {
                queryClient.setQueryData(
                    ["dailyLogs", user?.uid, context.monthKey],
                    context.previousLogs
                );
            }
            toast.error("Failed to update daily log");
        },
        onSettled: (_data, _err, payload, context) => {
            const monthKey = context?.monthKey ?? payload.date.slice(0, 7);
            queryClient.invalidateQueries({
                queryKey: ["dailyLogs", user?.uid, monthKey],
            });
        },
    });
}

export function useDeleteDailyLog() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ logId }: { logId: string; date: string }) =>
            deleteDailyLog(user!.uid, logId),
        onMutate: async ({ logId, date }) => {
            const monthKey = date.slice(0, 7);
            await queryClient.cancelQueries({
                queryKey: ["dailyLogs", user?.uid, monthKey],
            });

            const previousLogs = queryClient.getQueryData<DailyLog[]>([
                "dailyLogs",
                user?.uid,
                monthKey,
            ]);

            queryClient.setQueryData<DailyLog[]>(
                ["dailyLogs", user?.uid, monthKey],
                (old) => old?.filter((log) => log.id !== logId)
            );

            return { previousLogs, monthKey };
        },
        onError: (_err, _payload, context) => {
            if (context?.previousLogs) {
                queryClient.setQueryData(
                    ["dailyLogs", user?.uid, context.monthKey],
                    context.previousLogs
                );
            }
            toast.error("Failed to delete daily log");
        },
        onSuccess: () => {
            toast.success("Daily log deleted");
        },
        onSettled: (_data, _err, _payload, context) => {
            if (!context?.monthKey) return;
            queryClient.invalidateQueries({
                queryKey: ["dailyLogs", user?.uid, context.monthKey],
            });
        },
    });
}
