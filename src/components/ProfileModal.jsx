import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  X,
  ShieldCheck,
  KeyRound,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth, DEFAULT_PERMISSIONS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from './ConfirmModal';

function ProfileDialog({ onClose }) {
  const {
    user,
    updateProfile,
    updatePassword,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password' | 'accounts'

  // Tab 1: Current User Info state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Tab 2: Current User Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Tab 3: Users Management state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null); // null = new user, string = editing user
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState({ ...DEFAULT_PERMISSIONS });
  const [savingUserForm, setSavingUserForm] = useState(false);

  // Delete User Modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Load all users for Tab 3
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { users } = await getAllUsers();
    setUsersList(users || []);
    setLoadingUsers(false);
  }, [getAllUsers]);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setUserFormOpen(false);
    if (tab === 'accounts') {
      loadUsers();
    }
  };

  // Lock scroll & handle Escape
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle Save Info (Current User)
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('يرجى ملء كافة الحقول', 'error');
      return;
    }

    setSavingInfo(true);
    const res = await updateProfile(name, email);
    setSavingInfo(false);
    if (res.success) {
      onClose();
    }
  };

  // Handle Save Password (Current User)
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('يرجى إدخال كلمة المرور الحالية والجديدة', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('كلمة المرور الجديدة وتأكيدها غير متطابقين!', 'error');
      return;
    }

    setSavingPassword(true);
    const res = await updatePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  // Open Form to create new user
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPermissions({
      view: true,
      add: true,
      edit: false,
      delete: false,
    });
    setUserFormOpen(true);
  };

  // Open Form to edit existing user
  const handleOpenEditUser = (targetUser) => {
    setEditingUserId(targetUser.id);
    setFormName(targetUser.name || '');
    setFormEmail(targetUser.email || '');
    setFormPassword(''); // leave blank if unchanged
    setFormPermissions(targetUser.permissions || { ...DEFAULT_PERMISSIONS });
    setUserFormOpen(true);
  };

  // Toggle permission checkbox
  const togglePermission = (key) => {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Apply quick preset for permissions
  const applyPreset = (preset) => {
    if (preset === 'admin') {
      setFormPermissions({ view: true, add: true, edit: true, delete: true });
    } else if (preset === 'waiter') {
      setFormPermissions({ view: true, add: true, edit: false, delete: false });
    } else if (preset === 'viewer') {
      setFormPermissions({ view: true, add: false, edit: false, delete: false });
    }
  };

  // Save User (Create or Update)
  const handleSaveUserForm = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast('يرجى إدخال الاسم والبريد الإلكتروني', 'error');
      return;
    }

    if (!editingUserId && !formPassword) {
      showToast('يرجى إدخال كلمة المرور للحساب الجديد', 'error');
      return;
    }

    setSavingUserForm(true);

    if (editingUserId) {
      // Update existing
      const res = await updateUser({
        id: editingUserId,
        name: formName,
        email: formEmail,
        password: formPassword || undefined,
        permissions: formPermissions,
      });
      setSavingUserForm(false);
      if (res.success) {
        setUserFormOpen(false);
        loadUsers();
      }
    } else {
      // Create new
      const res = await createUser({
        name: formName,
        email: formEmail,
        password: formPassword,
        permissions: formPermissions,
      });
      setSavingUserForm(false);
      if (res.success) {
        setUserFormOpen(false);
        loadUsers();
      }
    }
  };

  // Confirm delete user
  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    const res = await deleteUser(userToDelete.id, userToDelete.email);
    if (res.success) {
      loadUsers();
    }
    setUserToDelete(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className="relative z-10 w-full max-w-md bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] animate-slide-up overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div
          className="w-full pt-3 pb-1 flex justify-center cursor-pointer select-none"
          onClick={onClose}
          title="اضغط للإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition" />
        </div>

        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                إعدادات الحساب والصلاحيات
              </h3>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition text-xs font-bold cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        </div>

        {/* 3 Sub-Tabs: Info vs Password vs Accounts */}
        <div className="p-4 pb-2 bg-slate-900 shrink-0">
          <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 gap-1 text-center">
            <button
              type="button"
              onClick={() => handleSwitchTab('info')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                activeTab === 'info'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>معلوماتي</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('password')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                activeTab === 'password'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>كلمة المرور</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('accounts')}
              className={`py-2 px-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                activeTab === 'accounts'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>المستخدمين</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* TAB 1: EDIT MY INFORMATIONS */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم الكامل / اسم النادل *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ياسين / مختار"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني (Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cafe.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* My active permissions badges */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  صلاحيات حسابك الحالية:
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                  <span
                    className={`py-1 rounded-lg border ${
                      user?.permissions?.view
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    العرض ✓
                  </span>
                  <span
                    className={`py-1 rounded-lg border ${
                      user?.permissions?.add
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    الإضافة ✓
                  </span>
                  <span
                    className={`py-1 rounded-lg border ${
                      user?.permissions?.edit
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    التعديل ✓
                  </span>
                  <span
                    className={`py-1 rounded-lg border ${
                      user?.permissions?.delete
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    الحذف ✓
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="col-span-1 min-h-[48px] py-3 px-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="col-span-2 min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition font-black text-slate-950 text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingInfo ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ تعديلات الحساب</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EDIT PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الحالية *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة مرور جديدة (4 أحرف أو أرقام فأكثر)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="col-span-1 min-h-[48px] py-3 px-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="col-span-2 min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 transition font-black text-slate-950 text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingPassword ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: USER ACCOUNTS & PERMISSIONS MANAGEMENT */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Top Action / Header */}
              {!userFormOpen ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    قائمة المستخدمين ({usersList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenCreateUser}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>إنشاء حساب جديد</span>
                  </button>
                </div>
              ) : (
                /* INLINE FORM: CREATE / EDIT USER */
                <form
                  onSubmit={handleSaveUserForm}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      {editingUserId ? <Edit2 className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                      <span>{editingUserId ? 'تعديل بيانات وصلاحيات الحساب' : 'إنشاء حساب جديد وتعيين الصلاحيات'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setUserFormOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                      title="إغلاق النموذج"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      الاسم الكامل (أو اسم النادل) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="مثال: مختار الشنتوفي"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      البريد الإلكتروني (Email) *
                    </label>
                    <input
                      type="email"
                      required
                      inputMode="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="waiter@cafe.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {editingUserId ? 'كلمة المرور (اتركها فارغة إذا لم ترد تغييرها)' : 'كلمة المرور *'}
                    </label>
                    <input
                      type="password"
                      required={!editingUserId}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Checkboxes: View - Add - Edit - Delete */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-200">
                        صلاحيات الوصول (Permissions):
                      </label>
                      {/* Presets */}
                      <div className="flex gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => applyPreset('admin')}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-400 hover:text-white"
                        >
                          كامل
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('waiter')}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white"
                        >
                          نادل
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('viewer')}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-blue-400 hover:text-white"
                        >
                          مشاهدة
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Checkbox 1: View (العرض) */}
                      <label
                        onClick={() => togglePermission('view')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          formPermissions.view
                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-bold">العرض (View)</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            formPermissions.view
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {formPermissions.view && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </label>

                      {/* Checkbox 2: Add (الإضافة) */}
                      <label
                        onClick={() => togglePermission('add')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          formPermissions.add
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          <span className="font-bold">الإضافة (Add)</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            formPermissions.add
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {formPermissions.add && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </label>

                      {/* Checkbox 3: Edit (التعديل) */}
                      <label
                        onClick={() => togglePermission('edit')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          formPermissions.edit
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="font-bold">التعديل (Edit)</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            formPermissions.edit
                              ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                              : 'border-slate-600'
                          }`}
                        >
                          {formPermissions.edit && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </label>

                      {/* Checkbox 4: Delete (الحذف) */}
                      <label
                        onClick={() => togglePermission('delete')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          formPermissions.delete
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="font-bold">الحذف (Delete)</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            formPermissions.delete
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {formPermissions.delete && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Form Submit / Cancel */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUserFormOpen(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={savingUserForm}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {savingUserForm ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{editingUserId ? 'تحديث الصلاحيات' : 'حفظ وإنشاء الحساب'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* LIST OF ACCOUNTS */}
              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 mx-auto mb-2 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">جاري تحميل قائمة المستخدمين...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">لا يوجد مستخدمين مسجلين بعد.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {usersList.map((u) => {
                    const isSelf = user?.id === u.id;
                    const isMainAdmin = u.email?.toLowerCase() === 'admin@cafe.com';
                    const perms = u.permissions || DEFAULT_PERMISSIONS;

                    return (
                      <div
                        key={u.id}
                        className={`p-3 rounded-2xl border transition ${
                          isSelf
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-slate-950/80 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center text-xs font-black">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-black text-white">{u.name}</h4>
                                {isSelf && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    حسابك
                                  </span>
                                )}
                                {isMainAdmin && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    المدير
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{u.email}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center active:scale-95 transition"
                              title="تعديل الحساب والصلاحيات"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isSelf && !isMainAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteModalOpen(true);
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center active:scale-95 transition"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Permissions Badges */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center pt-1 border-t border-slate-900">
                          <span
                            className={`py-0.5 rounded ${
                              perms.view
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-slate-900/50 text-slate-600 line-through'
                            }`}
                          >
                            عرض
                          </span>
                          <span
                            className={`py-0.5 rounded ${
                              perms.add
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-slate-900/50 text-slate-600 line-through'
                            }`}
                          >
                            إضافة
                          </span>
                          <span
                            className={`py-0.5 rounded ${
                              perms.edit
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-slate-900/50 text-slate-600 line-through'
                            }`}
                          >
                            تعديل
                          </span>
                          <span
                            className={`py-0.5 rounded ${
                              perms.delete
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-slate-900/50 text-slate-600 line-through'
                            }`}
                          >
                            حذف
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUserConfirm}
        title="حذف حساب مستخدم"
        message={`هل أنت متأكد من رغبتك في حذف حساب "${userToDelete?.name}" (${userToDelete?.email}) نهائياً؟`}
        confirmText="تأكيد الحذف"
      />
    </div>,
    document.body
  );
}

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return <ProfileDialog onClose={onClose} />;
}
