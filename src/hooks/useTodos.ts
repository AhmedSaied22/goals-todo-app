import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getTodos,
    addTodo,
    addTodosBulk,
    toggleTodo,
    deleteTodo,
} from "@/lib/firestore";
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
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        select: (todos) =>
            todos.map((todo) => ({
                ...todo,
                isDone: Boolean(todo.isDone),
            })),
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
            const tempId = crypto.randomUUID();

            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) => {
                const newTodo: Todo = {
                    id: tempId, // Temp ID
                    title,
                    isDone: false,
                    goalId,
                    createdAt: Timestamp.now(),
                };
                return old ? [newTodo, ...old] : [newTodo];
            });

            return { previousTodos, tempId };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos", user?.uid], context.previousTodos);
            }
            toast.error("Failed to add todo");
        },
        onSuccess: (todoId, _variables, context) => {
            if (!context?.tempId) return;
            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) =>
                old?.map((todo) => (todo.id === context.tempId ? { ...todo, id: todoId } : todo))
            );
            toast.success("Todo added!");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
        },
    });
}

export function useAddTodosBulk() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ titles, goalId }: { titles: string[]; goalId?: string }) =>
            addTodosBulk(user!.uid, titles, goalId),
        onMutate: async ({ titles, goalId }) => {
            await queryClient.cancelQueries({ queryKey: ["todos", user?.uid] });
            const previousTodos = queryClient.getQueryData<Todo[]>(["todos", user?.uid]);
            const now = Timestamp.now();
            const tempIds = titles.map(() => crypto.randomUUID());

            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) => {
                const newTodos = titles.map((title, index) => ({
                    id: tempIds[index],
                    title,
                    isDone: false,
                    goalId,
                    createdAt: now,
                }));
                return old ? [...newTodos, ...old] : newTodos;
            });

            return { previousTodos, tempIds };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos", user?.uid], context.previousTodos);
            }
            toast.error("Failed to add todos");
        },
        onSuccess: (todoIds, _variables, context) => {
            if (!context?.tempIds) return;
            queryClient.setQueryData<Todo[]>(["todos", user?.uid], (old) => {
                if (!old) return old;
                return old.map((todo) => {
                    const tempIndex = context.tempIds.indexOf(todo.id);
                    if (tempIndex === -1) return todo;
                    return { ...todo, id: todoIds[tempIndex] };
                });
            });
            toast.success("Todos added!");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos", user?.uid] });
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
        }: {
            todoId: string;
            isDone: boolean;
        }) => {
            await toggleTodo(user!.uid, todoId, isDone);
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
