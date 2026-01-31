import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
} from "@/lib/firestore";
import { updateGoalProgress, getGoals } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useTodos() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["todos", user?.uid],
        queryFn: () => getTodos(user!.uid),
        enabled: !!user,
    });
}

export function useAddTodo() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title, goalId }: { title: string; goalId?: string }) =>
            addTodo(user!.uid, title, goalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            toast.success("Todo added!");
        },
        onError: () => {
            toast.error("Failed to add todo");
        },
    });
}

export function useToggleTodo() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            todoId,
            isDone,
            goalId,
        }: {
            todoId: string;
            isDone: boolean;
            goalId?: string;
        }) => {
            await toggleTodo(user!.uid, todoId, isDone);

            // If linked to a goal, update the goal progress
            if (goalId) {
                const goals = await getGoals(user!.uid);
                const goal = goals.find((g) => g.id === goalId);
                if (goal) {
                    const delta = isDone ? 5 : -5;
                    await updateGoalProgress(user!.uid, goalId, goal.currentPercent + delta);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            queryClient.invalidateQueries({ queryKey: ["goals"] });
        },
        onError: () => {
            toast.error("Failed to update todo");
        },
    });
}

export function useDeleteTodo() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (todoId: string) => deleteTodo(user!.uid, todoId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
            toast.success("Todo deleted");
        },
        onError: () => {
            toast.error("Failed to delete todo");
        },
    });
}
