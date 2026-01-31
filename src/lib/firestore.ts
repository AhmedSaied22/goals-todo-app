import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
    type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Goal, Todo } from "@/types";

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
