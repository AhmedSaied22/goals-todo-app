import { NavLink, useLocation } from "react-router-dom";
import { Drawer } from "vaul";
import {
    LayoutDashboard,
    Target,
    CheckSquare,
    CalendarDays,
    Menu,
    Moon,
    Sun,
    LogOut,
    Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";

const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/goals", icon: Target, label: "Goals" },
    { to: "/todos", icon: CheckSquare, label: "Todos" },
    { to: "/daily", icon: CalendarDays, label: "Daily Tracker" },
];

function NavContent({ onClose }: { onClose?: () => void }) {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <img
                        src="/milesto-logo.png"
                        alt="Milesto"
                        className="w-10 h-10 rounded-xl shadow-lg object-contain"
                    />
                    <div>
                        <h1 className="font-bold text-lg gradient-text">Milesto</h1>
                        <p className="text-xs text-muted-foreground">Track your progress</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User & Settings */}
            <div className="p-4 border-t border-border space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-9 w-9"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                    </Button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="relative group">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    className="w-10 h-10 rounded-full ring-2 ring-primary/20 object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-primary font-medium">
                                        {user.displayName?.[0] || user.email?.[0] || "U"}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {user.displayName || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setIsProfileOpen(true)}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                        <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
                    </div>
                )}

                {/* Logout */}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-card/50 backdrop-blur-xl">
                <NavContent />
            </aside>

            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Drawer.Root open={open} onOpenChange={setOpen}>
                    <Drawer.Trigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-card/80 backdrop-blur-xl shadow-lg"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </Drawer.Trigger>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <Drawer.Content className="fixed left-0 top-0 bottom-0 w-80 bg-card z-50 flex flex-col">
                            <NavContent onClose={() => setOpen(false)} />
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>
        </>
    );
}
