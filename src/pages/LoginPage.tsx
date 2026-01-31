import { Navigate } from "react-router-dom";
import { Target, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";

export function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
                <div className="relative z-10 flex flex-col justify-center p-16 text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                            <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">GoalMaster</h1>
                            <p className="text-white/80">Track. Achieve. Succeed.</p>
                        </div>
                    </div>
                    <h2 className="text-5xl font-bold leading-tight mb-6">
                        Turn your goals into
                        <span className="block text-white/90">achievements.</span>
                    </h2>
                    <p className="text-xl text-white/80 max-w-md">
                        A simple, focused productivity app to track your goals and manage your daily tasks with beautiful charts and insights.
                    </p>
                    <div className="flex items-center gap-4 mt-12">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-white/30 backdrop-blur border-2 border-white/50"
                                />
                            ))}
                        </div>
                        <p className="text-sm text-white/80">
                            <span className="font-semibold">1,000+</span> users tracking their goals
                        </p>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-20 right-20 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
            </div>

            {/* Right Panel - Login */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold gradient-text">GoalMaster</h1>
                    </div>

                    <div className="space-y-6">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-foreground mb-2">
                                Welcome back
                            </h2>
                            <p className="text-muted-foreground">
                                Sign in to continue tracking your goals
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
                            <Button
                                onClick={signInWithGoogle}
                                className="w-full h-12 text-base"
                                size="lg"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>

                            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>Free forever. No credit card required.</span>
                            </div>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            By signing in, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
