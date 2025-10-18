'use client';

import { useState, useEffect } from 'react';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  tags: string[];
  isCustom: boolean;
  createdBy: string;
}

interface WorkoutExercise {
  _id?: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  restTime: number;
  setScheme?: Array<{ percent?: number; reps?: number; restTime?: number }>;
  maxType?: '1RM' | '3RM' | '5RM' | '10RM' | 'RM';
  notes: string;
  tempo?: string;
  order: number;
}

interface Workout {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  duration?: number;
  calories?: number;
  assignedTo?: {
    tiers: string[];
    users: string[];
  };
  tags: string[];
  status: string;
  createdBy: string;
  exercises: WorkoutExercise[];
  stats?: {
    completions: number;
    averageRating: number;
    totalRatings: number;
  };
}

interface WorkoutBuilderProps {
  onSaveWorkout: (workout: Partial<Workout>) => void;
  editingWorkout?: Workout | null;
  availableExercises?: Exercise[];
  onClose: () => void;
}

export default function WorkoutBuilder({ onSaveWorkout, editingWorkout, availableExercises, onClose }: WorkoutBuilderProps) {
  const [workoutData, setWorkoutData] = useState({
    title: editingWorkout?.title || '',
    description: editingWorkout?.description || '',
    difficulty: editingWorkout?.difficulty || 'Beginner',
    duration: editingWorkout?.duration || 30,
    calories: editingWorkout?.calories || 0,
    assignedTo: editingWorkout?.assignedTo || { tiers: [], users: [] },
    tags: editingWorkout?.tags?.join(', ') || '',
    status: editingWorkout?.status || 'draft',
    exercises: editingWorkout?.exercises || []
  });

  const [localAvailableExercises, setLocalAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('WorkoutBuilder useEffect - availableExercises:', availableExercises);
    if (availableExercises && availableExercises.length > 0) {
      console.log('Using provided exercises:', availableExercises.length);
      setLocalAvailableExercises(availableExercises);
      setLoading(false);
    } else {
      console.log('Fetching exercises from API');
      fetchExercises();
    }
  }, [availableExercises]);

  // Initialize setScheme for existing exercises when editing
  useEffect(() => {
    if (editingWorkout && editingWorkout.exercises) {
      console.log('Initializing setScheme for editing workout:', editingWorkout.exercises);
      const exercisesWithSetScheme = editingWorkout.exercises.map(exercise => ({
        ...exercise,
        setScheme: exercise.setScheme || Array.from({ length: exercise.sets || 1 }).map(() => ({ 
          percent: undefined, 
          reps: undefined, 
          restTime: undefined 
        })),
        maxType: exercise.maxType || '1RM'
      }));
      
      setWorkoutData(prev => ({
        ...prev,
        exercises: exercisesWithSetScheme
      }));
    }
  }, [editingWorkout]);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Handle API response structure
      const exercises = Array.isArray(data) ? data : (data.exercises || []);
      setLocalAvailableExercises(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setLocalAvailableExercises([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise._id,
      exercise: exercise,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      restTime: exercise.defaultRest,
      setScheme: Array.from({ length: exercise.defaultSets }).map(() => ({ percent: undefined, reps: undefined, restTime: undefined })),
      maxType: '1RM',
      notes: '',
      tempo: '',
      order: workoutData.exercises.length + 1
    };
    
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, newWorkoutExercise]
    });
  };

  const removeExerciseFromWorkout = (index: number) => {
    setWorkoutData({
      ...workoutData,
      exercises: workoutData.exercises.filter((_, i) => i !== index)
    });
  };

  const updateExerciseInWorkout = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updatedExercises = [...workoutData.exercises];
    const current = { ...updatedExercises[index] } as WorkoutExercise;
    (current as any)[field] = value;

    // Keep setScheme length in sync with sets
    if (field === 'sets') {
      const newCount = Math.max(1, parseInt(String(value)) || 1);
      const scheme = Array.isArray(current.setScheme) ? [...current.setScheme] : [];
      if (scheme.length < newCount) {
        const toAdd = newCount - scheme.length;
        for (let i = 0; i < toAdd; i++) {
          scheme.push({ percent: undefined, reps: undefined, restTime: undefined });
        }
      } else if (scheme.length > newCount) {
        scheme.length = newCount;
      }
      current.setScheme = scheme;
    }

    updatedExercises[index] = current;
    setWorkoutData({ ...workoutData, exercises: updatedExercises });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWorkout({
      ...workoutData,
      tags: workoutData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workout Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Workout Title</label>
            <input
              type="text"
              value={workoutData.title}
              onChange={(e) => setWorkoutData({ ...workoutData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Difficulty</label>
            <select
              value={workoutData.difficulty}
              onChange={(e) => setWorkoutData({ ...workoutData, difficulty: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Status</label>
            <select
              value={workoutData.status}
              onChange={(e) => setWorkoutData({ ...workoutData, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={workoutData.duration}
              onChange={(e) => setWorkoutData({ ...workoutData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              min="1"
              max="300"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Estimated Calories</label>
            <input
              type="number"
              value={workoutData.calories}
              onChange={(e) => setWorkoutData({ ...workoutData, calories: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              min="0"
              max="2000"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">Description</label>
          <textarea
            value={workoutData.description}
            onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">Tags (comma separated)</label>
          <input
            type="text"
            value={workoutData.tags}
            onChange={(e) => setWorkoutData({ ...workoutData, tags: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            placeholder="strength, upper-body, beginner"
          />
        </div>
      </form>

      {/* Exercise Library */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Add Exercises</h3>
        <div className="mb-3">
          <input
            type="text"
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              if (!availableExercises || availableExercises.length === 0) return;
              const base = availableExercises;
              const filtered = base.filter(ex => ex.name.toLowerCase().includes(q) || ex.category.toLowerCase().includes(q));
              setLocalAvailableExercises(filtered);
            }}
            placeholder="Search exercises..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
          {localAvailableExercises.map((exercise) => (
            <div
              key={exercise._id}
              className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => addExerciseToWorkout(exercise)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">{exercise.name}</h4>
                  <p className="text-gray-400 text-xs">{exercise.category}</p>
                </div>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout Exercises */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Workout Exercises ({workoutData.exercises.length})</h3>
        
        {workoutData.exercises.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No exercises added yet. Click on exercises above to add them.</p>
        ) : (
          <div className="space-y-3">
            {workoutData.exercises.map((workoutExercise, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{workoutExercise.exercise.name}</h4>
                    <p className="text-gray-400 text-sm">{workoutExercise.exercise.category}</p>
                  </div>
                  <button
                    onClick={() => removeExerciseFromWorkout(index)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Sets</label>
                    <input
                      type="number"
                      value={workoutExercise.sets}
                      onChange={(e) => updateExerciseInWorkout(index, 'sets', parseInt(e.target.value))}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                      min="1"
                    />
                  </div>
                  {(!workoutExercise.setScheme || workoutExercise.setScheme.length === 0) && (
                    <>
                      <div>
                        <label className="block text-gray-300 text-xs mb-1">Reps</label>
                        <input
                          type="text"
                          value={workoutExercise.reps}
                          onChange={(e) => updateExerciseInWorkout(index, 'reps', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                          placeholder="10-12"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-xs mb-1">Rest (s)</label>
                        <input
                          type="number"
                          value={workoutExercise.restTime}
                          onChange={(e) => updateExerciseInWorkout(index, 'restTime', parseInt(e.target.value))}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                          min="0"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Tempo</label>
                    <input
                      type="text"
                      value={workoutExercise.tempo || ''}
                      onChange={(e) => updateExerciseInWorkout(index, 'tempo', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                      placeholder="2-1-2"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Notes</label>
                    <input
                      type="text"
                      value={workoutExercise.notes}
                      onChange={(e) => updateExerciseInWorkout(index, 'notes', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                      placeholder="Optional notes"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-1">Max Type</label>
                    <select
                      value={workoutExercise.maxType || '1RM'}
                      onChange={(e) => updateExerciseInWorkout(index, 'maxType', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-red-500"
                    >
                      <option value="1RM">1RM</option>
                      <option value="3RM">3RM</option>
                      <option value="5RM">5RM</option>
                      <option value="10RM">10RM</option>
                      <option value="RM">RM</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Per-Set Prescription</label>
                    <span className="text-xs text-gray-400">Rows match number of sets</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(workoutExercise.setScheme || []).map((row, rIdx) => (
                      <div key={rIdx} className="col-span-3 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <label className="block text-gray-400 text-xs mb-1">Set {rIdx + 1} %</label>
                          <input
                            type="text"
                            value={row.percent ?? ''}
                            onChange={(e) => {
                              const updated = [...workoutData.exercises];
                              const scheme = [...(updated[index].setScheme || [])];
                              const raw = e.target.value.trim();
                              const val = raw === '' ? undefined : Number(raw);
                              scheme[rIdx] = { ...scheme[rIdx], percent: isNaN(val as number) ? undefined : (val as number) };
                              updated[index] = { ...updated[index], setScheme: scheme };
                              setWorkoutData({ ...workoutData, exercises: updated });
                            }}
                            placeholder="60 or 0.6"
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:border-red-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-gray-400 text-xs mb-1">Reps</label>
                          <input
                            type="number"
                            value={row.reps ?? ''}
                            onChange={(e) => {
                              const updated = [...workoutData.exercises];
                              const scheme = [...(updated[index].setScheme || [])];
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                              scheme[rIdx] = { ...scheme[rIdx], reps: val };
                              updated[index] = { ...updated[index], setScheme: scheme };
                              setWorkoutData({ ...workoutData, exercises: updated });
                            }}
                            placeholder="8"
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:border-red-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-gray-400 text-xs mb-1">Rest (s)</label>
                          <input
                            type="number"
                            value={row.restTime ?? ''}
                            onChange={(e) => {
                              const updated = [...workoutData.exercises];
                              const scheme = [...(updated[index].setScheme || [])];
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                              scheme[rIdx] = { ...scheme[rIdx], restTime: val };
                              updated[index] = { ...updated[index], setScheme: scheme };
                              setWorkoutData({ ...workoutData, exercises: updated });
                            }}
                            placeholder="90"
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:border-red-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-gray-400 text-xs mb-1">Calculated Weight</label>
                          <div className="w-full px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs">
                            {row.percent ? `~${Math.round((row.percent > 1 ? row.percent / 100 : row.percent) * 200)}lbs` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add/Remove Set Scheme Rows */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...workoutData.exercises];
                        const scheme = [...(updated[index].setScheme || [])];
                        scheme.push({ percent: undefined, reps: undefined, restTime: undefined });
                        updated[index] = { ...updated[index], setScheme: scheme };
                        setWorkoutData({ ...workoutData, exercises: updated });
                      }}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                    >
                      + Add Set
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...workoutData.exercises];
                        const scheme = [...(updated[index].setScheme || [])];
                        if (scheme.length > 0) {
                          scheme.pop();
                          updated[index] = { ...updated[index], setScheme: scheme };
                          setWorkoutData({ ...workoutData, exercises: updated });
                        }
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      - Remove Set
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...workoutData.exercises];
                        const scheme = Array.from({ length: workoutExercise.sets }).map(() => ({ 
                          percent: undefined, 
                          reps: undefined, 
                          restTime: undefined 
                        }));
                        updated[index] = { ...updated[index], setScheme: scheme };
                        setWorkoutData({ ...workoutData, exercises: updated });
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      Reset to Match Sets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!workoutData.title || !workoutData.description || workoutData.exercises.length === 0}
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {editingWorkout ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </div>
  );
}