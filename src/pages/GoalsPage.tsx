import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Target, Sparkles } from "lucide-react";
import {
    useGoals,
    useAddGoal,
    useDeleteGoal,
} from "@/hooks/useGoals";
import { useTodos } from "@/hooks/useTodos";
import {
    Button,
    Card,
    CardContent,
    Input,
    Progress,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
    Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { buildGoalProgressMap } from "@/lib/goalProgress";

const goalSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

type GoalForm = z.infer<typeof goalSchema>;

export function GoalsPage() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: goals, isLoading } = useGoals();
    const { data: todos } = useTodos();
    const addGoal = useAddGoal();
    const deleteGoal = useDeleteGoal();

    const progressMap = useMemo(() => {
        if (!goals || !todos) return {};
        return buildGoalProgressMap(goals, todos);
    }, [goals, todos]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<GoalForm>({
        resolver: zodResolver(goalSchema),
    });

    const onSubmit = (data: GoalForm) => {
        addGoal.mutate(data.title);
        reset();
        setIsOpen(false);
    };

    const getProgressColor = (percent: number) => {
        if (percent === 0) return "text-muted-foreground";
        if (percent === 100) return "text-success";
        return "text-primary";
    };

    const getStatusBadge = (percent: number) => {
        if (percent === 0)
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                    Not Started
                </span>
            );
        if (percent === 100)
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                    Completed
                </span>
            );
        return (
            <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                In Progress
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-10 w-48 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Goals</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your progress towards your objectives
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Goal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Enter your goal title..."
                                    {...register("title")}
                                    autoFocus
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive mt-1">
                                        {errors.title.message}
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting || addGoal.isPending}>
                                    {addGoal.isPending ? "Creating..." : "Create Goal"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Goals Grid */}
            {goals && goals.length > 0 ? (
                <div className="grid gap-4">
                    {goals.map((goal) => {
                        const progress = progressMap[goal.id] ?? {
                            total: 0,
                            done: 0,
                            percent: 0,
                        };
                        return (
                        <Card
                            key={goal.id}
                            className={cn(
                                "transition-all duration-300",
                                progress.percent === 100 &&
                                "ring-2 ring-success/50 bg-success/5"
                            )}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                progress.percent === 100
                                                    ? "bg-success/10"
                                                    : "bg-primary/10"
                                            )}
                                        >
                                            {progress.percent === 100 ? (
                                                <Sparkles className="w-5 h-5 text-success" />
                                            ) : (
                                                <Target className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {goal.title}
                                            </h3>
                                            {getStatusBadge(progress.percent)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteGoal.mutate(goal.id)}
                                        disabled={deleteGoal.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Progress
                                        </span>
                                        <span
                                            className={cn(
                                                "text-lg font-bold",
                                                getProgressColor(progress.percent)
                                            )}
                                        >
                                            {progress.percent}%
                                        </span>
                                    </div>
                                    <Progress value={progress.percent} />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                        <span>
                                            {progress.done}/{progress.total} todos completed
                                        </span>
                                        <span>Progress updates from linked todos</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-12">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No goals yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first goal and start tracking your progress!
                        </p>
                        <Button onClick={() => setIsOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Goal
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
