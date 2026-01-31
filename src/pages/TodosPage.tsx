import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday } from "date-fns";
import {
    Plus,
    Trash2,
    CheckSquare,
    Square,
    Link as LinkIcon,
    Filter,
} from "lucide-react";
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
    const [selectedGoalId, setSelectedGoalId] = useState<string>("");
    const [addMode, setAddMode] = useState<"quick" | "bulk">("quick");
    const [bulkText, setBulkText] = useState("");

    const { data: todos, isLoading: todosLoading } = useTodos();
    const { data: goals } = useGoals();
    const addTodo = useAddTodo();
    const addTodosBulk = useAddTodosBulk();
    const toggleTodo = useToggleTodo();
    const deleteTodo = useDeleteTodo();

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
            goalId: selectedGoalId === "no-goal" || !selectedGoalId ? undefined : selectedGoalId,
        });
        reset();
        setSelectedGoalId("");
    };

    const onBulkSubmit = () => {
        const titles = bulkText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        if (titles.length === 0) return;

        addTodosBulk.mutate({
            titles,
            goalId: selectedGoalId === "no-goal" || !selectedGoalId ? undefined : selectedGoalId,
        });
        setBulkText("");
        setSelectedGoalId("");
    };

    const filteredTodos = useMemo(() => {
        if (!todos) return [];

        return todos.filter((todo) => {
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
    }, [todos, filter]);

    const getGoalName = (goalId?: string) => {
        if (!goalId || !goals) return null;
        const goal = goals.find((g) => g.id === goalId);
        return goal?.title;
    };

    const goalProgressMap = useMemo(() => {
        if (!goals || !todos) return {};
        return buildGoalProgressMap(goals, todos);
    }, [goals, todos]);

    const TodoItem = ({ todo }: { todo: Todo }) => {
        const goalName = getGoalName(todo.goalId);
        const isDeleting = deleteTodo.isPending && deleteTodo.variables === todo.id;
        const isToggling =
            toggleTodo.isPending && toggleTodo.variables?.todoId === todo.id;

        return (
            <div
                className={cn(
                    "group flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md",
                    todo.isDone && "bg-muted/50"
                )}
            >
                <button
                    onClick={() =>
                        toggleTodo.mutate({
                            todoId: todo.id,
                            isDone: !todo.isDone,
                        })
                    }
                    disabled={isToggling}
                    className="mt-0.5 flex-shrink-0"
                >
                    {todo.isDone ? (
                        <CheckSquare className="w-5 h-5 text-success" />
                    ) : (
                        <Square className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "text-foreground transition-all",
                            todo.isDone && "line-through text-muted-foreground"
                        )}
                    >
                        {todo.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        {goalName && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                                <LinkIcon className="w-3 h-3" />
                                {goalName}
                            </span>
                        )}
                        {todo.createdAt && (
                            <span className="text-xs text-muted-foreground">
                                {format(todo.createdAt.toDate(), "MMM d, h:mm a")}
                            </span>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => deleteTodo.mutate(todo.id)}
                    disabled={isDeleting}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
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

    const pendingCount = todos?.filter((t) => !t.isDone).length || 0;
    const doneCount = todos?.filter((t) => t.isDone).length || 0;
    const todayCount = todos?.filter((t) => t.createdAt && isToday(t.createdAt.toDate())).length || 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Todos</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your daily tasks and link them to goals
                </p>
            </div>

            {/* Quick Add Form */}
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
                                    <Input
                                        placeholder="What needs to be done?"
                                        {...register("title")}
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={addTodo.isPending}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add
                                    </Button>
                                </div>
                                {errors.title && (
                                    <p className="text-sm text-destructive">
                                        {errors.title.message}
                                    </p>
                                )}
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
                                        {bulkText
                                            .split("\n")
                                            .filter((line) => line.trim()).length}{" "}
                                        items ready
                                    </span>
                                    <Button
                                        type="button"
                                        onClick={onBulkSubmit}
                                        disabled={addTodosBulk.isPending}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add all
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Link to a goal (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-goal">No goal</SelectItem>
                                    {goals?.map((goal) => (
                                        <SelectItem key={goal.id} value={goal.id}>
                                            {goal.title} (
                                            {goalProgressMap[goal.id]?.percent ?? 0}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedGoalId && (
                                <span className="text-xs text-muted-foreground">
                                    Progress updates from linked todos
                                </span>
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
