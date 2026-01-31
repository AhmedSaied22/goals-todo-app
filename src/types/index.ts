import type { Timestamp } from "firebase/firestore";

export interface Goal {
    id: string;
    title: string;
    currentPercent: number;
    createdAt: Timestamp;
}

export interface Todo {
    id: string;
    title: string;
    isDone: boolean;
    goalId?: string;
    createdAt: Timestamp;
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
