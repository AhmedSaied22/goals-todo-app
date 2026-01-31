import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday } from "date-fns";
import { Plus, Trash2, CheckSquare, Link as LinkIcon, Filter, X } from "lucide-react";

import {
  useTodos,
  useAddTodo,
  useAddTodosBulk,
  useToggleTodo,
  useDeleteTodo,
} from "@/hooks/useTodos";
import { useGoals } from "@/hooks/useGoals";

import {
  Button,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";

import { cn } from "@/lib/utils";
import type { Todo } from "@/types";
import { buildGoalProgressMap } from "@/lib/goalProgress";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
});

type TodoForm = z.infer<typeof todoSchema>;
type FilterType = "all" | "today" | "done" | "pending";

export function TodosPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [newTodoGoalId, setNewTodoGoalId] = useState<string>("");
  const [addMode, setAddMode] = useState<"quick" | "bulk">("quick");
  const [bulkText, setBulkText] = useState("");

  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set());

  const { data: todos, isLoading: todosLoading } = useTodos();
  const { data: goals } = useGoals();
  const query = useQueryClient();

  // Reset recently completed when filter changes
  useEffect(() => {
    setRecentlyCompletedIds(new Set());
  }, [filter]);

  const addTodo = useAddTodo();
  const addTodosBulk = useAddTodosBulk();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  const handleToggleTodo = (todo: Todo) => {
    // If we are in "Pending" view and marking as done, add to generic keep-alive list
    if (filter === "pending" && !todo.isDone) {
      setRecentlyCompletedIds((prev) => new Set(prev).add(todo.id));
    }
    toggleTodo.mutate({ todoId: todo.id, isDone: !todo.isDone });
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoForm>({
    resolver: zodResolver(todoSchema),
  });

  const onSubmit = (data: TodoForm) => {
    addTodo.mutate({
      title: data.title,
      goalId: newTodoGoalId === "no-goal" || !newTodoGoalId ? undefined : newTodoGoalId,
    });
    reset();
    setNewTodoGoalId("");
  };

  const onBulkSubmit = () => {
    const titles = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (titles.length === 0) return;

    addTodosBulk.mutate({
      titles,
      goalId: newTodoGoalId === "no-goal" || !newTodoGoalId ? undefined : newTodoGoalId,
    });

    setBulkText("");
    setNewTodoGoalId("");
  };

  // Filter todos by Goal + status (All/Today/Done/Pending)
  const filteredTodos = useMemo(() => {
    if (!todos) return [];

    return todos.filter((todo) => {
      if (selectedGoalId !== "all" && todo.goalId !== selectedGoalId) return false;

      // Ensure recently completed items stay visible in "Pending" tab
      if (filter === "pending" && recentlyCompletedIds.has(todo.id)) {
        return true;
      }

      switch (filter) {
        case "today":
          return todo.createdAt && isToday(todo.createdAt.toDate());
        case "done":
          return todo.isDone;
        case "pending":
          return !todo.isDone;
        default:
          return true;
      }
    });
  }, [todos, filter, selectedGoalId, recentlyCompletedIds]);

  // ✅ Fix merge conflict: these counts are used in the Tabs UI
  const { pendingCount, doneCount, todayCount } = useMemo(() => {
    if (!todos) return { pendingCount: 0, doneCount: 0, todayCount: 0 };

    return {
      pendingCount: todos.filter((t) => !t.isDone).length,
      doneCount: todos.filter((t) => t.isDone).length,
      todayCount: todos.filter((t) => t.createdAt && isToday(t.createdAt.toDate())).length,
    };
  }, [todos]);

  const goalTitleMap = useMemo(() => {
    if (!goals) return {};
    return goals.reduce<Record<string, string>>((acc, goal) => {
      acc[goal.id] = goal.title;
      return acc;
    }, {});
  }, [goals]);

  const goalProgressMap = useMemo(() => {
    if (!goals || !todos) return {};
    return buildGoalProgressMap(goals, todos);
  }, [goals, todos]);

  // ✅ Todo item WITHOUT the checkbox square at the start
  const TodoItem = ({ todo }: { todo: Todo }) => {
    const goalName = todo.goalId ? goalTitleMap[todo.goalId] : undefined;

    const isDeleting = deleteTodo.isPending && deleteTodo.variables === todo.id;
    const isToggling = toggleTodo.isPending && toggleTodo.variables?.todoId === todo.id;

    return (
      <div
        className={cn(
          "group flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md",
          todo.isDone && "bg-muted/50"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-foreground transition-all",
                  todo.isDone && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Status badge بدل المربع */}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                    todo.isDone
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-border bg-muted text-foreground"
                  )}
                >
                  {todo.isDone ? "Done" : "Pending"}
                </span>

                {/* Goal badge */}
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
                  {goalName ?? "No goal"}
                </span>

                {/* Date */}
                {todo.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    {format(todo.createdAt.toDate(), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => !isToggling && handleToggleTodo(todo)}
                className={cn(isToggling && "opacity-50 cursor-not-allowed")}
              >
                {todo.isDone ? "Undo" : "Mark done"}
              </Button>

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-destructive hover:text-destructive hover:bg-destructive/10 transition-all",
                  isDeleting && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDeleting && deleteTodo.mutate(todo.id)}
                aria-label="Delete todo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (todosLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-14" />
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Todos</h1>
        <p className="text-muted-foreground mt-1">Manage your daily tasks and link them to goals</p>
      </div>

      {/* Add Form */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={addMode === "quick" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("quick")}
              >
                Quick add
              </Button>
              <Button
                type="button"
                variant={addMode === "bulk" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("bulk")}
              >
                Bulk add
              </Button>
            </div>

            {addMode === "quick" ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex gap-3">
                  <Input placeholder="What needs to be done?" {...register("title")} className="flex-1" />
                  <Button type="submit" disabled={addTodo.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </form>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Add one todo per line..."
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {bulkText.split("\n").filter((line) => line.trim()).length} items ready
                  </span>
                  <Button type="button" onClick={onBulkSubmit} disabled={addTodosBulk.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add all
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">

              <LinkIcon className="w-4 h-4 text-muted-foreground" />

              <Select value={newTodoGoalId} onValueChange={setNewTodoGoalId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Link to a goal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-goal">No goal</SelectItem>
                  {goals?.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title} ({goalProgressMap[goal.id]?.percent ?? 0}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {newTodoGoalId && (
                <span className="text-xs text-muted-foreground">Progress updates from linked todos</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="gap-2">
            <Filter className="w-4 h-4" />
            All ({todos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            Today ({todayCount})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-2">
            Done ({doneCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {/* Goal filter */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-sm font-medium text-foreground">Goals</span>
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All goals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All goals</SelectItem>
                {goals?.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedGoalId("all")}
              disabled={selectedGoalId === "all"}
              aria-label="Clear goal filter"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          {filteredTodos.length > 0 ? (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {filter === "all"
                    ? "No todos yet"
                    : filter === "today"
                      ? "No todos for today"
                      : filter === "done"
                        ? "No completed todos"
                        : "No pending todos"}
                </h3>

                <p className="text-muted-foreground">
                  {filter === "all" || filter === "pending"
                    ? "Add a new todo to get started!"
                    : filter === "done"
                      ? "Complete some todos to see them here."
                      : "Create todos today to see them here."}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
