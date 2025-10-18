'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ProgramEditor from '@/components/ProgramEditor';

interface Program {
  _id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  status: string;
  assignedTo: {
    tiers: string[];
    users: string[];
  };
  tags: string[];
  createdAt: string;
  stats: {
    completions: number;
    averageRating: number;
    totalRatings: number;
  };
  days: Array<{
    week: number;
    day: number;
    workouts: Array<{
      workoutId: any;
      order: number;
    }>;
  }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  subscription: {
    plan: string;
    status: string;
  };
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);

  // Form state for creating programs
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 4,
    difficulty: 'Beginner',
    tags: '',
    status: 'draft',
    days: [] as Array<{
      week: number;
      day: number;
      workouts: Array<{
        workoutId: any;
        order: number;
      }>;
    }>
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsRes, usersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`)
      ]);

      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPrograms(Array.isArray(programsData) ? programsData : programsData.programs || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          assignedTo: { tiers: [], users: [] }
        })
      });

      if (response.ok) {
        await fetchData();
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          duration: 4,
          difficulty: 'Beginner',
          tags: '',
          status: 'draft',
          days: []
        });
      }
    } catch (error) {
      setError('Failed to create program');
    }
  };

  const handleProgramSave = (updatedProgram: Program) => {
    setPrograms(programs.map(p => p._id === updatedProgram._id ? updatedProgram : p));
    setShowEditModal(false);
    setSelectedProgram(null);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowEditModal(true);
  };

  const handleAssignProgram = async () => {
    if (!selectedProgram) return;
    
    try {
      setAssigning(true);
      
      // Assign to selected users using the new program assignment service
      for (const userId of selectedUsers) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/programs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: selectedProgram._id })
        });
      }

      // Update program with tier assignments
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs/${selectedProgram._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: {
            tiers: selectedTiers,
            users: [...selectedProgram.assignedTo.users, ...selectedUsers]
          }
        })
      });

      await fetchData();
      setShowAssignModal(false);
      setSelectedProgram(null);
      setSelectedUsers([]);
      setSelectedTiers([]);
    } catch (error) {
      setError('Failed to assign program');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-col sm:flex-row gap-3 sm:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Program Management</h1>
            <p className="text-gray-400">Create and manage fitness programs for your users</p>
          </div>
          {/* <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
          >
            Create New Program
          </button> */}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {programs.map((program, index) => (
            <motion.div
              key={program._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{program.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(program.status)}`}>
                  {program.status}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{program.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(program.difficulty)}`}>
                  {program.difficulty}
                </span>
                <span className="text-gray-400 text-sm">{program.duration} weeks</span>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Assigned To:</div>
                <div className="flex flex-wrap gap-1">
                  {program.assignedTo.tiers.map(tier => (
                    <span key={tier} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {tier}
                    </span>
                  ))}
                  {program.assignedTo.users.length > 0 && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {program.assignedTo.users.length} users
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>{program.stats.completions} completions</span>
                <span>⭐ {program.stats.averageRating.toFixed(1)}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedProgram(program);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 bg-primary-500/20 border border-primary-500/50 text-primary-400 py-2 px-3 rounded-lg hover:bg-primary-500/30 transition-colors text-sm"
                >
                  Assign
                </button>
                {/* <button 
                  onClick={() => handleEditProgram(program)}
                  className="flex-1 bg-gray-600/20 border border-gray-600/50 text-gray-400 py-2 px-3 rounded-lg hover:bg-gray-600/30 transition-colors text-sm"
                >
                  Edit
                </button> */}
              </div>
            </motion.div>
          ))}
        </div>

        {programs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No programs found</div>
            {/* <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
            >
              Create Your First Program
            </button> */}
          </div>
        )}
      </div>

      {/* Create Program Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Program</h2>
            
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <Label htmlFor="program-title">Title</Label>
                <Input
                  id="program-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Program title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="program-description">Description</Label>
                <Textarea
                  id="program-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Program description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program-duration">Duration (weeks)</Label>
                  <Input
                    id="program-duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="1"
                    max="52"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="program-difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({...formData, difficulty: value})}
                  >
                    <SelectTrigger id="program-difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="program-tags">Tags (comma-separated)</Label>
                <Input
                  id="program-tags"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="strength, cardio, beginner"
                />
              </div>

              {/* Program Schedule Preview */}
              <div>
                <Label className="text-lg font-semibold">Program Schedule</Label>
                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-sm mb-4">
                    Program schedule will be created after saving. You can edit the detailed schedule later.
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="bg-gray-700/30 rounded-lg p-3 text-center">
                        <div className="text-white text-sm font-medium">Day {i + 1}</div>
                        <div className="text-gray-500 text-xs">No workouts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Create Program
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Program Modal */}
      {showAssignModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4">Assign Program: {selectedProgram.title}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Subscription Tiers</label>
                <div className="space-y-2">
                  {['free', 'foundations', 'advanced', 'custom'].map(tier => (
                    <label key={tier} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTiers.includes(tier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTiers([...selectedTiers, tier]);
                          } else {
                            setSelectedTiers(selectedTiers.filter(t => t !== tier));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-white capitalize">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Specific Users</label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-white">{user.name} ({user.email})</span>
                      <span className="text-gray-400 text-sm">- {user.subscription.plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <button
                  onClick={handleAssignProgram}
                  disabled={assigning || (selectedTiers.length === 0 && selectedUsers.length === 0)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign Program'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedProgram(null);
                    setSelectedUsers([]);
                    setSelectedTiers([]);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Program Editor Modal */}
      {showEditModal && selectedProgram && (
        <ProgramEditor
          program={selectedProgram}
          onSave={handleProgramSave}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedProgram(null);
          }}
        />
      )}
    </div>
  );
}
