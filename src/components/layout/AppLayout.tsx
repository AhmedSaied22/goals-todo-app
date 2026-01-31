import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto max-w-6xl p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
