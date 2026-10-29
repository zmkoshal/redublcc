import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Search,
  Filter,
  Sparkles,
  Copy,
  Check,
  UserCheck,
  AlertCircle,
  Briefcase,
  Laptop,
  Eye as ViewIcon
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add / Edit User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'it_entry' as UserRole,
    is_active: true
  });

  // Dedicated Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // General Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Failed to load users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Create User Modal
  const openCreateModal = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'it_entry',
      is_active: true
    });
    setIsUserModalOpen(true);
  };

  // Open Edit User Modal
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUserFormData({
      username: u.username,
      email: u.email,
      password: '',
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active
    });
    setIsUserModalOpen(true);
  };

  // Open Dedicated Reset Password Modal
  const openPasswordModal = (u: User) => {
    setPasswordTargetUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowPassword(false);
    setCopiedNotification(false);
    setIsPasswordModalOpen(true);
  };

  // Generate strong secure corporate password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd = 'Red@';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    navigator.clipboard?.writeText(pwd);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Submit Password Reset by Super Admin
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      await api.resetUserPassword(passwordTargetUser.id, newPassword);
      setPasswordSuccess(`Password for user ${passwordTargetUser.username} updated successfully!`);
      showToast(`Password for ${passwordTargetUser.username} updated successfully!`);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        loadUsers();
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to reset password. Verify super admin privileges.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Quick Role Change Dropdown
  const handleRoleChange = async (u: User, newRole: UserRole) => {
    if (u.role === newRole) return;
    try {
      await api.changeUserRole(u.id, newRole);
      showToast(`Updated role for ${u.username} to ${getRoleLabel(newRole)}`);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  // Toggle Account Active / Inactive
  const handleToggleActive = async (u: User) => {
    if (u.id === currentUser?.id && u.is_active) {
      alert('You cannot deactivate your own logged-in administrator account.');
      return;
    }
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      showToast(`User @${u.username} is now ${!u.is_active ? 'Active' : 'Deactivated'}`);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle account status', 'error');
    }
  };

  // Save User (Create or Edit)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userFormData);
        showToast(`User @${userFormData.username || editingUser.username} updated successfully`);
      } else {
        await api.createUser(userFormData);
        showToast(`User @${userFormData.username} created successfully`);
      }
      setIsUserModalOpen(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Error saving user');
    }
  };

  // Delete User
  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own logged-in administrator account.');
      return;
    }
    if (u.role === 'super_admin') {
      const activeAdmins = users.filter(x => x.role === 'super_admin' && x.is_active);
      if (activeAdmins.length <= 1) {
        alert('Cannot delete the only active Super Administrator. Please assign another Super Admin first.');
        return;
      }
    }
    if (confirm(`Are you sure you want to delete user @${u.username} (${u.full_name})? This cannot be undone.`)) {
      try {
        await api.deleteUser(u.id);
        showToast(`User @${u.username} deleted successfully`);
        loadUsers();
      } catch (err: any) {
        alert(err.message || 'Delete user failed');
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'finance_hof':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'it_entry':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'management_readonly':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'finance_hof':
        return 'Head of Finance (HOF)';
      case 'it_entry':
        return 'IT / Data Entry Specialist';
      case 'management_readonly':
        return 'Executive Management (Read-Only)';
      default:
        return role;
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.is_active) ||
      (statusFilter === 'INACTIVE' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter(u => u.is_active).length;
  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const financeCount = users.filter(u => u.role === 'finance_hof').length;
  const itCount = users.filter(u => u.role === 'it_entry').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              User Management &amp; Role-Based Access (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800 uppercase tracking-wide">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage user accounts, assign corporate security roles, and reset credentials for Red Publicis portal
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{users.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Accounts</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Finance / HOF</span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{financeCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Super Admins</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{superAdminCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="finance_hof">Finance / HOF</option>
              <option value="it_entry">IT Data Entry</option>
              <option value="management_readonly">Management (Read-Only)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
            <p className="text-sm font-bold">No user accounts found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new user</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">System Role</th>
                  {isSuperAdmin && <th className="py-3.5 px-4">Change Role</th>}
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map(u => {
                  const isSelf = currentUser?.id === u.id;
                  const initials = u.full_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                              : u.role === 'finance_hof'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {u.full_name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getRoleBadge(u.role)}`}>
                          <Shield className="w-3 h-3" />
                          <span>{getRoleLabel(u.role)}</span>
                        </span>
                      </td>

                      {/* Quick Role Switcher (Super Admin only) */}
                      {isSuperAdmin && (
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="finance_hof">Finance / HOF</option>
                            <option value="it_entry">IT Data Entry</option>
                            <option value="management_readonly">Management (Read-Only)</option>
                          </select>
                        </td>
                      )}

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={!isSuperAdmin || isSelf}
                          title={isSuperAdmin && !isSelf ? "Click to toggle active/inactive" : undefined}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                          } ${!isSuperAdmin || isSelf ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        >
                          {u.is_active ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>{u.is_active ? 'Active' : 'Deactivated'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Super Admin Change Password Button */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => openPasswordModal(u)}
                              title="Reset / Change User Password"
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 font-bold text-[11px] transition-all"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Password</span>
                            </button>
                          )}

                          {/* Edit Details */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => openEditModal(u)}
                              title="Edit User Information"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete User */}
                          {isSuperAdmin && !isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User Account"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role & Permissions Matrix Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Corporate Role Permissions Guide (RBAC)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Super Admin */}
          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-purple-800 dark:text-purple-300 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Super Administrator</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Full master authority: manage users, reset passwords, change roles, approve credit card statements, and modify system settings.
            </p>
          </div>

          {/* Finance HOF */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-blue-800 dark:text-blue-300 font-extrabold text-xs">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Head of Finance (HOF)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Review and approve statements, record bank payments and settlements, sign off on monthly reconciliations, and export Excel / PDF reports.
            </p>
          </div>

          {/* IT Data Entry */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
              <Laptop className="w-4 h-4 text-emerald-600" />
              <span>IT / Data Entry Specialist</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Add new credit card statements, enter daily card transactions, auto-calculate Pakistan taxes (FBR 236Y, PRA, SRB), and upload statements.
            </p>
          </div>

          {/* Management Read-Only */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
              <ViewIcon className="w-4 h-4 text-slate-500" />
              <span>Executive Management</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Executive oversight: view-only access to corporate spend analytics, company allocation charts, merchant breakdowns, and audit trails.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: Dedicated Password Reset Option by Super Admin      */}
      {/* ============================================================ */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Super Admin Password Reset"
        subtitle={`Set a new secure password for user @${passwordTargetUser?.username}`}
        maxWidth="md"
      >
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
          {/* Target User Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                {passwordTargetUser?.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {passwordTargetUser?.full_name}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  @{passwordTargetUser?.username} &bull; {passwordTargetUser?.email}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${passwordTargetUser ? getRoleBadge(passwordTargetUser.role) : ''}`}>
              {passwordTargetUser?.role.replace('_', ' ')}
            </span>
          </div>

          {/* Alerts */}
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {/* Password Generator Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password *</span>
            <button
              type="button"
              onClick={generateStrongPassword}
              className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Generate Strong Password</span>
            </button>
          </div>

          {/* New Password Input */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Enter minimum 6 characters..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Repeat the new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
              }`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">Passwords do not match</p>
            )}
            {copiedNotification && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Generated password copied to clipboard!</span>
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{passwordLoading ? 'Resetting...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: Create / Edit User Profile Modal                    */}
      {/* ============================================================ */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.full_name}` : 'Create New User Account'}
        subtitle="Manage access permissions and role tier for Red Publicis operations"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zahid Mahmood"
              value={userFormData.full_name}
              onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                disabled={editingUser?.id === currentUser?.id}
                placeholder="e.g. zmahmood"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="user@red.com.pk"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password * (Minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Role &amp; Permission Tier *
              </label>
              <select
                value={userFormData.role}
                disabled={editingUser?.id === currentUser?.id}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="super_admin">Super Admin</option>
                <option value="finance_hof">Finance / Head of Finance</option>
                <option value="it_entry">IT / Data Entry Specialist</option>
                <option value="management_readonly">Management (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={userFormData.is_active ? 'true' : 'false'}
                disabled={editingUser?.id === currentUser?.id}
                onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="true">Active Account</option>
                <option value="false">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
