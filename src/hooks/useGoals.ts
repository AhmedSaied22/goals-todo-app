import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getGoals,
    addGoal,
    updateGoalProgress,
    deleteGoal,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import type { Goal } from "@/types";
import { Timestamp } from "firebase/firestore";

export function useGoals() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["goals", user?.uid],
        queryFn: () => getGoals(user!.uid),
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useAddGoal() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title: string) => addGoal(user!.uid, title),
        onMutate: async (newTitle) => {
            await queryClient.cancelQueries({ queryKey: ["goals", user?.uid] });
            const previousGoals = queryClient.getQueryData<Goal[]>(["goals", user?.uid]);

            queryClient.setQueryData<Goal[]>(["goals", user?.uid], (old) => {
                const newGoal: Goal = {
                    id: Math.random().toString(), // Temporarily ID
                    title: newTitle,
                    currentPercent: 0,
                    createdAt: Timestamp.now(),
                };
                return old ? [newGoal, ...old] : [newGoal];
            });

            return { previousGoals };
        },
        onError: (_err, _newTitle, context) => {
            if (context?.previousGoals) {
                queryClient.setQueryData(["goals", user?.uid], context.previousGoals);
            }
            toast.error("Failed to create goal");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] });
        },
        onSuccess: () => {
            toast.success("Goal created successfully!");
        },
    });
}

export function useUpdateGoalProgress() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ goalId, newPercent }: { goalId: string; newPercent: number }) =>
            updateGoalProgress(user!.uid, goalId, newPercent),
        onMutate: async ({ goalId, newPercent }) => {
            await queryClient.cancelQueries({ queryKey: ["goals", user?.uid] });
            const previousGoals = queryClient.getQueryData<Goal[]>(["goals", user?.uid]);

            queryClient.setQueryData<Goal[]>(["goals", user?.uid], (old) =>
                old?.map((goal) =>
                    goal.id === goalId ? { ...goal, currentPercent: newPercent } : goal
                )
            );

            return { previousGoals };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousGoals) {
                queryClient.setQueryData(["goals", user?.uid], context.previousGoals);
            }
            toast.error("Failed to update progress");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] });
        },
    });
}

export function useDeleteGoal() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goalId: string) => deleteGoal(user!.uid, goalId),
        onMutate: async (goalId) => {
            await queryClient.cancelQueries({ queryKey: ["goals", user?.uid] });
            const previousGoals = queryClient.getQueryData<Goal[]>(["goals", user?.uid]);

            queryClient.setQueryData<Goal[]>(["goals", user?.uid], (old) =>
                old?.filter((goal) => goal.id !== goalId)
            );

            return { previousGoals };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousGoals) {
                queryClient.setQueryData(["goals", user?.uid], context.previousGoals);
            }
            toast.error("Failed to delete goal");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] });
        },
        onSuccess: () => {
            toast.success("Goal deleted");
        },
    });
}
