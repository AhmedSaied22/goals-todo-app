import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Button,
    Label,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Check, Moon, Sun, Palette, User, Settings2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

const AVATARS = [
    "https://i.pinimg.com/736x/00/45/46/004546aba62dc6ab5858febfe17b48ad.jpg", // Default
    "https://i.pinimg.com/736x/ee/90/58/ee9058c8023f006fbbe391cf8f758e31.jpg",
    "https://i.pinimg.com/736x/14/38/5b/14385bcdbc9ba3db1d21b624f34c6176.jpg",
    "https://i.pinimg.com/736x/75/f0/f6/75f0f6b7dd94dbd496b5a49f7c534862.jpg",
    "https://i.pinimg.com/1200x/5a/b5/16/5ab51643e8223ad18e6bb3b889e7fd71.jpg",
    "https://i.pinimg.com/1200x/c2/f7/60/c2f760b036a39bbea34916a44c05e990.jpg",
    "https://i.pinimg.com/736x/27/d4/72/27d47218515444777658b7e48da5ba1d.jpg",
];

const THEME_COLORS = [
    {
        name: "Original (Purple)",
        primary: "oklch(0.65 0.22 270)",
        secondary: "oklch(0.55 0.18 200)",
        class: "bg-purple-500",
    },
    {
        name: "Ocean (Blue)",
        primary: "oklch(0.6 0.18 240)",
        secondary: "oklch(0.7 0.15 200)",
        class: "bg-blue-500",
    },
    {
        name: "Nature (Green)",
        primary: "oklch(0.6 0.18 145)",
        secondary: "oklch(0.7 0.15 120)",
        class: "bg-green-500",
    },
    {
        name: "Sunset (Orange)",
        primary: "oklch(0.65 0.22 30)",
        secondary: "oklch(0.7 0.18 50)",
        class: "bg-orange-500",
    },
];

export function ProfileSettings({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || AVATARS[0]);
    const [saving, setSaving] = useState(false);
    const [activeColorTheme, setActiveColorTheme] = useState(THEME_COLORS[0].name);

    useEffect(() => {
        if (user?.photoURL) {
            setSelectedAvatar(user.photoURL);
        }
    }, [user]);

    const handleSaveAvatar = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        try {
            await updateProfile(auth.currentUser, {
                photoURL: selectedAvatar,
            });
            await auth.currentUser.reload();
            toast.success("Profile updated successfully! Refresh to see changes.");
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleColorChange = (colorTheme: typeof THEME_COLORS[0]) => {
        setActiveColorTheme(colorTheme.name);
        document.documentElement.style.setProperty("--color-primary", colorTheme.primary);
        document.documentElement.style.setProperty("--color-secondary", colorTheme.secondary);
        // Persist logic could be added here (localStorage or Firebase)
        localStorage.setItem("app-color-theme", JSON.stringify(colorTheme));
    };

    // Load persisted color theme on mount
    useEffect(() => {
        const saved = localStorage.getItem("app-color-theme");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.name) {
                    setActiveColorTheme(parsed.name);
                    document.documentElement.style.setProperty("--color-primary", parsed.primary);
                    document.documentElement.style.setProperty("--color-secondary", parsed.secondary);
                }
            } catch (e) {
                // ignore
            }
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        Customize Profile
                    </DialogTitle>
                    <DialogDescription>
                        Personalize your experience and appearance
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="avatar" className="w-full">
                    <div className="px-6 pt-4 border-b border-border">
                        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger
                                value="avatar"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                            >
                                <User className="w-4 h-4 mr-2" />
                                Avatar
                            </TabsTrigger>
                            <TabsTrigger
                                value="appearance"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                            >
                                <Palette className="w-4 h-4 mr-2" />
                                Appearance
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6">
                        <TabsContent value="avatar" className="mt-0 space-y-6">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <img
                                        src={selectedAvatar}
                                        alt="Selected"
                                        className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20 shadow-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Choose Avatar</Label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                    {AVATARS.map((url) => (
                                        <button
                                            key={url}
                                            onClick={() => setSelectedAvatar(url)}
                                            className={cn(
                                                "relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                selectedAvatar === url
                                                    ? "ring-2 ring-primary ring-offset-2"
                                                    : "opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <img
                                                src={url}
                                                alt="Avatar option"
                                                className="w-full h-full object-cover"
                                            />
                                            {selectedAvatar === url && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSaveAvatar} disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="appearance" className="mt-0 space-y-6">
                            {/* Theme Toggle */}
                            <div className="space-y-3">
                                <Label>Theme Mode</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                            theme === "light"
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="p-2 rounded-full bg-white shadow-sm text-yellow-500">
                                            <Sun className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Light</div>
                                            <div className="text-xs text-muted-foreground">Clean & Bright</div>
                                        </div>
                                        {theme === "light" && <Check className="w-4 h-4 ml-auto text-primary" />}
                                    </button>

                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                            theme === "dark"
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="p-2 rounded-full bg-slate-950 shadow-sm text-slate-100">
                                            <Moon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Dark</div>
                                            <div className="text-xs text-muted-foreground">Sleek & Modern</div>
                                        </div>
                                        {theme === "dark" && <Check className="w-4 h-4 ml-auto text-primary" />}
                                    </button>
                                </div>
                            </div>

                            {/* Chart Colors */}
                            <div className="space-y-3">
                                <Label>Chart & Accent Colors</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {THEME_COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => handleColorChange(color)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg border transition-all",
                                                activeColorTheme === color.name
                                                    ? "border-primary bg-primary/5"
                                                    : "border-transparent hover:bg-muted"
                                            )}
                                        >
                                            <div className={cn("w-8 h-8 rounded-full shadow-sm", color.class)} />
                                            <span className="text-sm font-medium">{color.name}</span>
                                            {activeColorTheme === color.name && (
                                                <Check className="w-4 h-4 ml-auto text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
