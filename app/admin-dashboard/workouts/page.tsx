'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Workout {
  _id: string;
  title: string;
  description: string;
  exercises: any[];
  duration: number;
  difficulty: string;
  category: string;
  createdAt: string;
}

export default function AdminWorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Form state for creating/editing workouts
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    difficulty: 'Beginner',
    category: 'Strength',
    exercises: []
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`);
      
      if (response.ok) {
        const data = await response.json();
        setWorkouts(Array.isArray(data) ? data : data.workouts || []);
      } else {
        setError('Failed to fetch workouts');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchWorkouts();
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          duration: 30,
          difficulty: 'Beginner',
          category: 'Strength',
          exercises: []
        });
      }
    } catch (error) {
      setError('Failed to create workout');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts/${workoutId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchWorkouts();
      }
    } catch (error) {
      setError('Failed to delete workout');
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Strength': return 'bg-blue-500/20 text-blue-400';
      case 'Cardio': return 'bg-red-500/20 text-red-400';
      case 'Flexibility': return 'bg-purple-500/20 text-purple-400';
      case 'HIIT': return 'bg-orange-500/20 text-orange-400';
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
            <h1 className="text-3xl font-bold text-white mb-2">Workout Management</h1>
            <p className="text-gray-400">Create and manage workout routines for your programs</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
          >
            Create New Workout
          </button>
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

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {workouts.map((workout, index) => (
            <motion.div
              key={workout._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-md rounded-xl p-6 border border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{workout.title}</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(workout.difficulty)}`}>
                    {workout.difficulty}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(workout.category)}`}>
                    {workout.category}
                  </span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{workout.description}</p>

              <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                <span>{workout.duration} minutes</span>
                <span>{workout.exercises?.length || 0} exercises</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingWorkout(workout)}
                  className="flex-1 bg-primary-500/20 border border-primary-500/50 text-primary-400 py-2 px-3 rounded-lg hover:bg-primary-500/30 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteWorkout(workout._id)}
                  className="flex-1 bg-red-500/20 border border-red-500/50 text-red-400 py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No workouts found</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
            >
              Create Your First Workout
            </button>
          </div>
        )}
      </div>

      {/* Create Workout Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Workout</h2>
            
            <form onSubmit={handleCreateWorkout} className="space-y-4">
              <div>
                <Label htmlFor="workout-title">Title</Label>
                <Input
                  id="workout-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Workout title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="workout-description">Description</Label>
                <Textarea
                  id="workout-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Workout description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workout-duration">Duration (min)</Label>
                  <Input
                    id="workout-duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="5"
                    max="180"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="workout-difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({...formData, difficulty: value})}
                  >
                    <SelectTrigger id="workout-difficulty">
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
                <Label htmlFor="workout-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger id="workout-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Flexibility">Flexibility</SelectItem>
                    <SelectItem value="HIIT">HIIT</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Create Workout
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
    </div>
  );
}
