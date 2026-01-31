import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGoals, addGoal, deleteGoal } from "@/lib/firestore";
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

    // Performance-friendly defaults
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    // Data sanitization (prevents NaN issues in UI/charts)
    select: (goals) =>
      goals.map((goal) => ({
        ...goal,
        currentPercent: Number.isFinite(goal.currentPercent) ? goal.currentPercent : 0,
      })),
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
      const tempId = crypto.randomUUID();

      queryClient.setQueryData<Goal[]>(["goals", user?.uid], (old) => {
        const newGoal: Goal = {
          id: tempId,
          title: newTitle,
          currentPercent: 0,
          createdAt: Timestamp.now(),
        };
        return old ? [newGoal, ...old] : [newGoal];
      });

      return { previousGoals, tempId };
    },
    onError: (_err, _newTitle, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(["goals", user?.uid], context.previousGoals);
      }
      toast.error("Failed to create goal");
    },
    onSuccess: (goalId, _newTitle, context) => {
      if (context?.tempId) {
        queryClient.setQueryData<Goal[]>(["goals", user?.uid], (old) =>
          old?.map((goal) => (goal.id === context.tempId ? { ...goal, id: goalId } : goal))
        );
      }
      toast.success("Goal created successfully!");
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
    onSuccess: () => {
      toast.success("Goal deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.uid] });
    },
  });
}
