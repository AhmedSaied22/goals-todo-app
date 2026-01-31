import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage, DashboardPage, GoalsPage, TodosPage, DailyTrackerPage } from "@/pages";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        path: "/dashboard",
                        element: <DashboardPage />,
                    },
                    {
                        path: "/goals",
                        element: <GoalsPage />,
                    },
                    {
                        path: "/todos",
                        element: <TodosPage />,
                    },
                    {
                        path: "/daily",
                        element: <DailyTrackerPage />,
                    },
                    {
                        path: "/",
                        element: <Navigate to="/dashboard" replace />,
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/login" replace />,
    },
]);
