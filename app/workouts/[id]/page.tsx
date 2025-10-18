'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ExerciseItem {
  _id?: string;
  exerciseId?: any;
  sets: number;
  reps: string;
  restTime?: number;
  notes?: string;
  tempo?: string;
  order: number;
}

interface WorkoutDetail {
  _id: string;
  title: string;
  description?: string;
  difficulty?: string;
  exercises: ExerciseItem[];
}

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const [user, setUser] = useState<any>(null);
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, { sets: number; reps: string; weight?: string; notes?: string }>>({});
  const mockWorkout: WorkoutDetail = {
    _id: id,
    title: 'Full Body Builder (Mock)',
    description: 'A complete session targeting all major muscle groups with guided videos.',
    difficulty: 'intermediate',
    exercises: [
      { order: 1, sets: 4, reps: '8-10', notes: 'Tempo 3-1-1', tempo: '311' },
      { order: 2, sets: 3, reps: '10-12', notes: 'Focus on control' },
      { order: 3, sets: 3, reps: 'AMRAP', notes: 'Keep form strict' },
    ],
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        try {
          const meRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) {
            const me = await meRes.json();
            setUser(me.user || me);
          }
        } catch {}

        try {
          const wRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workouts`);
          const wData = await wRes.json();
          const list = (wData?.workouts || []) as any[];
          const found = list.find((x: any) => x._id === id);
          setWorkout(found || mockWorkout);
        } catch {
          setWorkout(mockWorkout);
        }

        const saved = localStorage.getItem(`workout-log-${id}`);
        if (saved) setLogs(JSON.parse(saved));
      } catch (err: any) {
        setError(err.message || 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  const orderedExercises = useMemo(() => {
    if (!workout) return [];
    return [...(workout.exercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [workout]);

  const handleChange = (key: string, field: string, value: string | number) => {
    setLogs((prev) => {
      const next = { ...prev, [key]: { sets: prev[key]?.sets || 0, reps: prev[key]?.reps || '', weight: prev[key]?.weight, notes: prev[key]?.notes } } as any;
      (next[key] as any)[field] = value as any;
      return next;
    });
  };

  const handleSave = () => {
    localStorage.setItem(`workout-log-${id}`, JSON.stringify(logs));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-dark-300/50 border border-dark-200/50 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/workouts" className="text-primary-500 hover:text-primary-400">← Back to Workouts</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{workout?.title}</h1>
          <p className="text-gray-400">{workout?.description}</p>
        </motion.div>

        <div className="space-y-6">
          {/* Mock Video Section */}
          <div className="rounded-2xl overflow-hidden border border-dark-200/50 bg-dark-300/50">
            <div className="aspect-video w-full bg-black/40 flex items-center justify-center">
              <video className="w-full h-full object-cover" controls poster="/assets/Image2.png">
                <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="p-4 text-gray-400 text-sm">Follow along with the form cues and tempo recommendations.</div>
          </div>

          {orderedExercises.map((ex, idx) => {
            const key = String(ex.order ?? idx + 1);
            const entry = logs[key] || { sets: ex.sets, reps: ex.reps, weight: '', notes: '' };
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="bg-dark-300/50 border border-dark-200/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-semibold">{idx + 1}</div>
                    <h3 className="text-white font-semibold">Exercise {idx + 1}</h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 capitalize">{(workout?.difficulty || 'Beginner')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Sets</label>
                    <input type="number" min={1} value={entry.sets} onChange={(e) => handleChange(key, 'sets', Number(e.target.value))} className="w-full px-3 py-2 bg-dark-400/50 border border-dark-200 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Reps</label>
                    <input value={entry.reps} onChange={(e) => handleChange(key, 'reps', e.target.value)} className="w-full px-3 py-2 bg-dark-400/50 border border-dark-200 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Weight</label>
                    <input value={entry.weight || ''} onChange={(e) => handleChange(key, 'weight', e.target.value)} placeholder="e.g. 20 kg" className="w-full px-3 py-2 bg-dark-400/50 border border-dark-200 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Notes</label>
                    <input value={entry.notes || ''} onChange={(e) => handleChange(key, 'notes', e.target.value)} placeholder="form, cues, etc." className="w-full px-3 py-2 bg-dark-400/50 border border-dark-200 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-end mt-8 space-x-3">
          <Link href="/workouts" className="px-4 py-2 rounded-lg bg-dark-300 text-gray-300 hover:bg-dark-200">Cancel</Link>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-orange text-white font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all">Save Progress</button>
        </div>
      </main>
    </div>
  );
}



