import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    writeBatch,
    type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Activity, DailyLog, Goal, Todo } from "@/types";

// Goals CRUD
export async function getGoals(uid: string): Promise<Goal[]> {
    const goalsRef = collection(db, "users", uid, "goals");
    const q = query(goalsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Goal[];
}

export async function addGoal(uid: string, title: string): Promise<string> {
    const goalsRef = collection(db, "users", uid, "goals");
    const docRef = await addDoc(goalsRef, {
        title,
        currentPercent: 0,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateGoalProgress(
    uid: string,
    goalId: string,
    newPercent: number
): Promise<void> {
    const clampedPercent = Math.max(0, Math.min(100, newPercent));
    const goalRef = doc(db, "users", uid, "goals", goalId);
    await updateDoc(goalRef, { currentPercent: clampedPercent });
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
    const goalRef = doc(db, "users", uid, "goals", goalId);
    await deleteDoc(goalRef);
}

// Todos CRUD
export async function getTodos(uid: string): Promise<Todo[]> {
    const todosRef = collection(db, "users", uid, "todos");
    const q = query(todosRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Todo[];
}

export async function addTodo(
    uid: string,
    title: string,
    goalId?: string
): Promise<string> {
    const todosRef = collection(db, "users", uid, "todos");
    const todoData: DocumentData = {
        title,
        isDone: false,
        createdAt: serverTimestamp(),
    };

    if (goalId) {
        todoData.goalId = goalId;
    }

    const docRef = await addDoc(todosRef, todoData);
    return docRef.id;
}

export async function addTodosBulk(
    uid: string,
    titles: string[],
    goalId?: string
): Promise<string[]> {
    const todosRef = collection(db, "users", uid, "todos");
    const batch = writeBatch(db);
    const ids: string[] = [];

    titles.forEach((title) => {
        const todoRef = doc(todosRef);
        const todoData: DocumentData = {
            title,
            isDone: false,
            createdAt: serverTimestamp(),
        };

        if (goalId) {
            todoData.goalId = goalId;
        }

        batch.set(todoRef, todoData);
        ids.push(todoRef.id);
    });

    await batch.commit();
    return ids;
}

export async function toggleTodo(
    uid: string,
    todoId: string,
    isDone: boolean
): Promise<void> {
    const todoRef = doc(db, "users", uid, "todos", todoId);
    await updateDoc(todoRef, { isDone });
}

export async function deleteTodo(uid: string, todoId: string): Promise<void> {
    const todoRef = doc(db, "users", uid, "todos", todoId);
    await deleteDoc(todoRef);
}

// Daily Tracker CRUD
export async function getActivities(uid: string): Promise<Activity[]> {
    const activitiesRef = collection(db, "users", uid, "activities");
    const q = query(activitiesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Activity[];
}

export async function getDailyLogs(
    uid: string,
    startDate: string,
    endDate: string
): Promise<DailyLog[]> {
    const logsRef = collection(db, "users", uid, "dailyLogs");
    const q = query(
        logsRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as DailyLog[];
}

export async function addDailyLog(
    uid: string,
    payload: Omit<DailyLog, "id" | "createdAt">
): Promise<string> {
    const logsRef = collection(db, "users", uid, "dailyLogs");
    const docRef = await addDoc(logsRef, {
        ...payload,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateDailyLog(
    uid: string,
    logId: string,
    updates: Partial<Pick<DailyLog, "durationMinutes" | "notes" | "date">>
): Promise<void> {
    const logRef = doc(db, "users", uid, "dailyLogs", logId);
    await updateDoc(logRef, updates);
}

export async function deleteDailyLog(uid: string, logId: string): Promise<void> {
    const logRef = doc(db, "users", uid, "dailyLogs", logId);
    await deleteDoc(logRef);
}
