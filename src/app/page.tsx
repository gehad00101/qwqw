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
import { db, auth } from "@/lib/firebase";
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
          console.error("خطأ في تسجيل الدخول المجهول: ", error);
          toast({
            title: "خطأ في المصادقة",
            description: "لا يمكن تسجيل الدخول كمستخدم مجهول.",
            variant: "destructive",
          });
        });
      }
    });

    return () => unsubscribeAuth();
  }, [toast]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "todos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
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
          console.error("خطأ في جلب المهام: ", error);
          toast({
            title: "خطأ",
            description: "فشل في جلب قائمة المهام.",
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
        title: "خطأ في الإدخال",
        description: "لا يمكن أن تكون المهمة فارغة.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "خطأ في المصادقة",
        description: "يجب تسجيل الدخول لإضافة مهمة.",
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
        title: "نجاح",
        description: "تمت إضافة المهمة بنجاح.",
      });
    } catch (error) {
      console.error("خطأ في إضافة المستند: ", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المهمة.",
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
        title: "نجاح",
        description: `تم تحديد المهمة كـ ${
          !todo.completed ? "مكتملة" : "غير مكتملة"
        }.`,
      });
    } catch (error) {
      console.error("خطأ في تحديث المستند: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المهمة.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id));
      toast({
        title: "نجاح",
        description: "تم حذف المهمة بنجاح.",
      });
    } catch (error) {
      console.error("خطأ في حذف المستند: ", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المهمة.",
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
        title: "خطأ في الإدخال",
        description: "لا يمكن أن تكون المهمة فارغة.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "todos", id), {
        text: editingText,
      });
      toast({
        title: "نجاح",
        description: "تم تحديث المهمة بنجاح.",
      });
      cancelEditing();
    } catch (error) {
      console.error("خطأ في تحديث المستند: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المهمة.",
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
                قائمة المهام
              </CardTitle>
              <CardDescription className="text-center">
                ما الذي تريد إنجازه اليوم؟
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                <Input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="flex-grow text-right"
                  placeholder="أضف مهمة جديدة"
                />
                <Button type="submit">إضافة</Button>
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
                      className="ml-4"
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
                    <div className="flex items-center space-x-2 mr-auto">
                      {editingTodoId !== todo.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(todo)}
                        >
                          تعديل
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(todo.id)}
                      >
                        حذف
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
