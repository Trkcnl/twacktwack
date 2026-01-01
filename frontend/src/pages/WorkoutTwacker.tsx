import React, { useEffect, useState, useMemo } from 'react';
import {format, add, set} from 'date-fns'
import api from '../services/api';
import type { ExerciseSet, ExerciseLog, ExerciseType, WorkoutLog } from '../types/models';

export const WorkoutTwacker = () => {
    // --- STATE: History Logs ---
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);

    // --- STATE: UI & Animation ---
    const [isFormOpen, setIsFormOpen] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // --- STATE: Form Data ---
    const initialFormState = {
        id: 1,
        begintime: new Date().toISOString(), // Format: YYYY-MM-DDTHH:mm
        endtime: add(new Date(), {hours:1}).toISOString(),
        exercise_logs: [] as ExerciseLog[]
    };

    const [formData, setFormData] = useState<WorkoutLog>(initialFormState);

    const exerciseTypesMap = useMemo(() => {
        const map: Record<number, ExerciseType> = {};

        exerciseTypes.forEach(exerciseType => {
            map[exerciseType.id] = exerciseType;
        });
        return map;
    }, [exerciseTypes]);

    // --- HELPER: Transitions ---
    const handleTransition = (shouldOpen: boolean, callback?: () => void) => {
        if (isFormOpen === shouldOpen) return;
        setIsFormOpen(true); // Always ensure render is true first
        setIsAnimating(true); // Start animation

        setTimeout(() => {
            if (!shouldOpen) {
                setIsFormOpen(false); // Remove from DOM after fade out
                setEditingId(null);
                setFormData(initialFormState);
            }
            if (callback) callback();
            
            requestAnimationFrame(() => setIsAnimating(false));
        }, 150);
    };

    const handleOpenForm = () => {
        if (!isFormOpen) {
            setFormData(initialFormState);
            handleTransition(true);
        }
        else{
            handleCloseForm()
        }
    };

    const handleCloseForm = () => {
        handleTransition(false);
    };

    const handleEdit = (log: WorkoutLog) => {
        const prepData = () => {
            setFormData({
                id: log.id,
                begintime: log.begintime,
                endtime: log.endtime,
                exercise_logs: log.exercise_logs
            });
            setEditingId(log.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        if (isFormOpen) {
            handleTransition(false, () => {
                // Quick reset then reopen
                setTimeout(() => handleTransition(true, prepData), 250);
            });
        } else {
            handleTransition(true, prepData);
        }
    };

    

    // --- FORM LOGIC: Nested Updates ---

    // 1. Add a new Exercise Block
    const addExercise = () => {
        exerciseTypes.map(e => {console.log(e)})
        const newExercise: ExerciseLog = {
            id: Date.now(), // Temp ID
            exercise_type: exerciseTypes[0], // Default to first available
            exercise_sets: []
        };
        setFormData(prev => ({
            ...prev,
            exercise_logs: [...prev.exercise_logs, newExercise]
        }));
    };

    // 2. Remove an Exercise Block
    const removeExercise = (index: number) => {
        setFormData(prev => ({
            ...prev,
            exercise_logs: prev.exercise_logs.filter((_, i) => i !== index)
        }));
    };

    

    // 3. Change Exercise Type
    const updateExerciseType = (index: number, typeId: number) => {
        const newLogs = [...formData.exercise_logs];
        newLogs[index] = { ...newLogs[index], exercise_type: exerciseTypesMap[typeId] };
        setFormData({ ...formData, exercise_logs: newLogs });
    };

    // 4. Add Set to specific Exercise
    const addSet = (exerciseIndex: number) => {
        const newSet: ExerciseSet = {
            id: Date.now() + Math.random(), // Temp ID
            weight_kg: 0,
            reps: 0,
            rpe: 8,
            rir: 2
        };
        const newLogs = [...formData.exercise_logs];
        newLogs[exerciseIndex] = {
            ...newLogs[exerciseIndex],
            exercise_sets: [...newLogs[exerciseIndex].exercise_sets, newSet]
        };
        setFormData({ ...formData, exercise_logs: newLogs });
    };

    // 5. Update Set Data
    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) => {
        const newLogs = [...formData.exercise_logs];
        const targetSets = [...newLogs[exerciseIndex].exercise_sets];
        
        targetSets[setIndex] = { ...targetSets[setIndex], [field]: value };
        newLogs[exerciseIndex] = { ...newLogs[exerciseIndex], exercise_sets: targetSets };
        
        setFormData({ ...formData, exercise_logs: newLogs });
    };

    // 6. Remove Set
    const removeSet = (exerciseIndex: number, setIndex: number) => {
        const newLogs = [...formData.exercise_logs];
        newLogs[exerciseIndex] = {
            ...newLogs[exerciseIndex],
            exercise_sets: newLogs[exerciseIndex].exercise_sets.filter((_, i) => i !== setIndex)
        };
        setFormData({ ...formData, exercise_logs: newLogs });
    };

    // --- SUBMIT ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            setLogs(prev => prev.map(log => 
                log.id === editingId 
                    ? { ...formData, id: editingId } as WorkoutLog 
                    : log
            ));
        } else {
            const payload = {
                begintime: formData.begintime,
                endtime: formData.endtime,
                // Map over the logs to transform them
                exercise_logs: formData.exercise_logs.map(log => ({
                    // 1. Extract just the ID for the backend
                    exercise_type: log.exercise_type.id, 
                    
                    // 2. Keep the sets as they are (since they are already correct)
                    exercise_sets: log.exercise_sets,
                }))
            };
            api.post("api/v1/workouts/", payload).then(e => {setLogs([e.data, ...logs]); console.log(e.data)})
        }
        handleCloseForm();
    };

    // --- RENDER HELPERS ---
    // Calculate total volume (Sets * Reps * Weight) for summary
    const calculateVolume = (log: WorkoutLog) => {
        let volume = 0;
        log.exercise_logs.forEach(ex => {
            ex.exercise_sets.forEach(set => {
                volume += set.weight_kg * set.reps;
            });
        });
        return volume;
    };

    useEffect(() => {
        api.get("api/v1/exercise-types/").then(e => {setExerciseTypes(e.data)})
    }, 
    []);

    useEffect(() => {
        api.get("api/v1/workouts/").then(e => {setLogs(e.data)})
    }, 
    []);

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            
            {/* 1. TOP SECTION: Action Card */}
            <div className="grid grid-cols-1">
                <div 
                    onClick={handleOpenForm}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-lg group
                        ${isFormOpen 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-green-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600">Log Workout</h3>
                        <span className="p-2 bg-green-100 text-green-600 rounded-full">💪</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Record a new session including multiple exercises, sets, reps, and RPE.
                    </p>
                </div>
            </div>

            {/* 2. MIDDLE SECTION: The Complex Form */}
            {isFormOpen && (
                <div 
                    className={`
                        bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden
                        transform transition-all duration-300 ease-in-out
                        ${isAnimating ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
                    `}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-green-600 flex justify-between items-center">
                        <h2 className="text-white font-bold text-lg">
                            {editingId ? 'Edit Workout' : 'New Workout Session'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Workout Day</label>
                                <input 
                                    type="date" required
                                    value={format(formData.begintime, "yyyy-MM-dd")}
                                    onChange={e => setFormData({...formData, 
                                        begintime: set(formData.begintime, {
                                            year: parseInt(e.target.value.split("-")[0]),
                                            month: parseInt(e.target.value.split("-")[1]) - 1,
                                            date: parseInt(e.target.value.split("-")[2]),
                                        }).toISOString(),
                                        endtime: set(formData.endtime, {
                                            year: parseInt(e.target.value.split("-")[0]),
                                            month: parseInt(e.target.value.split("-")[1]) - 1,
                                            date: parseInt(e.target.value.split("-")[2]),
                                        }).toISOString()
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                                <input 
                                    type="time" required
                                    value={format(formData.begintime, "kk:mm")}
                                    onChange={e => setFormData({...formData, begintime: set(formData.begintime, {hours: parseInt(e.target.value.split(":")[0]), minutes: parseInt(e.target.value.split(":")[0])}).toISOString()})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                                <input 
                                    type="time" required
                                    value={format(formData.endtime, "kk:mm")}
                                    onChange={e => setFormData({...formData, endtime: set(formData.begintime, {hours: parseInt(e.target.value.split(":")[0]), minutes: parseInt(e.target.value.split(":")[0])}).toISOString()})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* B. Exercises List */}
                        <div className="space-y-6">
                            {formData.exercise_logs.map((exercise, exIndex) => (
                                <div key={exercise.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Exercise Header */}
                                    <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="font-bold text-gray-600">#{exIndex + 1}</span>
                                            <select 
                                                value={exercise.exercise_type.id}
                                                onChange={(e) => updateExerciseType(exIndex, Number(e.target.value))}
                                                className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full max-w-xs p-2"
                                            >
                                                {exerciseTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeExercise(exIndex)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove Exercise
                                        </button>
                                    </div>

                                    {/* Sets Table */}
                                    <div className="p-4 overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2">Set</th>
                                                    <th className="px-3 py-2">kg</th>
                                                    <th className="px-3 py-2">Reps</th>
                                                    <th className="px-3 py-2">RPE</th>
                                                    <th className="px-3 py-2">RIR</th>
                                                    <th className="px-3 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {exercise.exercise_sets.map((set, setIndex) => (
                                                    <tr key={set.id} className="border-b">
                                                        <td className="px-3 py-2 font-medium">{setIndex + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" className="w-16 p-1 border rounded" value={set.weight_kg || ''} onChange={(e) => updateSet(exIndex, setIndex, 'weight_kg', Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" className="w-16 p-1 border rounded" value={set.reps || ''} onChange={(e) => updateSet(exIndex, setIndex, 'reps', Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" className="w-16 p-1 border rounded" value={set.rpe || ''} onChange={(e) => updateSet(exIndex, setIndex, 'rpe', Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" className="w-16 p-1 border rounded" value={set.rir || ''} onChange={(e) => updateSet(exIndex, setIndex, 'rir', Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button type="button" onClick={() => removeSet(exIndex, setIndex)} className="text-red-500 hover:text-red-700">✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button 
                                            type="button" 
                                            onClick={() => addSet(exIndex)}
                                            className="mt-2 text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1"
                                        >
                                            + Add Set
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button 
                                type="button" 
                                onClick={addExercise}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors font-medium"
                            >
                                + Add Another Exercise
                            </button>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" onClick={handleCloseForm} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95"
                            >
                                {editingId ? 'Update Workout' : 'Save Workout'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. BOTTOM SECTION: History Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Workout History</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Exercises</th>
                                <th className="px-6 py-4">Total Vol</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        No workouts logged yet. Go get some gains!
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const start = new Date(log.begintime);
                                    const end = new Date(log.endtime);
                                    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                {start.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                                <span className="text-gray-400 mx-1">→</span>
                                                {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                <div className="text-xs text-gray-400 mt-0.5">({duration} mins)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {log.exercise_logs.map((ex, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                            {ex.exercise_type.id}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                                {calculateVolume(log).toLocaleString()} kg
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleEdit(log)}
                                                    className="text-gray-400 hover:text-green-600 font-semibold text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};