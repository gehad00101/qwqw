"use client"
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "react-hot-toast";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt?: any;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("خطأ في تسجيل الدخول المجهول: ", error);
          toast.error("فشل المصادقة. يرجى تحديث الصفحة.");
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'todos'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const todosData: Todo[] = [];
        querySnapshot.forEach((doc) => {
          todosData.push({ id: doc.id, ...doc.data() } as Todo);
        });
        setTodos(todosData);
      }, (error) => {
          console.error("خطأ في جلب المهام: ", error);
          toast.error("فشل في جلب المهام.");
      });

      return () => unsubscribe();
    }
  }, [user]);

  const addTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTodo.trim() === "") {
      toast.error("لا يمكن أن تكون المهمة فارغة.");
      return;
    }
    if (!user) {
        toast.error("يجب تسجيل الدخول لإضافة مهمة.");
        return;
    }

    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      toast.success("تمت إضافة المهمة!");
      setNewTodo("");
    } catch (error) {
      console.error("خطأ في إضافة المستند: ", error);
      toast.error("فشل في إضافة المهمة.");
    }
  };

  const toggleComplete = async (todo: Todo) => {
    try {
      await updateDoc(doc(db, "todos", todo.id), {
        completed: !todo.completed,
      });
      toast.success(`تم تحديد المهمة كـ ${!todo.completed ? 'مكتملة' : 'غير مكتملة'}.`);
    } catch (error) {
      console.error("خطأ في تحديث المستند: ", error);
      toast.error("فشل في تحديث المهمة.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id));
      toast.success("تم حذف المهمة!");
    } catch (error) {
      console.error("خطأ في حذف المستند: ", error);
      toast.error("فشل في حذف المهمة.");
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditingText('');
  };

  const saveEdit = async (id: string) => {
    if (editingText.trim() !== '') {
      try {
        await updateDoc(doc(db, 'todos', id), {
          text: editingText,
        });
        toast.success('تم تحديث المهمة!');
        cancelEditing();
      } catch (error) {
        console.error('خطأ في تحديث المستند: ', error);
        toast.error('فشل في تحديث المهمة.');
      }
    } else {
      toast.error('لا يمكن أن تكون المهمة فارغة.');
    }
  };

   return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-gray-100 dark:bg-gray-900">
       <Toaster position="bottom-center" />
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">قائمة مهامي</h1>
          <form onSubmit={addTodo} className="flex gap-2 mb-4">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-grow"
              placeholder="إضافة مهمة جديدة"
            />
            <Button type="submit">إضافة</Button>
          </form>
          <ul className="space-y-2">
            {todos.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((todo) => (
              <li
                 key={todo.id}
                className={`flex items-center p-3 rounded-md transition-all duration-200 ${
                  todo.completed ? 'bg-green-100 dark:bg-green-900/20 text-gray-500 dark:text-gray-400 line-through' : 'bg-gray-50 dark:bg-gray-700'
                 }`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo)}
                  className="h-5 w-5 rounded text-blue-500 focus:ring-blue-500"
                />
                {editingTodoId === todo.id ? (
                  <Input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => saveEdit(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(todo.id);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="flex-grow mx-2"
                    autoFocus
                  />
                ) : (
                  <span onDoubleClick={() => startEditing(todo)} className="flex-grow mx-2 cursor-pointer">
                    {todo.text}
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  {editingTodoId !== todo.id && (
                     <Button variant="ghost" size="sm" onClick={() => startEditing(todo)}>تعديل</Button>
                  )}
                   <Button variant="destructive" size="sm" onClick={() => handleDelete(todo.id)}>حذف</Button>
                 </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
   );
 }
