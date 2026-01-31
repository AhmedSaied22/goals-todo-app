import type { Goal, Todo } from "@/types";

export type GoalProgress = {
    total: number;
    done: number;
    percent: number;
};

export function buildGoalProgressMap(goals: Goal[], todos: Todo[]): Record<string, GoalProgress> {
    const progressMap: Record<string, GoalProgress> = {};

    goals.forEach((goal) => {
        progressMap[goal.id] = { total: 0, done: 0, percent: 0 };
    });

    todos.forEach((todo) => {
        if (!todo.goalId) return;
        const entry = progressMap[todo.goalId];
        if (!entry) return;
        entry.total += 1;
        if (todo.isDone) {
            entry.done += 1;
        }
    });

    Object.values(progressMap).forEach((entry) => {
        if (entry.total === 0) {
            entry.percent = 0;
        } else {
            entry.percent = Math.round((entry.done / entry.total) * 100);
        }
    });

    return progressMap;
}

