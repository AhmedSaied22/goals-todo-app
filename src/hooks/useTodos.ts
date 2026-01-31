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

import type { Todo } from "@/types";
import { Timestamp } from "firebase/firestore";

export function useTodos() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["todos", user?.uid],
        queryFn: () => getTodos(user!.uid),
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useAddTodo() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title, goalId }: { title: string; goalId?: string }) =>
            addTodo(user!.uid, title, goalId),
        onMutate: async ({ title, goalId }) => {
            await queryClient.cancelQueries({ queryKey: ["todos", user?.uid] });
            const previousTodos = queryClient.getQueryData<Todo[]>(["todos", user?.uid]);

            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) => {
                const newTodo: Todo = {
                    id: Math.random().toString(), // Temp ID
                    title,
                    isDone: false,
                    goalId,
                    createdAt: Timestamp.now(),
                };
                return old ? [newTodo, ...old] : [newTodo];
            });

            return { previousTodos };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos", user?.uid], context.previousTodos);
            }
            toast.error("Failed to add todo");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
        },
        onSuccess: () => {
            toast.success("Todo added!");
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
        onMutate: async ({ todoId, isDone }) => {
            await queryClient.cancelQueries({ queryKey: ["todos", user?.uid] });
            const previousTodos = queryClient.getQueryData<Todo[]>(["todos", user?.uid]);

            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) =>
                old?.map((todo) =>
                    todo.id === todoId ? { ...todo, isDone } : todo
                )
            );

            return { previousTodos };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos", user?.uid], context.previousTodos);
            }
            toast.error("Failed to update todo");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
            queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] });
        },
    });
}

export function useDeleteTodo() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (todoId: string) => deleteTodo(user!.uid, todoId),
        onMutate: async (todoId) => {
            await queryClient.cancelQueries({ queryKey: ["todos", user?.uid] });
            const previousTodos = queryClient.getQueryData<Todo[]>(["todos", user?.uid]);

            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) =>
                old?.filter((todo) => todo.id !== todoId)
            );

            return { previousTodos };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos", user?.uid], context.previousTodos);
            }
            toast.error("Failed to delete todo");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
        },
        onSuccess: () => {
            toast.success("Todo deleted");
        },
    });
}
