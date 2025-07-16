"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // Corrected import path
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt?: any;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Error signing in anonymously: ", error);
          toast({
            title: "Authentication Error",
            description: "Could not sign in anonymously.",
            variant: "destructive",
          });
        });
      }
    });

    return () => unsubscribeAuth();
  }, [toast]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "todos"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const todosData: Todo[] = [];
          querySnapshot.forEach((doc) => {
            todosData.push({ id: doc.id, ...doc.data() } as Todo);
          });
          setTodos(todosData);
        },
        (error) => {
          console.error("Error fetching todos: ", error);
          toast({
            title: "Error",
            description: "Failed to fetch todos.",
            variant: "destructive",
          });
        }
      );

      return () => unsubscribe();
    }
  }, [user, toast]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim() === "") {
      toast({
        title: "Input Error",
        description: "Todo item cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a todo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      setNewTodo("");
      toast({
        title: "Success",
        description: "Todo added successfully.",
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: "Error",
        description: "Failed to add todo.",
        variant: "destructive",
      });
    }
  };

  const toggleComplete = async (todo: Todo) => {
    try {
      await updateDoc(doc(db, "todos", todo.id), {
        completed: !todo.completed,
      });
      toast({
        title: "Success",
        description: `Todo marked as ${!todo.completed ? "complete" : "incomplete"}.`,
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({
        title: "Error",
        description: "Failed to update todo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id));
      toast({
        title: "Success",
        description: "Todo deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({
        title: "Error",
        description: "Failed to delete todo.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditingText("");
  };

  const saveEdit = async (id: string) => {
    if (editingText.trim() === "") {
      toast({
        title: "Input Error",
        description: "Todo cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateDoc(doc(db, "todos", id), {
        text: editingText,
      });
      toast({
        title: "Success",
        description: "Todo updated successfully.",
      });
      cancelEditing();
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({
        title: "Error",
        description: "Failed to update todo.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-2xl">
          <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
                My To-Do List
              </CardTitle>
              <CardDescription className="text-center">
                What do you need to get done today?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                <Input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="flex-grow"
                  placeholder="Add a new task"
                />
                <Button type="submit">Add</Button>
              </form>
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className={`flex items-center p-3 rounded-md transition-all duration-200 ${
                      todo.completed
                        ? "bg-green-100 dark:bg-green-900/20 text-gray-500 dark:text-gray-400"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    <Checkbox
                      id={`check-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => toggleComplete(todo)}
                    />
                    {editingTodoId === todo.id ? (
                      <Input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => saveEdit(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(todo.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        className="flex-grow mx-2"
                        autoFocus
                      />
                    ) : (
                      <label
                        htmlFor={`check-${todo.id}`}
                        className={`flex-grow mx-2 cursor-pointer ${
                          todo.completed ? "line-through" : ""
                        }`}
                        onDoubleClick={() => startEditing(todo)}
                      >
                        {todo.text}
                      </label>
                    )}
                    <div className="flex items-center space-x-2">
                      {editingTodoId !== todo.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(todo)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(todo.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
