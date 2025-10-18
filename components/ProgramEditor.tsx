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
  difficulty: string;
  duration: number;
  exercises: Array<any>;
}

interface Program {
  _id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  days: Array<{
    week: number;
    day: number;
    workouts: Array<{
      workoutId: Workout;
      order: number;
    }>;
  }>;
}

interface ProgramEditorProps {
  program: Program;
  onSave: (updatedProgram: Program) => void;
  onCancel: () => void;
}

export default function ProgramEditor({ program, onSave, onCancel }: ProgramEditorProps) {
  const [editedProgram, setEditedProgram] = useState<Program>(program);
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`);
      if (response.ok) {
        const data = await response.json();
        setAvailableWorkouts(data.workouts || []);
      }
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
    }
  };

  const addWeek = () => {
    const newWeek = Math.max(...editedProgram.days.map(d => d.week), 0) + 1;
    const newDays = [];
    
    // Add 7 days for the new week
    for (let day = 1; day <= 7; day++) {
      newDays.push({
        week: newWeek,
        day: day,
        workouts: []
      });
    }
    
    setEditedProgram({
      ...editedProgram,
      days: [...editedProgram.days, ...newDays]
    });
  };

  const addDay = () => {
    const newWeek = Math.max(...editedProgram.days.map(d => d.week), 0) + 1;
    const newDay = 1;
    
    setEditedProgram({
      ...editedProgram,
      days: [
        ...editedProgram.days,
        {
          week: newWeek,
          day: newDay,
          workouts: []
        }
      ]
    });
  };

  const addWorkoutToDay = (dayIndex: number) => {
    if (availableWorkouts.length === 0) return;
    
    const updatedDays = [...editedProgram.days];
    const workoutToAdd = availableWorkouts[0]; // Add first available workout
    
    updatedDays[dayIndex].workouts.push({
      workoutId: workoutToAdd,
      order: updatedDays[dayIndex].workouts.length + 1
    });
    
    setEditedProgram({
      ...editedProgram,
      days: updatedDays
    });
  };

  const removeWorkoutFromDay = (dayIndex: number, workoutIndex: number) => {
    const updatedDays = [...editedProgram.days];
    updatedDays[dayIndex].workouts.splice(workoutIndex, 1);
    
    setEditedProgram({
      ...editedProgram,
      days: updatedDays
    });
  };

  const updateDayWorkout = (dayIndex: number, workoutIndex: number, workoutId: string) => {
    const updatedDays = [...editedProgram.days];
    const currentDay = updatedDays[dayIndex];
    
    // Check if the selected workout is already added to this day
    const isAlreadyAdded = currentDay.workouts.some(existingWorkout => 
      existingWorkout.workoutId._id === workoutId
    );
    
    if (isAlreadyAdded) {
      // If it's already added, remove it
      updatedDays[dayIndex].workouts.splice(workoutIndex, 1);
    } else {
      // If it's not added, add it
      const selectedWorkout = availableWorkouts.find(w => w._id === workoutId);
      if (selectedWorkout) {
        updatedDays[dayIndex].workouts[workoutIndex].workoutId = selectedWorkout;
      }
    }
    
    setEditedProgram({
      ...editedProgram,
      days: updatedDays
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/programs/${program._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProgram)
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data);
      } else {
        console.error('Failed to save program');
      }
    } catch (error) {
      console.error('Error saving program:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group days by week
  const groupedDays = editedProgram.days.reduce((acc, day) => {
    if (!acc[day.week]) {
      acc[day.week] = [];
    }
    acc[day.week].push(day);
    return acc;
  }, {} as Record<number, typeof editedProgram.days>);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="w-[96vw] max-w-[1500px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Edit Program: {program.title}</DialogTitle>
          <DialogDescription>
            Manage your program schedule by adding workouts to specific days
          </DialogDescription>
        </DialogHeader>

        {/* Program Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="program-title">Title</Label>
            <Input
              id="program-title"
              type="text"
              value={editedProgram.title}
              onChange={(e) => setEditedProgram({...editedProgram, title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="program-duration">Duration (weeks)</Label>
            <Input
              id="program-duration"
              type="number"
              value={editedProgram.duration}
              onChange={(e) => setEditedProgram({...editedProgram, duration: parseInt(e.target.value)})}
              min="1"
              max="52"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="program-description">Description</Label>
          <Textarea
            id="program-description"
            value={editedProgram.description}
            onChange={(e) => setEditedProgram({...editedProgram, description: e.target.value})}
            rows={3}
          />
        </div>

        {/* Program Schedule */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Program Schedule</h3>
            <div className="flex gap-2">
              <Button onClick={addWeek} className="bg-red-600 hover:bg-red-700">
                Add Week
              </Button>
              <Button onClick={addDay} variant="outline">
                Add Day
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(groupedDays).map(([weekNumber, days]) => (
              <div key={weekNumber} className="space-y-4">
                <h4 className="text-xl font-semibold text-white">Week {weekNumber}</h4>
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex space-x-4 min-w-max">
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(dayNumber => {
                    const day = days.find(d => d.day === dayNumber);
                    const dayIndex = editedProgram.days.findIndex(d => d.week === parseInt(weekNumber) && d.day === dayNumber);
                    
                    return (
                      <div key={`${weekNumber}-${dayNumber}`} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 min-h-[220px] min-w-[260px]">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">Day {dayNumber}</h5>
                          <Button
                            size="sm"
                            onClick={() => addWorkoutToDay(dayIndex)}
                            className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1"
                          >
                            Add Workout
                          </Button>
                        </div>

                        <div className="space-y-2 min-h-[120px]">
                          {day?.workouts.map((workout, workoutIndex) => (
                            <div key={workoutIndex} className="bg-gray-700/50 rounded-lg p-3 relative group">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h6 className="text-white text-sm font-medium">{workout.workoutId.title}</h6>
                                  <p className="text-gray-400 text-xs">{workout.workoutId.exercises?.length || 0} exercises</p>
                                </div>
                                <button
                                  onClick={() => removeWorkoutFromDay(dayIndex, workoutIndex)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              
                              <Select
                                value={workout.workoutId._id}
                                onValueChange={(value) => updateDayWorkout(dayIndex, workoutIndex, value)}
                              >
                                <SelectTrigger className="mt-2 h-8 text-xs">
                                  <SelectValue placeholder="Select workout" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableWorkouts.map(workoutOption => {
                                    // Check if this workout is already added to this day
                                    const isAlreadyAdded = day?.workouts.some(existingWorkout => 
                                      existingWorkout.workoutId._id === workoutOption._id
                                    );
                                    
                                    return (
                                      <SelectItem 
                                        key={workoutOption._id} 
                                        value={workoutOption._id}
                                        className="flex items-center justify-between"
                                      >
                                        <span>{workoutOption.title} ({workoutOption.difficulty})</span>
                                        {isAlreadyAdded && (
                                          <span className="text-red-500 ml-2">×</span>
                                        )}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                          
                          {(!day || day.workouts.length === 0) && (
                            <div className="text-gray-500 text-sm text-center py-8">
                              No workouts
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            {loading ? 'Saving...' : 'Save Program'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
