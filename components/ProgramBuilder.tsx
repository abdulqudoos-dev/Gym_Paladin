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
  exercises: any[];
  stats?: {
    completions: number;
    averageRating: number;
    totalRatings: number;
  };
}

interface ProgramWorkout {
  workoutId: string;
  week: number;
  day: number;
  order: number;
}

interface ProgramDay {
  week: number;
  day: number;
  workouts: ProgramWorkout[];
}

interface Program {
  _id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  assignedTo?: {
    tiers: string[];
    users: string[];
  };
  tags: string[];
  status: string;
  createdBy: string;
  days: ProgramDay[];
  stats?: {
    completions: number;
    averageRating: number;
    totalRatings: number;
  };
}

interface ProgramBuilderProps {
  onSaveProgram: (program: Partial<Program>) => void;
  editingProgram?: Program | null;
  availableWorkouts?: Workout[];
  onClose: () => void;
}

export default function ProgramBuilder({ onSaveProgram, editingProgram, availableWorkouts, onClose }: ProgramBuilderProps) {
  const [programData, setProgramData] = useState({
    title: editingProgram?.title || '',
    description: editingProgram?.description || '',
    duration: editingProgram?.duration || 8,
    difficulty: editingProgram?.difficulty || 'Beginner',
    assignedTo: editingProgram?.assignedTo || { tiers: [], users: [] },
    tags: editingProgram?.tags?.join(', ') || '',
    status: editingProgram?.status || 'draft',
    createdBy: editingProgram?.createdBy || 'admin',
    days: editingProgram?.days || []
  });

  const [localAvailableWorkouts, setLocalAvailableWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProgramBuilder init - availableWorkouts:', availableWorkouts, 'editingProgram:', editingProgram?._id);
    if (availableWorkouts && availableWorkouts.length > 0) {
      setLocalAvailableWorkouts(availableWorkouts);
      setLoading(false);
    } else {
      fetchWorkouts();
    }

    // When editing, normalize incoming program structure to use workoutId as string
    if (editingProgram) {
      const normalizedDays = (editingProgram.days || []).map((d) => ({
        week: d.week,
        day: d.day,
        workouts: (d.workouts || []).map((w: any, idx: number) => ({
          workoutId: typeof w.workoutId === 'string' ? w.workoutId : (w.workoutId?._id || ''),
          week: d.week,
          day: d.day,
          order: w.order ?? idx + 1,
        })),
      }));

      setProgramData((prev) => ({
        ...prev,
        title: editingProgram.title || prev.title,
        description: editingProgram.description || prev.description,
        duration: editingProgram.duration || prev.duration,
        difficulty: editingProgram.difficulty || prev.difficulty,
        assignedTo: editingProgram.assignedTo || prev.assignedTo,
        tags: (editingProgram.tags || []).join(', '),
        status: editingProgram.status || prev.status,
        createdBy: editingProgram.createdBy || prev.createdBy,
        days: normalizedDays.length > 0 ? normalizedDays : prev.days,
      }));
    }

    initializeDays();
  }, [availableWorkouts, editingProgram]);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched workouts data:', data);
      // Handle API response structure
      const workouts = Array.isArray(data) ? data : (data.workouts || []);
      console.log('Processed workouts:', workouts.length);
      setLocalAvailableWorkouts(workouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setLocalAvailableWorkouts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const initializeDays = () => {
    if (programData.days.length === 0) {
      const days = [];
      for (let week = 1; week <= Math.ceil(programData.duration / 7); week++) {
        for (let day = 1; day <= Math.min(7, programData.duration - (week - 1) * 7); day++) {
          days.push({ week, day, workouts: [] });
        }
      }
      setProgramData({ ...programData, days });
    }
  };

  const updateDuration = (newDuration: number) => {
    const days = [];
    for (let week = 1; week <= Math.ceil(newDuration / 7); week++) {
      for (let day = 1; day <= Math.min(7, newDuration - (week - 1) * 7); day++) {
        const existingDay = programData.days.find(d => d.week === week && d.day === day);
        days.push({ 
          week, 
          day, 
          workouts: existingDay?.workouts || []
        });
      }
    }
    setProgramData({ ...programData, duration: newDuration, days });
  };

  const addWorkoutToDay = (week: number, day: number, workoutId: string) => {
    const updatedDays = programData.days.map(dayData => {
      if (dayData.week === week && dayData.day === day) {
        const newWorkout = {
          workoutId,
          week,
          day,
          order: dayData.workouts.length + 1
        };
        return { ...dayData, workouts: [...dayData.workouts, newWorkout] };
      }
      return dayData;
    });
    setProgramData({ ...programData, days: updatedDays });
  };

  const removeWorkoutFromDay = (week: number, day: number, workoutId: string) => {
    const updatedDays = programData.days.map(dayData => {
      if (dayData.week === week && dayData.day === day) {
        return { 
          ...dayData, 
          workouts: dayData.workouts.filter(w => w.workoutId !== workoutId)
        };
      }
      return dayData;
    });
    setProgramData({ ...programData, days: updatedDays });
  };

  const getWorkoutById = (workoutId: string) => {
    return localAvailableWorkouts.find(w => w._id === workoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ProgramBuilder - programData before sending:', JSON.stringify(programData, null, 2));
    onSaveProgram({
      ...programData,
      tags: programData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
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
      {/* Program Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Program Title</label>
            <input
              type="text"
              value={programData.title}
              onChange={(e) => setProgramData({ ...programData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Duration (days)</label>
            <input
              type="number"
              value={programData.duration}
              onChange={(e) => updateDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
              min="1"
              max="365"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Difficulty</label>
            <select
              value={programData.difficulty}
              onChange={(e) => setProgramData({ ...programData, difficulty: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Status</label>
            <select
              value={programData.status}
              onChange={(e) => setProgramData({ ...programData, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">Description</label>
          <textarea
            value={programData.description}
            onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm mb-2">Tags (comma separated)</label>
          <input
            type="text"
            value={programData.tags}
            onChange={(e) => setProgramData({ ...programData, tags: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500"
            placeholder="strength, 8-week, beginner"
          />
        </div>
      </form>

      {/* Available Workouts */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Available Workouts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
          {localAvailableWorkouts.map((workout) => (
            <div
              key={workout._id}
              className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">{workout.title}</h4>
                  <p className="text-gray-400 text-xs">{workout.difficulty}</p>
                  <p className="text-gray-500 text-xs">{workout.exercises.length} exercises</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Program Schedule */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Program Schedule</h3>
        
        <div className="space-y-4">
          {Array.from({ length: Math.ceil(programData.duration / 7) }, (_, weekIndex) => (
            <div key={weekIndex} className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Week {weekIndex + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: Math.min(7, programData.duration - weekIndex * 7) }, (_, dayIndex) => {
                  const dayNumber = weekIndex * 7 + dayIndex + 1;
                  const dayData = programData.days.find(d => d.week === weekIndex + 1 && d.day === dayIndex + 1);
                  
                  return (
                    <div key={dayNumber} className="bg-gray-600 rounded-lg p-3">
                      <h5 className="text-white font-medium mb-2">Day {dayNumber}</h5>
                      
                      {/* Day's Workouts */}
                      <div className="space-y-2 mb-3">
                        {dayData?.workouts && dayData.workouts.length > 0 ? (
                          dayData.workouts.map((workout, workoutIndex) => {
                            const workoutData = getWorkoutById(workout.workoutId);
                            return workoutData ? (
                              <div key={workoutIndex} className="bg-gray-500 rounded p-2 flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{workoutData.title}</p>
                                  <p className="text-gray-300 text-xs">{workoutData.exercises.length} exercises</p>
                                </div>
                                <button
                                  onClick={() => removeWorkoutFromDay(weekIndex + 1, dayIndex + 1, workout.workoutId)}
                                  className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors ml-2"
                                  title="Remove workout"
                                >
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-gray-400 text-xs">No workouts</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Add Workout Dropdown */}
                      <div className="mt-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addWorkoutToDay(weekIndex + 1, dayIndex + 1, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-2 py-1 bg-gray-500 border border-gray-400 rounded text-white text-xs focus:border-red-500"
                          defaultValue=""
                        >
                          <option value="">Add workout...</option>
                          {localAvailableWorkouts.map((workout) => (
                            <option key={workout._id} value={workout._id}>
                              {workout.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
          disabled={!programData.title || !programData.description}
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {editingProgram ? 'Update Program' : 'Create Program'}
        </button>
      </div>
    </div>
  );
}
