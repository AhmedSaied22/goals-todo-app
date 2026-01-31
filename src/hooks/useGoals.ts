import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getGoals,
    addGoal,
    updateGoalProgress,
    deleteGoal,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useGoals() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["goals", user?.uid],
        queryFn: () => getGoals(user!.uid),
        enabled: !!user,
    });
}

export function useAddGoal() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title: string) => addGoal(user!.uid, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success("Goal created successfully!");
        },
        onError: () => {
            toast.error("Failed to create goal");
        },
    });
}

export function useUpdateGoalProgress() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ goalId, newPercent }: { goalId: string; newPercent: number }) =>
            updateGoalProgress(user!.uid, goalId, newPercent),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
        },
        onError: () => {
            toast.error("Failed to update progress");
        },
    });
}

export function useDeleteGoal() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (goalId: string) => deleteGoal(user!.uid, goalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success("Goal deleted");
        },
        onError: () => {
            toast.error("Failed to delete goal");
        },
    });
}
