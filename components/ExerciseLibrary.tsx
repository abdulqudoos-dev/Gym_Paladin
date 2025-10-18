'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  description: string;
  videoUrls?: string[];
  imageUrls?: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  tags: string[];
  isCustom: boolean;
  createdBy: string;
}

interface ExerciseLibraryProps {
  onAddExercise: (exercise: Exercise) => void;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  editingExercise?: Exercise | null;
}

export default function ExerciseLibrary({ onAddExercise, onEditExercise, onDeleteExercise, editingExercise }: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localEditingExercise, setLocalEditingExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body', 'strength', 'sports'];

  useEffect(() => {
    fetchExercises();
    if (editingExercise) {
      setLocalEditingExercise(editingExercise);
    }
  }, [editingExercise]);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Handle API response structure
      setExercises(Array.isArray(data) ? data : (data.exercises || []));
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercises([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = (exercises || []).filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateExercise = async (exerciseData: Partial<Exercise>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });
      
      if (response.ok) {
        const newExercise = await response.json();
        setExercises([...exercises, newExercise]);
        setShowCreateModal(false);
      } else {
        const errorData = await response.json();
        console.error('Error creating exercise:', errorData);
        alert('Failed to create exercise: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Failed to create exercise: ' + error.message);
    }
  };

  const handleUpdateExercise = async (exerciseData: Partial<Exercise>) => {
    if (!localEditingExercise) return;
    
    console.log('Updating exercise with data:', JSON.stringify(exerciseData, null, 2));
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises/${localEditingExercise._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });
      
      if (response.ok) {
        const updatedExercise = await response.json();
        setExercises(exercises.map(ex => ex._id === localEditingExercise._id ? updatedExercise : ex));
        setLocalEditingExercise(null);
      } else {
        const errorData = await response.json();
        console.error('Error updating exercise:', errorData);
        console.error('Validation errors:', errorData.errors);
        alert('Failed to update exercise: ' + (errorData.message || 'Unknown error') + '\nErrors: ' + JSON.stringify(errorData.errors, null, 2));
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
      alert('Failed to update exercise: ' + error.message);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setExercises(exercises.filter(ex => ex._id !== id));
      } else {
        const errorData = await response.json();
        console.error('Error deleting exercise:', errorData);
        alert('Failed to delete exercise: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Failed to delete exercise: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          <svg className="absolute right-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Create Exercise Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Exercise</span>
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredExercises.map((exercise) => (
            <motion.div
              key={exercise._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-white font-semibold">{exercise.name}</h3>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {exercise.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{exercise.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{exercise.defaultSets} sets</span>
                    <span>{exercise.defaultReps} reps</span>
                    <span>{exercise.defaultRest}s rest</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAddExercise(exercise)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    title="Add to workout"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLocalEditingExercise(exercise)}
                    className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                    title="Edit exercise"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(exercise._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Delete exercise"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Exercise Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <ExerciseModal
            exercise={null}
            onSave={handleCreateExercise}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Exercise Modal */}
      <AnimatePresence>
        {localEditingExercise && (
          <ExerciseModal
            exercise={localEditingExercise}
            onSave={handleUpdateExercise}
            onClose={() => setLocalEditingExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Exercise Modal Component
function ExerciseModal({ exercise, onSave, onClose }: { exercise: Exercise | null, onSave: (data: Partial<Exercise>) => void, onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    category: exercise?.category || 'chest',
    description: exercise?.description || '',
    videoUrls: exercise?.videoUrls || [],
    imageUrls: exercise?.imageUrls || [],
    defaultSets: exercise?.defaultSets || 3,
    defaultReps: exercise?.defaultReps || '10-12',
    defaultRest: exercise?.defaultRest || 60,
    tags: exercise?.tags?.join(', ') || '',
    isCustom: exercise?.isCustom ?? true
  });

  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<{ image?: string; video?: string }>({});

  // Reset form when exercise prop changes (for create vs edit mode)
  useEffect(() => {
    setFormData({
      name: exercise?.name || '',
      category: exercise?.category || 'chest',
      description: exercise?.description || '',
      videoUrls: exercise?.videoUrls || [],
      imageUrls: exercise?.imageUrls || [],
      defaultSets: exercise?.defaultSets || 3,
      defaultReps: exercise?.defaultReps || '10-12',
      defaultRest: exercise?.defaultRest || 60,
      tags: exercise?.tags?.join(', ') || '',
      isCustom: exercise?.isCustom ?? true
    });
  }, [exercise]);

  const handleFileUpload = async (file: File, kind: 'image' | 'video') => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/uploads`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (kind === 'image') {
        setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, data.url] }));
        setLastUploaded(prev => ({ ...prev, image: data.url }));
      } else {
        setFormData(prev => ({ ...prev, videoUrls: [...prev.videoUrls, data.url] }));
        setLastUploaded(prev => ({ ...prev, video: data.url }));
      }
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      imageUrls: (formData.imageUrls || (lastUploaded.image ? [lastUploaded.image] : [])).filter(Boolean),
      videoUrls: (formData.videoUrls || (lastUploaded.video ? [lastUploaded.video] : [])).filter(Boolean),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      // Convert category to lowercase to match backend schema
      category: formData.category.toLowerCase(),
      // Ensure isCustom is a boolean
      isCustom: Boolean(formData.isCustom)
    };
    
    console.log('Form submit data:', submitData);
    onSave(submitData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-xl font-bold mb-4">
          {exercise ? 'Edit Exercise' : 'Create Exercise'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            >
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
              <option value="legs">Legs</option>
              <option value="core">Core</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="full-body">Full Body</option>
              <option value="sports">Sports</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Video URLs (one per line)</label>
              <textarea
                value={(formData.videoUrls || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, videoUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 resize-y"
                placeholder="https://...\nhttps://..."
                rows={4}
              />
              <div className="mt-2">
                <label className="block text-gray-400 text-xs mb-1">or upload a video</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'video'); }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-white file:bg-red-600 hover:file:bg-red-500"
                  disabled={uploading}
                />
                {(formData.videoUrls || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(formData.videoUrls || []).map((v, idx) => (
                      <div key={idx} className="flex items-center max-w-full bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
                        <svg className="w-3 h-3 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"/></svg>
                        <span className="text-xs text-gray-300 truncate max-w-[220px]">{v}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = [...(formData.videoUrls || [])];
                            updated.splice(idx, 1);
                            setFormData({ ...formData, videoUrls: updated });
                            if (exercise?._id) {
                              try {
                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises/${exercise._id}/media`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: v, kind: 'video' })
                                });
                              } catch {}
                            }
                          }}
                          className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded"
                          title="Remove video"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          <div>
              <label className="block text-gray-300 text-sm mb-2">Image URLs (one per line)</label>
              <textarea
                value={(formData.imageUrls || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 resize-y"
                placeholder="https://...\nhttps://..."
                rows={4}
              />
              <div className="mt-2">
                <label className="block text-gray-400 text-xs mb-1">or upload an image</label>
            <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:px-3 file:py-1.5 file:rounded file:border-0 file:text-white file:bg-red-600 hover:file:bg-red-500"
                  disabled={uploading}
                />
                {(formData.imageUrls || []).length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(formData.imageUrls || []).map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} className="w-full h-24 object-cover rounded border border-gray-600" />
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = [...(formData.imageUrls || [])];
                            updated.splice(idx, 1);
                            setFormData({ ...formData, imageUrls: updated });
                            if (exercise?._id) {
                              try {
                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises/${exercise._id}/media`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: img, kind: 'image' })
                                });
                              } catch {}
                            }
                          }}
                          className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center bg-red-600 text-white rounded-full w-6 h-6 text-xs shadow"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Sets</label>
              <input
                type="number"
                value={formData.defaultSets}
                onChange={(e) => setFormData({ ...formData, defaultSets: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Reps</label>
              <input
                type="text"
                value={formData.defaultReps}
                onChange={(e) => setFormData({ ...formData, defaultReps: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
                placeholder="10-12"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Rest (s)</label>
              <input
                type="number"
                value={formData.defaultRest}
                onChange={(e) => setFormData({ ...formData, defaultRest: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
                min="0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              placeholder="chest, shoulders, triceps"
            />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isCustom}
                  onChange={(e) => setFormData({ ...formData, isCustom: e.target.checked })}
                  className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-sm">Custom Exercise</span>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              {exercise ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}