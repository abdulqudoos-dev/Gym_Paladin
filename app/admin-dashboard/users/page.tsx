"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type UserItem = {
  _id: string;
  name: string;
  email: string;
  subscription?: { plan: string; status: string };
  assignedProgram?: string | { _id: string; title: string; description: string; duration: number; difficulty: string };
  createdAt?: string;
};

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined);
  const [assigning, setAssigning] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<any | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function refreshUsers() {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterTier !== "all") params.set("plan", filterTier.toLowerCase());
    const token = localStorage.getItem('token');
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const d = await r.json();
    console.log('Refresh Users Response:', { status: r.status, users: d.users });
    if (r.ok) setUsers(d.users || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const urlQ = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') : null;
        const effectiveQ = (urlQ ?? searchTerm).trim();
        if (effectiveQ) params.set("q", effectiveQ);
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (filterTier !== "all") params.set("plan", filterTier.toLowerCase());
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        console.log('Users API Response:', { status: res.status, users: data.users });
        if (!res.ok) throw new Error(data?.message || "Failed to fetch users");
        setUsers(data.users || []);
        // Sync input if navigated from header search
        if (urlQ && urlQ !== searchTerm) setSearchTerm(urlQ);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
    return () => controller.abort();
  }, [searchTerm, filterStatus, filterTier]);

  useEffect(() => {
    if (!assignUserId) return;
    const controller = new AbortController();
    async function loadPrograms() {
      setProgramsLoading(true);
      setProgramsError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs`, { 
          signal: controller.signal, 
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        console.log('Programs API Response:', { status: res.status, data });
        if (res.ok) {
          // Handle both array and object responses
          if (Array.isArray(data)) {
            setPrograms(data);
          } else if (Array.isArray(data?.programs)) {
          setPrograms(data.programs);
        } else {
            setProgramsError('No programs found');
            }
          } else {
          setProgramsError(data?.message || 'Failed to load programs');
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') setProgramsError(e.message || 'Failed to load programs');
      } finally {
        setProgramsLoading(false);
      }
    }
    loadPrograms();
    return () => controller.abort();
  }, [assignUserId]);

  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "inactive": return "bg-red-500/20 text-red-400";
      case "cancelled": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTierColor = (plan: string) => {
    switch (plan) {
      case 'custom': return 'bg-purple-500/20 text-purple-400';
      case 'advanced': return 'bg-blue-500/20 text-blue-400';
      case 'foundations': return 'bg-green-500/20 text-green-400';
      case 'free': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatPlanLabel = (plan?: string) => plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : '-';
  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : '-';
  const getInitials = (fullName: string) => fullName.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0,2) || '?';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            User <span className="text-red-500">Management</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Manage and monitor your user base
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-gray-400">Total Users</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Label htmlFor="search" className="text-gray-300 font-medium mb-2">Search Users</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status-filter" className="text-gray-300 font-medium mb-2">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tier Filter */}
          <div>
            <Label htmlFor="tier-filter" className="text-gray-300 font-medium mb-2">Subscription Tier</Label>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger id="tier-filter">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="foundations">Foundations</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">User</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Subscription</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Programs</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Last Login</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Join Date</th>
                <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-300 group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(user.subscription?.plan || '')}`}>
                      {formatPlanLabel(user.subscription?.plan)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.subscription?.status || '')}`}>
                      {user.subscription?.status || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-300">
                      {user.assignedProgram ? 
                        (typeof user.assignedProgram === 'string' 
                          ? programs.find(p => p._id === user.assignedProgram)?.title || 'Unknown Program'
                          : user.assignedProgram.title || 'Unknown Program'
                        ) 
                        : 'No Program'
                      }
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-300">-</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-300">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-green-400 hover:text-green-300 transition-colors"
                        title="Edit User"
                        onClick={() => setEditUser(user)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setAssignUserId(user._id); setSelectedProgramId(undefined); }}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        title="Assign Program"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ isActive: false }) });
                            if (res.ok) {
                              await refreshUsers();
                            }
                          } catch {}
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Deactivate User"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information and activity
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(selectedUser?.name || '')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser?.name}</h3>
                  <p className="text-gray-400">{selectedUser?.email}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(selectedUser?.subscription?.plan || '')}`}>
                      {formatPlanLabel(selectedUser?.subscription?.plan)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser?.subscription?.status || '')}`}>
                      {selectedUser?.subscription?.status || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {selectedUser?.assignedProgram ? 
                      (typeof selectedUser.assignedProgram === 'string' 
                        ? programs.find(p => p._id === selectedUser.assignedProgram)?.title || 'Unknown'
                        : selectedUser.assignedProgram.title || 'Unknown'
                      ) 
                      : 'None'
                    }
                  </div>
                  <div className="text-gray-400 text-sm">Assigned Program</div>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-gray-400 text-sm">Workouts</div>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">45</div>
                  <div className="text-gray-400 text-sm">Days Active</div>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Completed Upper Body Workout</p>
                      <p className="text-gray-400 text-xs">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Upgraded to Advanced Plan</p>
                      <p className="text-gray-400 text-xs">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Started New Program</p>
                      <p className="text-gray-400 text-xs">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <Button
                  onClick={() => { setEditUser(selectedUser); setSelectedUser(null); }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Edit User
                </Button>
                <Button
                  onClick={() => { setAssignUserId(selectedUser?._id); setSelectedProgramId(undefined); setSelectedUser(null); }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Assign Program
                </Button>
              <Button
                  onClick={async () => {
                    if (!selectedUser?._id) return;
                    try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${selectedUser._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ isActive: false }) });
                      if (res.ok) setSelectedUser(null);
                    } catch {}
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Suspend Account
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and subscription details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editUser?.name || ''}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser?.email || ''}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan">Plan</Label>
                <Select
                  value={editUser?.subscription?.plan || ''}
                  onValueChange={(value) => setEditUser({ ...editUser, subscription: { ...(editUser?.subscription || {}), plan: value } })}
                >
                  <SelectTrigger id="edit-plan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="foundations">Foundations</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editUser?.subscription?.status || ''}
                  onValueChange={(value) => setEditUser({ ...editUser, subscription: { ...(editUser?.subscription || {}), status: value } })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button
                disabled={editSubmitting}
                onClick={async () => {
                  setEditSubmitting(true);
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${editUser._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name: editUser.name, email: editUser.email, subscription: editUser.subscription }) });
                    if (res.ok) {
                      await refreshUsers();
                      setEditUser(null);
                    }
                  } catch {
                  } finally {
                    setEditSubmitting(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-500"
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Program Modal */}
      <Dialog open={!!assignUserId} onOpenChange={() => { setAssignUserId(null); setSelectedProgramId(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Program</DialogTitle>
            <DialogDescription>
              Select a program to assign to this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="program-select">Select Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={setSelectedProgramId}
              >
                <SelectTrigger id="program-select">
                  <SelectValue placeholder="Choose Program" />
                </SelectTrigger>
                <SelectContent>
                  {programsLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                  {programsError && <SelectItem value="error" disabled>{programsError}</SelectItem>}
                  {!programsLoading && !programsError && programs.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setAssignUserId(null)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedProgramId || assigning}
                onClick={async () => {
                  if (!selectedProgramId || !assignUserId) return;
                  setAssigning(true);
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${assignUserId}/programs`, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ programId: selectedProgramId })
                    });
                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData.message || 'Failed to assign program');
                    }
                    const result = await res.json();
                    console.log('Program assigned successfully:', result);
                    setAssignUserId(null);
                    await refreshUsers();
                    alert('Program assigned successfully!');
                  } catch (e) {
                    console.error('Error assigning program:', e);
                    alert(`Error: ${e.message}`);
                  } finally {
                    setAssigning(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-500"
              >
                {assigning ? 'Assigning...' : 'Assign Program'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
