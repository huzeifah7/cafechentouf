/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'cafe_chentouf_current_user';

export const DEFAULT_PERMISSIONS = {
  view: true,
  add: true,
  edit: true,
  delete: true,
};

// Helper to parse user row and extract clean name and permissions
export function parseUserRow(row) {
  if (!row) return null;
  const rawName = row.name || '';
  let cleanName = rawName.trim();
  let permissions = { ...DEFAULT_PERMISSIONS };

  // 1. If explicit column permissions exists (JSON object or string)
  if (row.permissions) {
    if (typeof row.permissions === 'string') {
      try {
        permissions = { ...DEFAULT_PERMISSIONS, ...JSON.parse(row.permissions) };
      } catch {
        // keep defaults
      }
    } else if (typeof row.permissions === 'object') {
      permissions = { ...DEFAULT_PERMISSIONS, ...row.permissions };
    }
  } else if (rawName.includes('|||')) {
    // 2. Fallback: serialized in name e.g. "Yassine ||| {"view":true,"add":false,...}"
    const [namePart, permPart] = rawName.split('|||');
    cleanName = (namePart || '').trim();
    try {
      const parsed = JSON.parse(permPart.trim());
      permissions = { ...DEFAULT_PERMISSIONS, ...parsed };
    } catch {
      // keep defaults
    }
  }

  // Superadmin always has full access
  if (row.email?.toLowerCase() === 'admin@cafe.com') {
    permissions = { view: true, add: true, edit: true, delete: true };
  } else {
    // Ensure boolean values
    permissions = {
      view: permissions.view !== false,
      add: permissions.add !== false,
      edit: permissions.edit !== false,
      delete: permissions.delete !== false,
    };
  }

  return {
    ...row,
    name: cleanName,
    rawName,
    permissions,
  };
}

export function formatUserNameWithPermissions(cleanName, permissions) {
  return `${cleanName.trim()} ||| ${JSON.stringify(permissions)}`;
}

export function AuthProvider({ children }) {
  // Read saved user synchronously from localStorage on initial render
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? parseUserRow(JSON.parse(savedUser)) : null;
    } catch (e) {
      console.error('Error reading saved user:', e);
      return null;
    }
  });

  const [loading] = useState(false);
  const { showToast } = useToast();

  // Helper to check specific permission for current user
  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.email?.toLowerCase() === 'admin@cafe.com') return true;
    if (!user.permissions) return true;
    return Boolean(user.permissions[perm]);
  };

  // Sign In using custom 'users' table
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

      const parsedUser = parseUserRow(data);
      setUser(parsedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUser));
      showToast(`مرحباً بك يا ${parsedUser.name || 'مدير'} في مقهى شنتوف`, 'success');
      return { success: true, user: parsedUser };
    } catch (err) {
      showToast(err.message || 'حدث خطأ غير متوقع', 'error');
      return { success: false, error: err.message };
    }
  };

  // Sign Up / Create new user in 'users' table
  const signUp = async (name, email, password) => {
    return createUser({ name, email, password, permissions: DEFAULT_PERMISSIONS });
  };

  // Fetch all users for account management
  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        showToast('تعذر جلب قائمة المستخدمين: ' + error.message, 'error');
        return { users: [], error };
      }

      const users = (data || []).map(parseUserRow);
      return { users, error: null };
    } catch (err) {
      return { users: [], error: err };
    }
  };

  // Create new user with granular permissions (View, Add, Edit, Delete)
  const createUser = async ({ name, email, password, permissions = DEFAULT_PERMISSIONS }) => {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail || !password) {
        showToast('يرجى ملء كافة الحقول المطلوبة', 'error');
        return { success: false, error: 'Missing fields' };
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1);

      if (existing && existing.length > 0) {
        showToast('هذا البريد الإلكتروني مسجل بالفعل!', 'error');
        return { success: false, error: 'البريد مسجل مسبقاً' };
      }

      // Try inserting with 'permissions' column first
      let insertRes = await supabase
        .from('users')
        .insert([
          {
            name: cleanName,
            email: cleanEmail,
            password: password,
            permissions: permissions,
          },
        ])
        .select()
        .single();

      // If permissions column does not exist in schema cache, fallback to name-encoding
      if (insertRes.error && insertRes.error.message?.includes('permissions')) {
        const encodedName = formatUserNameWithPermissions(cleanName, permissions);
        insertRes = await supabase
          .from('users')
          .insert([
            {
              name: encodedName,
              email: cleanEmail,
              password: password,
            },
          ])
          .select()
          .single();
      }

      if (insertRes.error) {
        showToast('تعذر إنشاء الحساب: ' + insertRes.error.message, 'error');
        return { success: false, error: insertRes.error.message };
      }

      const newUser = parseUserRow(insertRes.data);
      showToast(`تم إنشاء حساب "${cleanName}" بنجاح!`, 'success');
      return { success: true, user: newUser };
    } catch (err) {
      showToast(err.message || 'حدث خطأ في إنشاء الحساب', 'error');
      return { success: false, error: err.message };
    }
  };

  // Update existing user (Name, Email, optional Password, Permissions)
  const updateUser = async ({ id, name, email, password, permissions }) => {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        showToast('يرجى ملء الاسم والبريد الإلكتروني', 'error');
        return { success: false, error: 'Missing fields' };
      }

      // Check email uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .neq('id', id)
        .limit(1);

      if (existing && existing.length > 0) {
        showToast('هذا البريد الإلكتروني مستخدم بالفعل بحساب آخر', 'error');
        return { success: false, error: 'Email in use' };
      }

      const updateData = {
        name: cleanName,
        email: cleanEmail,
        ...(permissions ? { permissions } : {}),
        ...(password && password.trim() ? { password: password.trim() } : {}),
      };

      let updateRes = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      // Fallback if permissions column not present
      if (updateRes.error && updateRes.error.message?.includes('permissions')) {
        const fallbackPerms = permissions || user?.permissions || DEFAULT_PERMISSIONS;
        const encodedName = formatUserNameWithPermissions(cleanName, fallbackPerms);
        const fallbackData = {
          name: encodedName,
          email: cleanEmail,
          ...(password && password.trim() ? { password: password.trim() } : {}),
        };
        updateRes = await supabase
          .from('users')
          .update(fallbackData)
          .eq('id', id)
          .select()
          .single();
      }

      if (updateRes.error) {
        showToast('تعذر تحديث الحساب: ' + updateRes.error.message, 'error');
        return { success: false, error: updateRes.error.message };
      }

      const parsedUpdated = parseUserRow(updateRes.data);

      // If current user updated, update context & localStorage
      if (user?.id === id) {
        setUser(parsedUpdated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUpdated));
      }

      showToast(`تم تحديث حساب "${cleanName}" بنجاح`, 'success');
      return { success: true, user: parsedUpdated };
    } catch (err) {
      showToast(err.message || 'حدث خطأ في التحديث', 'error');
      return { success: false, error: err.message };
    }
  };

  // Delete user account
  const deleteUser = async (id, targetEmail) => {
    try {
      if (user?.id === id) {
        showToast('لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به!', 'error');
        return { success: false, error: 'Cannot delete self' };
      }

      if (targetEmail?.toLowerCase() === 'admin@cafe.com') {
        showToast('لا يمكن حذف الحساب الرئيسي للمدير (admin@cafe.com)', 'error');
        return { success: false, error: 'Cannot delete admin' };
      }

      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        showToast('تعذر حذف المستخدم: ' + error.message, 'error');
        return { success: false, error: error.message };
      }

      showToast('تم حذف الحساب بنجاح', 'info');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء الحذف', 'error');
      return { success: false, error: err.message };
    }
  };

  // Update Profile Name and Email for current user
  const updateProfile = async (name, email) => {
    return updateUser({
      id: user?.id,
      name,
      email,
      permissions: user?.permissions,
    });
  };

  // Update Password for current user
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      if (!user?.id) return { success: false, error: 'المستخدم غير مسجل' };
      if (!currentPassword || !newPassword) {
        showToast('يرجى إدخال كلمة المرور الحالية والجديدة', 'error');
        return { success: false, error: 'Missing fields' };
      }

      if (newPassword.length < 4) {
        showToast('كلمة المرور الجديدة يجب أن تحتوي على 4 أحرف أو أرقام على الأقل', 'error');
        return { success: false, error: 'Password too short' };
      }

      // Check current password from DB
      const { data: dbUser, error: checkErr } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single();

      if (checkErr || !dbUser) {
        showToast('تعذر التحقق من الحساب في قاعدة البيانات', 'error');
        return { success: false, error: 'User check failed' };
      }

      if (dbUser.password !== currentPassword) {
        showToast('كلمة المرور الحالية غير صحيحة!', 'error');
        return { success: false, error: 'Incorrect current password' };
      }

      // Update password
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) {
        showToast('تعذر حفظ كلمة المرور الجديدة: ' + error.message, 'error');
        return { success: false, error: error.message };
      }

      const updatedUser = { ...user, password: newPassword };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      showToast('تم تغيير كلمة المرور بنجاح!', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'حدث خطأ في تغيير كلمة المرور', 'error');
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
        hasPermission,
        signIn,
        signUp,
        getAllUsers,
        createUser,
        updateUser,
        deleteUser,
        updateProfile,
        updatePassword,
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
