/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'cafe_chentouf_current_user';

export function AuthProvider({ children }) {
  // Read saved user synchronously from localStorage on initial render
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error reading saved user:', e);
      return null;
    }
  });

  const [loading] = useState(false);
  const { showToast } = useToast();

  // Sign In using the custom 'users' table in Supabase
  const signIn = async (email, password) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205') {
          showToast('جدول users غير موجود بعد في Supabase! يرجى تنفيذ كود SQL أولاً', 'error', 6000);
        } else {
          showToast('حدث خطأ في الاتصال: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
      }

      if (!data) {
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        return { success: false, error: 'بيانات غير صحيحة' };
      }

      // Successful login
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      showToast(`مرحباً بك يا ${data.name || 'مدير'} في مقهى شنتوف`, 'success');
      return { success: true, user: data };
    } catch (err) {
      showToast(err.message || 'حدث خطأ غير متوقع', 'error');
      return { success: false, error: err.message };
    }
  };

  // Sign Up / Create new user in 'users' table
  const signUp = async (name, email, password) => {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      // Check if email already exists
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1);

      if (checkError && checkError.code === 'PGRST205') {
        showToast('جدول users غير موجود بعد في Supabase! يرجى تنفيذ كود SQL', 'error', 6000);
        return { success: false, error: 'Table does not exist' };
      }

      if (existing && existing.length > 0) {
        showToast('هذا البريد الإلكتروني مسجل بالفعل! يرجى تسجيل الدخول', 'error');
        return { success: false, error: 'البريد مسجل مسبقاً' };
      }

      // Insert new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            name: cleanName,
            email: cleanEmail,
            password: password,
          },
        ])
        .select()
        .single();

      if (insertError) {
        showToast('تعذر إنشاء الحساب: ' + insertError.message, 'error');
        return { success: false, error: insertError.message };
      }

      // Auto login newly registered user
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      showToast(`تم إنشاء الحساب بنجاح! مرحباً ${cleanName}`, 'success');
      return { success: true, user: newUser };
    } catch (err) {
      showToast(err.message || 'حدث خطأ في التسجيل', 'error');
      return { success: false, error: err.message };
    }
  };

  // Sign Out
  const signOut = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    showToast('تم تسجيل الخروج بنجاح', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
