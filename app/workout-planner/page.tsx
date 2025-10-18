'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ExerciseLibrary from '@/components/ExerciseLibrary';
import WorkoutBuilder from '@/components/WorkoutBuilder';
import ProgramBuilder from '@/components/ProgramBuilder';

// Helper function to convert YouTube URLs to embed format
function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // If it's already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // If it's not a YouTube URL, return empty string
  return '';
}

// Helper function to extract actual image URL from various sources
function extractImageUrl(url: string): string {
  if (!url) return '';
  
  // Handle Bing search URLs - extract mediaurl parameter
  if (url.includes('bing.com/images/search')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const mediaUrl = urlParams.get('mediaurl');
    if (mediaUrl) {
      return decodeURIComponent(mediaUrl);
    }
  }
  
  // Handle Google Images URLs - extract imgurl parameter
  if (url.includes('google.com/search') && url.includes('tbm=isch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const imgUrl = urlParams.get('imgurl');
    if (imgUrl) {
      return decodeURIComponent(imgUrl);
    }
  }
  
  // Handle direct image URLs
  return url;
}

// Resolve local server-relative URLs to absolute URLs
function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Assume backend runs on localhost:5000 in dev
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Helper function to test if an image URL is valid
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Extract the actual image URL first
  const actualUrl = extractImageUrl(url);
  if (!actualUrl) return false;
  
  // Allow server-relative paths (e.g., /uploads/filename.jpg)
  if (actualUrl.startsWith('/')) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => actualUrl.toLowerCase().includes(ext));
  }
  // Check if it's a valid absolute URL format
  try { new URL(actualUrl); } catch { return false; }
  
  // Check if it's an image URL
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => actualUrl.toLowerCase().includes(ext));
  
  // Check if it's from a common image hosting service
  const imageHosts = ['imgur.com', 'i.imgur.com', 'unsplash.com', 'images.unsplash.com', 'pixabay.com', 'pexels.com', 'liftmanual.com'];
  const isFromImageHost = imageHosts.some(host => actualUrl.includes(host));
  
  return hasImageExtension || isFromImageHost;
}

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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export default function WorkoutPlannerPage() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dragFeedback, setDragFeedback] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [exerciseMediaOpen, setExerciseMediaOpen] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const tabs = [
    { id: 'exercises', label: 'Exercises', icon: 'exercise' },
    { id: 'workouts', label: 'Workouts', icon: 'workout' },
    { id: 'programs', label: 'Programs', icon: 'program' }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProgramDropdown) {
        const target = event.target as Element;
        if (!target.closest('.program-dropdown')) {
          setShowProgramDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProgramDropdown]);

  // Track viewport for responsive drawers
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching data from APIs...');
      
      const [exercisesRes, workoutsRes, programsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs`)
      ]);

      console.log('📡 API Responses:', {
        exercises: exercisesRes.status,
        workouts: workoutsRes.status,
        programs: programsRes.status
      });

      const [exercisesData, workoutsData, programsData] = await Promise.all([
        exercisesRes.json(),
        workoutsRes.json(),
        programsRes.json()
      ]);

      console.log('📊 Data received:', {
        exercises: exercisesData.length || 0,
        workouts: workoutsData.workouts?.length || workoutsData.length || 0,
        programs: programsData.length || 0
      });

      // Debug workout data structure (only in development)
      if (process.env.NODE_ENV === 'development' && workoutsData.workouts && workoutsData.workouts.length > 0) {
        console.log('🔍 Sample workout data:', workoutsData.workouts[0]);
        if (workoutsData.workouts[0].exercises) {
          console.log('🔍 Sample workout exercises:', workoutsData.workouts[0].exercises[0]);
        }
      }

      // Handle different response structures
      setExercises(Array.isArray(exercisesData) ? exercisesData : (exercisesData.exercises || []));
      
      // Process workout data to map exerciseId to exercise field
      const rawWorkouts = Array.isArray(workoutsData) ? workoutsData : (workoutsData.workouts || []);
      const processedWorkouts = rawWorkouts.map(workout => ({
        ...workout,
        exercises: workout.exercises?.map(ex => ({
          ...ex,
          exercise: ex.exerciseId // Map populated exerciseId to exercise field
        })) || []
      }));
      setWorkouts(processedWorkouts);
      
      setPrograms(Array.isArray(programsData) ? programsData : (programsData.programs || []));
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Set empty arrays on error
      setExercises([]);
      setWorkouts([]);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setShowCreateModal(true);
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowCreateModal(true);
  };

  const handleSaveExercise = async (exerciseData: Partial<Exercise>) => {
    try {
      const url = editingItem ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises/${editingItem._id}` : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/exercises`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exerciseData)
      });

      if (response.ok) {
        const savedExercise = await response.json();
        if (editingItem) {
          setExercises(exercises.map(ex => ex._id === editingItem._id ? savedExercise : ex));
        } else {
          setExercises([...exercises, savedExercise]);
        }
        setShowCreateModal(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        console.error('Error saving exercise:', errorData);
        alert('Failed to save exercise: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Failed to save exercise: ' + error.message);
    }
  };

  const handleSaveWorkout = async (workoutData: Partial<Workout>) => {
    try {
      // Clean the data by removing temporary _id fields from exercises and add required fields
      const cleanedWorkoutData = {
        ...workoutData,
        createdBy: 'admin', // In real app, get from auth context
        exercises: workoutData.exercises?.map(exerciseItem => {
          const { _id, exercise, ...cleanExercise } = exerciseItem;
          return cleanExercise;
        }) || []
      };
      
      console.log('Sending workout data:', JSON.stringify(cleanedWorkoutData, null, 2));
      const url = editingItem ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts/${editingItem._id}` : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedWorkoutData)
      });

      if (response.ok) {
        const responseData = await response.json();
        const savedWorkout = responseData.workout || responseData;
        
        // Process the saved workout to map exerciseId to exercise field
        const processedWorkout = {
          ...savedWorkout,
          exercises: savedWorkout.exercises?.map(ex => ({
            ...ex,
            exercise: ex.exerciseId // Map populated exerciseId to exercise field
          })) || []
        };
        
        if (editingItem) {
          setWorkouts(workouts.map(w => w._id === editingItem._id ? processedWorkout : w));
        } else {
          setWorkouts([...workouts, processedWorkout]);
        }
        setShowCreateModal(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        console.error('Error saving workout:', errorData);
        alert('Failed to save workout: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout: ' + error.message);
    }
  };

  const handleSaveProgram = async (programData: Partial<Program>) => {
    try {
      // Add required fields for backend
      const programDataWithDefaults = {
        ...programData,
        createdBy: 'admin' // In real app, get from auth context
      };
      
      console.log('Sending program data:', JSON.stringify(programDataWithDefaults, null, 2));
      const url = editingItem ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs/${editingItem._id}` : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs`;
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programDataWithDefaults)
      });

      if (response.ok) {
        const savedProgram = await response.json();
        if (editingItem) {
          setPrograms(programs.map(p => p._id === editingItem._id ? savedProgram : p));
        } else {
          setPrograms([...programs, savedProgram]);
        }
        setShowCreateModal(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        console.error('Error saving program:', errorData);
        alert('Failed to save program: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Failed to save program: ' + error.message);
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${type}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (type === 'exercises') {
          setExercises(exercises.filter(ex => ex._id !== id));
        } else if (type === 'workouts') {
          setWorkouts(workouts.filter(w => w._id !== id));
        } else if (type === 'programs') {
          setPrograms(programs.filter(p => p._id !== id));
        }
        alert('Item deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Error deleting item:', errorData);
        alert('Failed to delete item: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'exercises':
        return (
          <div className="space-y-6">
            {exercises.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">No Exercises Found</h3>
                <p className="text-gray-400 mb-4">Start by creating your first exercise or refresh to load data.</p>
                <button
                  onClick={handleRefresh}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map((exercise) => (
                  <motion.div
                    key={exercise._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/10"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-xs font-medium text-red-400 uppercase tracking-wide">{exercise.category}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-red-400 transition-colors">{exercise.name}</h3>
                        <p className="text-gray-400 text-sm">{exercise.description}</p>
                      </div>
                      <div className="ml-3">
                        <button
                          onClick={() => setExerciseMediaOpen(prev => ({ ...prev, [exercise._id]: !prev[exercise._id] }))}
                          className="px-2 py-1 rounded-lg text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                          aria-label={exerciseMediaOpen[exercise._id] ? 'Hide media' : 'Show media'}
                        >
                          {exerciseMediaOpen[exercise._id] ? 'Hide media' : 'Show media'}
                        </button>
                      </div>
                    </div>

                    {/* Exercise Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{exercise.defaultSets}</div>
                          <div className="text-gray-400 text-xs">Sets</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{exercise.defaultReps || 'N/A'}</div>
                          <div className="text-gray-400 text-xs">Reps</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{exercise.defaultRest}s</div>
                          <div className="text-gray-400 text-xs">Rest</div>
                        </div>
                      </div>
                    </div>

                    {/* Media Content */}
                    {(
                      exercise.imageUrl || exercise.videoUrl ||
                      (exercise as any).imageUrls?.length || (exercise as any).videoUrls?.length
                    ) && exerciseMediaOpen[exercise._id] && (
                      <div className="mb-4">
                        
                        {/* Image Display */}
                        {(exercise as any).imageUrls?.length ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {(exercise as any).imageUrls.map((img: string, idx: number) => (
                              <img key={idx} src={resolveMediaUrl(extractImageUrl(img))} alt={`${exercise.name} ${idx+1}`} className="w-full h-32 object-cover rounded-lg border border-gray-600 hover:border-red-500/50 transition-colors" />
                            ))}
                          </div>
                        ) : exercise.imageUrl && (
                          <div className="mb-3">
                            {isValidImageUrl(exercise.imageUrl) ? (
                              <img
                                src={resolveMediaUrl(extractImageUrl(exercise.imageUrl))}
                                alt={exercise.name}
                                className="w-full h-32 object-cover rounded-lg border border-gray-600 hover:border-red-500/50 transition-colors"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  // Show fallback
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-full h-32 bg-gray-600 rounded-lg border border-gray-600 flex items-center justify-center';
                                  fallback.innerHTML = `
                                    <div class="text-center">
                                      <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                      <p class="text-gray-400 text-xs">Image failed to load</p>
                                      <a href="${extractImageUrl(exercise.imageUrl)}" target="_blank" rel="noopener noreferrer" class="text-red-400 text-xs hover:text-red-300 underline">Open image</a>
                                    </div>
                                  `;
                                  e.currentTarget.parentNode.replaceChild(fallback, e.currentTarget);
                                }}
                                onLoad={() => {}}
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-600 rounded-lg border border-gray-600 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <p className="text-gray-400 text-xs">Invalid image URL</p>
                                  <p className="text-gray-500 text-xs">{exercise.imageUrl}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Video Display */}
                        {(exercise as any).videoUrls?.length ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(exercise as any).videoUrls.map((v: string, idx: number) => (
                              <div key={idx} className="relative w-full h-32 bg-gray-700 rounded-lg border border-gray-600 hover:border-red-500/50 transition-colors overflow-hidden">
                                {getYouTubeEmbedUrl(v) ? (
                                  <iframe src={getYouTubeEmbedUrl(v)} title={`${exercise.name} video ${idx+1}`} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onError={(e) => { (e.currentTarget as any).style.display = 'none'; }} />
                                ) : (
                                  <video controls className="w-full h-full"><source src={resolveMediaUrl(v)} />Your browser does not support the video tag.</video>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : exercise.videoUrl && (
                          <div className="mb-3">
                            <div className="relative w-full h-32 bg-gray-700 rounded-lg border border-gray-600 hover:border-red-500/50 transition-colors overflow-hidden">
                              {getYouTubeEmbedUrl(exercise.videoUrl) ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(exercise.videoUrl)}
                                  title={exercise.name}
                                  className="w-full h-full"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                ></iframe>
                              ) : (
                                <video controls className="w-full h-full">
                                  <source src={resolveMediaUrl(exercise.videoUrl || '')} />
                                  Your browser does not support the video tag.
                                </video>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {exercise.tags && exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {exercise.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditItem(exercise)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all duration-300 border border-blue-500/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteItem('exercises', exercise._id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 border border-red-500/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {exercise.category || 'General'}
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'workouts':
        return (
          <div className="space-y-6">
            {workouts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">No Workouts Found</h3>
                <p className="text-gray-400 mb-4">Start by creating your first workout or refresh to load data.</p>
                <button
                  onClick={handleRefresh}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workouts.map((workout) => (
                  <Droppable key={workout._id} droppableId={workout._id} type="exercise-to-workout">
                    {(provided, snapshot) => (
                <motion.div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/10 ${
                          snapshot.isDraggingOver 
                            ? 'border-green-500 border-2 border-dashed bg-green-500/5' 
                            : 'border-gray-700 hover:border-red-500/50'
                        }`}
                      >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            workout.difficulty === 'Beginner' ? 'bg-green-500' :
                            workout.difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{workout.difficulty}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-red-400 transition-colors">{workout.title}</h3>
                        <p className="text-gray-400 text-sm">{workout.description}</p>
                      </div>
                    </div>

                    {/* Workout Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{workout.exercises?.length || 0}</div>
                          <div className="text-gray-400 text-xs">Exercises</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {workout.exercises?.reduce((total, ex) => total + (ex.sets || 0), 0) || 0}
                          </div>
                          <div className="text-gray-400 text-xs">Total Sets</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {workout.exercises?.reduce((total, ex) => total + (ex.restTime || 0), 0) || 0}m
                          </div>
                          <div className="text-gray-400 text-xs">Rest Time</div>
                        </div>
                      </div>
                    </div>

                    {/* Exercise Preview */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-400 mb-2">Exercises ({workout.exercises.length}):</div>
                        <div className="flex flex-wrap gap-1">
                          {workout.exercises.map((exercise, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                              {exercise.exercise?.name || 
                               (exercise.exerciseId as any)?.name || 
                               (exercise.exerciseId as string) || 
                               'Unknown Exercise'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {workout.tags && workout.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {workout.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditItem(workout)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all duration-300 border border-blue-500/30"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteItem('workouts', workout._id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 border border-red-500/30"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        </motion.button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(workout.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    {/* Drop Zone Indicator */}
                    {snapshot.isDraggingOver && (
                      <div className="absolute inset-0 bg-green-500/10 rounded-2xl border-2 border-dashed border-green-500 flex items-center justify-center">
                        <div className="text-green-400 text-sm font-medium">Drop exercise here</div>
                  </div>
                    )}
                    
                    {provided.placeholder}
                </motion.div>
                )}
              </Droppable>
              ))}
            </div>
            )}
          </div>
        );

      case 'programs':
        const filteredPrograms = getFilteredPrograms();
        const selectedProgram = getSelectedProgram();
        
        return (
          <div className="space-y-6">
            {programs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">No Programs Found</h3>
                <p className="text-gray-400 mb-4">Start by creating your first program or refresh to load data.</p>
                <button
                  onClick={handleRefresh}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            ) : selectedProgram ? (
              // Detailed view for selected program
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl"
                >
                  {/* Program Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-400 uppercase tracking-wide">{selectedProgram.duration} Days</span>
                        <button
                          onClick={() => handleProgramFilter(null)}
                          className="ml-auto px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                        >
                          Show All Programs
                        </button>
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-3">{selectedProgram.title}</h1>
                      <p className="text-gray-300 text-lg leading-relaxed">{selectedProgram.description}</p>
                    </div>
                  </div>

                  {/* Program Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {selectedProgram.days?.reduce((total, day) => total + day.workouts.length, 0) || 0}
                      </div>
                      <div className="text-gray-400 text-sm">Total Workouts</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{selectedProgram.duration}</div>
                      <div className="text-gray-400 text-sm">Program Duration (Days)</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{selectedProgram.difficulty}</div>
                      <div className="text-gray-400 text-sm">Difficulty Level</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{selectedProgram.status}</div>
                      <div className="text-gray-400 text-sm">Status</div>
                    </div>
                  </div>

                  {/* Program Schedule */}
                  {selectedProgram.days && selectedProgram.days.length > 0 ? (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-white mb-4">Program Schedule</h2>
                      <div className="space-y-4">
                        {Array.from({ length: Math.ceil(selectedProgram.duration / 7) }, (_, weekIndex) => (
                          <div key={weekIndex} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                            <h3 className="text-white font-semibold mb-3">Week {weekIndex + 1}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                              {Array.from({ length: Math.min(7, selectedProgram.duration - weekIndex * 7) }, (_, dayIndex) => {
                                const dayNumber = weekIndex * 7 + dayIndex + 1;
                                const dayData = selectedProgram.days.find(d => d.week === weekIndex + 1 && d.day === dayIndex + 1);
                                
                                return (
                                  <div key={dayNumber} className="bg-gray-600/50 rounded-lg p-3">
                                    <h4 className="text-white font-medium mb-2">Day {dayNumber}</h4>
                                    {dayData && dayData.workouts.length > 0 ? (
                                      <div className="space-y-1">
                                        {dayData.workouts.map((workout, workoutIndex) => (
                                          <div key={workoutIndex} className="text-sm text-gray-300 bg-gray-500/30 rounded p-1">
                                            <p className="font-medium">Workout {workoutIndex + 1}</p>
                                            <p className="text-xs text-gray-400">Order: {workout.order}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-400">
                                        <p>Rest Day</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="text-lg font-medium text-white mb-2">No Workouts in Program</h3>
                      <p className="text-gray-400">This program doesn't have any workouts scheduled yet.</p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedProgram.tags && selectedProgram.tags.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProgram.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full border border-red-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              // Grid view for all programs
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                  <Droppable key={program._id} droppableId={program._id} type="workout-to-program">
                    {(provided, snapshot) => (
                <motion.div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/10 ${
                          snapshot.isDraggingOver 
                            ? 'border-red-500 border-2 border-dashed bg-red-500/5' 
                            : 'border-gray-700 hover:border-red-500/50'
                        }`}
                      >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">{program.duration} Days</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-red-400 transition-colors">{program.title}</h3>
                        <p className="text-gray-400 text-sm">{program.description}</p>
                      </div>
                    </div>

                    {/* Program Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">
                            {program.days?.reduce((total, day) => total + day.workouts.length, 0) || 0}
                          </div>
                          <div className="text-gray-400 text-xs">Workouts</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{program.duration}</div>
                          <div className="text-gray-400 text-xs">Days</div>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-white font-bold text-lg">{program.difficulty}</div>
                          <div className="text-gray-400 text-xs">Level</div>
                        </div>
                      </div>
                    </div>

                    {/* Workout Preview */}
                    {program.days && program.days.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-400 mb-2">
                          Workouts ({program.days.reduce((total, day) => total + day.workouts.length, 0)}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {program.days.slice(0, 3).map((day, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                              Week {day.week} Day {day.day} ({day.workouts.length} workouts)
                            </span>
                          ))}
                          {program.days.length > 3 && (
                            <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                              +{program.days.length - 3} more days
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {program.tags && program.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {program.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditItem(program)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all duration-300 border border-blue-500/30"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteItem('programs', program._id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 border border-red-500/30"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        </motion.button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(program.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    {/* Drop Zone Indicator */}
                    {snapshot.isDraggingOver && (
                      <div className="absolute inset-0 bg-red-500/10 rounded-2xl border-2 border-dashed border-red-500 flex items-center justify-center">
                        <div className="text-red-400 text-sm font-medium">Drop workout here</div>
                  </div>
                    )}
                    
                    {provided.placeholder}
                </motion.div>
                )}
              </Droppable>
              ))}
            </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result;

    console.log('🎯 Drag ended:', { destination, source, draggableId, type });

    if (!destination) {
      console.log('❌ No destination, drag cancelled');
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('❌ Same position, no change needed');
      return;
    }

    if (type === 'workout-to-program') {
      const programId = destination.droppableId;
      const workoutId = draggableId;
      
      console.log('🔄 Adding workout to program:', { programId, workoutId });
      // Add workout to program
      handleAddWorkoutToProgram(programId, workoutId);
    } else if (type === 'exercise-to-workout') {
      const workoutId = destination.droppableId;
      const exerciseId = draggableId;
      
      console.log('🔄 Adding exercise to workout:', { workoutId, exerciseId });
      // Add exercise to workout
      handleAddExerciseToWorkout(workoutId, exerciseId);
    } else {
      console.log('❌ Unknown drag type:', type);
    }
  };

  const handleAddWorkoutToProgram = async (programId: string, workoutId: string) => {
    try {
      // First get the current program
      const programResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs/${programId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!programResponse.ok) {
        console.error('Failed to fetch program');
        return;
      }
      
      const program = await programResponse.json();
      
      // Check if workout is already in the program
      if (program.workouts && program.workouts.includes(workoutId)) {
        console.log('Workout already in program');
        return;
      }
      
      // Add workout to the program's workouts array
      const updatedWorkouts = [...(program.workouts || []), workoutId];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workouts: updatedWorkouts
        })
      });

      if (response.ok) {
        console.log('✅ Workout added to program successfully');
        setDragFeedback('✅ Workout added to program!');
        setTimeout(() => setDragFeedback(null), 3000);
        fetchAllData(); // Refresh data
      } else {
        console.error('Failed to add workout to program');
        setDragFeedback('❌ Failed to add workout');
        setTimeout(() => setDragFeedback(null), 3000);
      }
    } catch (error) {
      console.error('Error adding workout to program:', error);
    }
  };

  const handleAddExerciseToWorkout = async (workoutId: string, exerciseId: string) => {
    try {
      const exercise = exercises.find(ex => ex._id === exerciseId);
      if (!exercise) {
        console.error('Exercise not found');
        return;
      }

      console.log('🔍 Found exercise:', exercise);
      console.log('🔍 Exercise defaultReps:', exercise.defaultReps, typeof exercise.defaultReps);

      // Find the workout in our current state to get existing exercises
      const currentWorkout = workouts.find(w => w._id === workoutId);
      if (!currentWorkout) {
        console.error('Workout not found in current state');
        return;
      }

      console.log('🔍 Current workout from state:', currentWorkout);
      console.log('🔍 Current exercises in workout:', currentWorkout.exercises?.length || 0);
      
      // Check if exercise is already in the workout
      if (currentWorkout.exercises && currentWorkout.exercises.some((ex: any) => ex.exerciseId === exerciseId)) {
        console.log('Exercise already in workout');
        setDragFeedback('⚠️ Exercise already in workout');
        setTimeout(() => setDragFeedback(null), 3000);
        return;
      }

      const newWorkoutExercise = {
        exerciseId: exerciseId,
        exercise: exercise,
        sets: Number(exercise.defaultSets) || 1,
        reps: String(exercise.defaultReps || '10'),
        restTime: Number(exercise.defaultRest) || 60,
        notes: '',
        tempo: '',
        order: currentWorkout.exercises ? currentWorkout.exercises.length : 0
      };

      // Add exercise to the workout's exercises array
      const existingExercises = currentWorkout.exercises || [];
      const updatedExercises = [...existingExercises, newWorkoutExercise];

      console.log('🔍 Original workout exercises:', existingExercises.length);
      console.log('🔍 New workout exercise:', newWorkoutExercise);
      console.log('🔍 Updated exercises array length:', updatedExercises.length);
      console.log('🔍 All exercises in updated array:', updatedExercises.map(ex => ex.exercise?.name || ex.exerciseId));

      // Create the updated workout object
      const updatedWorkout = {
        ...currentWorkout,
        exercises: updatedExercises
      };

      console.log('🔍 Sending updated workout:', updatedWorkout);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedWorkout)
      });

      if (response.ok) {
        console.log('✅ Exercise added to workout successfully');
        setDragFeedback('✅ Exercise added to workout!');
        setTimeout(() => setDragFeedback(null), 3000);
        fetchAllData(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Failed to add exercise to workout:', errorData);
        setDragFeedback(`❌ Failed to add exercise: ${errorData.message || 'Unknown error'}`);
        setTimeout(() => setDragFeedback(null), 5000);
      }
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
    }
  };

  // Program filtering functions
  const handleProgramFilter = (programId: string | null) => {
    setSelectedProgramId(programId);
    setShowProgramDropdown(false);
  };

  const getFilteredPrograms = () => {
    if (selectedProgramId) {
      return programs.filter(program => program._id === selectedProgramId);
    }
    return programs;
  };

  const getSelectedProgram = () => {
    if (selectedProgramId) {
      return programs.find(program => program._id === selectedProgramId);
    }
    return null;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
        {/* Left Sidebar - Navigation */}
        <div className={`${isMobile ? 'fixed left-0 top-0 h-full w-72 z-40 transform transition-transform ' + (leftOpen ? 'translate-x-0' : '-translate-x-full') : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Workout Planner</h1>
                <p className="text-sm text-gray-400">Design & Manage</p>
              </div>
              {isMobile && (
                <button
                  className="ml-auto p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200"
                  onClick={() => setLeftOpen(false)}
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="p-4 border-b border-gray-700">
            <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                      ? 'bg-red-500/20 text-red-400 border-l-4 border-red-500 shadow-lg shadow-red-500/20'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                {tab.icon === 'exercise' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {tab.icon === 'workout' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                {tab.icon === 'program' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                  <span className="font-medium">{tab.label}</span>
                  <div className="ml-auto">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activeTab === tab.id ? 'bg-red-500/20 text-red-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {tab.id === 'exercises' ? exercises.length : 
                       tab.id === 'workouts' ? workouts.length : programs.length}
                    </span>
                  </div>
              </button>
            ))}
          </div>
        </div>

          {/* Program Filter Dropdown - Only show when programs tab is active */}
          {activeTab === 'programs' && programs.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Filter Programs</h3>
                <div className="relative program-dropdown">
                  <button
                    onClick={() => setShowProgramDropdown(!showProgramDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300"
                  >
                    <span className="text-sm">
                      {selectedProgramId ? 
                        programs.find(p => p._id === selectedProgramId)?.title || 'Select Program' : 
                        'All Programs'
                      }
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showProgramDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProgramDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
                    >
                      <button
                        onClick={() => handleProgramFilter(null)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                          !selectedProgramId ? 'bg-red-500/20 text-red-400' : 'text-gray-300'
                        }`}
                      >
                        All Programs ({programs.length})
                      </button>
                      {programs.map((program) => (
                        <button
                          key={program._id}
                          onClick={() => handleProgramFilter(program._id)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors border-t border-gray-700 ${
                            selectedProgramId === program._id ? 'bg-red-500/20 text-red-400' : 'text-gray-300'
                          }`}
                        >
                <div className="flex items-start justify-between">
                            <span className="truncate">{program.title}</span>
                            <span className="text-xs text-gray-500 ml-2">{program.duration} days</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Data</span>
            </motion.button>
          </div>

          {/* Back Button - Always visible at bottom */}
          <div className="sticky bottom-0 p-4 border-t border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900">
            <Link 
              href="/admin-dashboard" 
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Header */}
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
              <div className="px-4 sm:px-6 h-16 sm:h-20 lg:h-24 flex items-center">
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {isMobile && (
                <button
                  className="p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200"
                  onClick={() => setLeftOpen(true)}
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
                    <h2 className="text-base sm:text-2xl font-bold text-white truncate">
                {activeTab === 'exercises' ? 'Exercise Library' : 
                 activeTab === 'workouts' ? 'Workout Management' : 'Program Management'}
              </h2>
                    <p className="text-gray-400 hidden sm:block">
                {activeTab === 'exercises' ? 'Manage your exercise library' : 
                 activeTab === 'workouts' ? 'Create and organize workouts' : 'Design comprehensive programs'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateNew}
              aria-label={`Create new ${activeTab === 'exercises' ? 'exercise' : activeTab === 'workouts' ? 'workout' : 'program'}`}
              className="self-start shrink-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 h-10 sm:px-5 sm:h-11 rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/50 text-sm sm:text-base"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New {activeTab === 'exercises' ? 'Exercise' : activeTab === 'workouts' ? 'Workout' : 'Program'}</span>
              </span>
            </motion.button>
            {isMobile && (
              <button
                className="p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200 shrink-0"
                onClick={() => setRightOpen(true)}
                aria-label="Open panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h12" />
                </svg>
              </button>
            )}
          </div>
        </div>
            </header>

        {/* Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {/* Drag Feedback */}
              {dragFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm font-medium text-center"
                >
                  {dragFeedback}
                </motion.div>
              )}
              
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
            </div>
          </div>

          {/* Right Sidebar - Drag & Drop */}
          <div className={`${isMobile ? 'fixed right-0 top-0 h-full w-72 z-40 transform transition-transform ' + (rightOpen ? 'translate-x-0' : 'translate-x-full') : 'w-80'} bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700 flex flex-col`}>
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">
                {activeTab === 'programs' ? 'Available Workouts' : 
                 activeTab === 'workouts' ? 'Available Exercises' : 'Quick Actions'}
              </h3>
              <p className="text-sm text-gray-400">
                {activeTab === 'programs' ? 'Drag workouts to programs' : 
                 activeTab === 'workouts' ? 'Drag exercises to workouts' : 'Manage your content'}
              </p>
              {isMobile && (
                <button
                  className="absolute top-4 right-4 p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200"
                  onClick={() => setRightOpen(false)}
                  aria-label="Close panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Drag & Drop Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeTab === 'programs' && (
                <Droppable droppableId="workouts-sidebar" type="workout-to-program">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-red-500/10 border-2 border-dashed border-red-500' : 'bg-gray-700/30'
                      }`}
                    >
                      {workouts.map((workout, index) => (
                        <Draggable key={workout._id} draggableId={workout._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-red-500/50 transition-all cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-lg bg-gray-600' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-sm">{workout.title}</h4>
                                  <p className="text-gray-400 text-xs">{workout.difficulty} • {workout.exercises?.length || 0} exercises</p>
                                  <p className="text-gray-500 text-xs mt-1">{workout.description}</p>
                                  {workout.tags && workout.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {workout.tags.map((tag, index) => (
                                        <span key={index} className="px-1 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}

              {activeTab === 'workouts' && (
                <Droppable droppableId="exercises-sidebar" type="exercise-to-workout">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-red-500/10 border-2 border-dashed border-red-500' : 'bg-gray-700/30'
                      }`}
                    >
                      {exercises.map((exercise, index) => (
                        <Draggable key={exercise._id} draggableId={exercise._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-red-500/50 transition-all cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-lg bg-gray-600' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-white font-medium text-sm">{exercise.name}</h4>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setExerciseMediaOpen(prev => ({ ...prev, [exercise._id]: !prev[exercise._id] }));
                                      }}
                                      className="ml-2 px-2 py-0.5 rounded text-[10px] bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                                    >
                                      {exerciseMediaOpen[exercise._id] ? 'Hide media' : 'Show media'}
                                    </button>
                                  </div>
                                  <p className="text-gray-400 text-xs">{exercise.category} • {exercise.defaultSets} sets × {exercise.defaultReps} reps</p>
                                  <p className="text-gray-500 text-xs mt-1">{exercise.description}</p>
                                  
                                  {/* Media Content for Workout Builder */}
                                  {(exercise.imageUrl || exercise.videoUrl) && exerciseMediaOpen[exercise._id] && (
                                    <div className="mt-2">
                                      
                                      
                                      {/* Image Display */}
                                      {exercise.imageUrl && (
                                        <div className="mb-2">
                                          {isValidImageUrl(exercise.imageUrl) ? (
                                            <img
                                              src={resolveMediaUrl(extractImageUrl(exercise.imageUrl))}
                                              alt={exercise.name}
                                              className="w-full h-20 object-cover rounded border border-gray-600"
                                              loading="lazy"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                // Show fallback
                                                const fallback = document.createElement('div');
                                                fallback.className = 'w-full h-20 bg-gray-600 rounded border border-gray-600 flex items-center justify-center';
                                                fallback.innerHTML = `
                                                  <div class="text-center">
                                                    <svg class="w-4 h-4 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                    <a href="${extractImageUrl(exercise.imageUrl)}" target="_blank" rel="noopener noreferrer" class="text-red-400 text-xs hover:text-red-300 underline">Open</a>
                                                  </div>
                                                `;
                                                e.currentTarget.parentNode.replaceChild(fallback, e.currentTarget);
                                              }}
                                              onLoad={() => {}}
                                            />
                                          ) : (
                                            <div className="w-full h-20 bg-gray-600 rounded border border-gray-600 flex items-center justify-center">
                                              <div className="text-center">
                                                <svg className="w-4 h-4 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <p className="text-gray-400 text-xs">Invalid URL</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Video Display */}
                                      {exercise.videoUrl && (
                                        <div className="mb-2">
                                          <div className="relative w-full h-20 bg-gray-600 rounded border border-gray-600 overflow-hidden">
                                            {getYouTubeEmbedUrl(exercise.videoUrl) ? (
                                              <iframe
                                                src={getYouTubeEmbedUrl(exercise.videoUrl)}
                                                title={exercise.name}
                                                className="w-full h-full"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              ></iframe>
                                            ) : (
                                              <video controls className="w-full h-full">
                                                <source src={resolveMediaUrl(exercise.videoUrl || '')} />
                                                Your browser does not support the video tag.
                                              </video>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {exercise.tags && exercise.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {exercise.tags.map((tag, index) => (
                                        <span key={index} className="px-1 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}

              {activeTab === 'exercises' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h4 className="text-white font-medium mb-2">Exercise Library</h4>
                    <p className="text-gray-400 text-sm">Manage your exercise collection</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay backdrops */}
      {isMobile && leftOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setLeftOpen(false)} />
      )}
      {isMobile && rightOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setRightOpen(false)} />
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">
                  {editingItem ? 'Edit' : 'Create'} {activeTab === 'exercises' ? 'Exercise' : activeTab === 'workouts' ? 'Workout' : 'Program'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {activeTab === 'exercises' && (
                <ExerciseLibrary
                  onAddExercise={() => {}}
                  onEditExercise={() => {}}
                  onDeleteExercise={() => {}}
                  editingExercise={editingItem}
                />
              )}
              
              {activeTab === 'workouts' && (
                <WorkoutBuilder
                  onSaveWorkout={(workoutData) => {
                    // Convert the workout data to match our API structure
                    const apiWorkoutData = {
                      title: workoutData.title,
                      description: workoutData.description,
                      difficulty: workoutData.difficulty,
                      duration: workoutData.duration,
                      calories: workoutData.calories,
                      assignedTo: workoutData.assignedTo,
                      tags: workoutData.tags,
                      status: workoutData.status,
                      exercises: workoutData.exercises?.map((ex: any, index: number) => {
                        const resolvedExerciseId = typeof ex.exerciseId === 'string'
                          ? ex.exerciseId
                          : (ex.exerciseId?._id || ex.exercise?._id);
                        const resolvedExercise = ex.exercise || (Array.isArray(exercises)
                          ? exercises.find((e: any) => (e._id || e.id) === resolvedExerciseId)
                          : undefined);

                        return {
                          _id: ex._id || `temp_${Date.now()}_${index}`,
                          exerciseId: resolvedExerciseId,
                          exercise: resolvedExercise,
                          sets: Number(ex.sets ?? (resolvedExercise?.defaultSets || 1)),
                          reps: String(ex.reps ?? (resolvedExercise?.defaultReps || '')),
                          restTime: Number(ex.restTime ?? (resolvedExercise?.defaultRest || 60)),
                          setScheme: ex.setScheme || [],
                          maxType: ex.maxType || '1RM',
                          notes: ex.notes ?? '',
                          tempo: ex.tempo ?? '',
                          order: ex.order || index + 1
                        };
                      }) || []
                    };
                    handleSaveWorkout(apiWorkoutData);
                  }}
                  editingWorkout={editingItem}
                  availableExercises={exercises}
                  onClose={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                />
              )}
              
              {activeTab === 'programs' && (
                <ProgramBuilder
                  onSaveProgram={handleSaveProgram}
                  editingProgram={editingItem}
                  availableWorkouts={workouts}
                  onClose={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DragDropContext>
  );
}
