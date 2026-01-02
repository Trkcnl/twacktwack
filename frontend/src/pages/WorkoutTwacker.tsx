import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, add, set, parseISO } from 'date-fns';
import { Plus, Trash2, Save, X, Edit2, Dumbbell } from 'lucide-react';

// --- IMPORTS (Your API) ---
import api from '../services/api';
import type { ExerciseType, WorkoutLog } from '../types/models';

// --- SHADCN UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

// ------------------------------------------------------------------
// 1. DEFINE THE SCHEMA
// ------------------------------------------------------------------

const setSchema = z.object({
  weight_kg: z.coerce.number<number>().min(0, "Please enter a positive weight"),
  reps: z.coerce.number<number>().min(0, "Reps can not have a negative value"),
  rpe: z.coerce.number<number>().min(0).max(10).optional(),
  rir: z.coerce.number<number>().min(0).optional(),
});

const exerciseLogSchema = z.object({
  exercise_type: z.string().min(1, "Please select an exercise"), 
  exercise_sets: z.array(setSchema)
});

const workoutSchema = z.object({
  workoutdate: z.string(),
  begintime: z.string(), // We will store full ISO strings here
  endtime: z.string(),
  exercise_logs: z.array(exerciseLogSchema)
});

export type WorkoutFormValues = z.infer<typeof workoutSchema>;

// ------------------------------------------------------------------
// 2. SUB-COMPONENTS
// ------------------------------------------------------------------

// Component A: Manages the list of Sets
const SetList = ({ exerciseIndex }: { exerciseIndex: number }) => {
  const { control } = useFormContext<WorkoutFormValues>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercise_logs.${exerciseIndex}.exercise_sets`
  });

  return (
    <div className="p-4 pt-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-15">Set</TableHead>
            <TableHead>kg</TableHead>
            <TableHead>Reps</TableHead>
            <TableHead>RPE</TableHead>
            <TableHead>RIR</TableHead>
            <TableHead className="w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                <FormField
                  control={control}
                  name={`exercise_logs.${exerciseIndex}.exercise_sets.${index}.weight_kg`}
                  render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input type="number" className="h-8 w-20" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell>
                <FormField
                  control={control}
                  name={`exercise_logs.${exerciseIndex}.exercise_sets.${index}.reps`}
                  render={({ field }) => (
                    <FormControl>
                      <Input type="number" className="h-8 w-20" {...field} />
                    </FormControl>
                  )}
                />
              </TableCell>
              <TableCell>
                <FormField
                    control={control}
                    name={`exercise_logs.${exerciseIndex}.exercise_sets.${index}.rpe`}
                    render={({ field }) => <FormControl><Input type="number" className="h-8 w-20" {...field} /></FormControl>}
                />
              </TableCell>
              <TableCell>
                <FormField
                    control={control}
                    name={`exercise_logs.${exerciseIndex}.exercise_sets.${index}.rir`}
                    render={({ field }) => <FormControl><Input type="number" className="h-8 w-20" {...field} /></FormControl>}
                />
              </TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ weight_kg: 0, reps: 0, rpe: 8, rir: 2 })}
        className="mt-2 text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Set
      </Button>
    </div>
  );
};

// Component B: Manages the list of Exercises
const ExerciseList = ({ exerciseTypes }: { exerciseTypes: ExerciseType[] }) => {
  const { control } = useFormContext<WorkoutFormValues>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercise_logs"
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-muted/40 border-b">
            <div className="flex items-center gap-4 flex-1">
              <Badge variant="secondary" className="px-2">#{index + 1}</Badge>
              
              <FormField
                control={control}
                name={`exercise_logs.${index}.exercise_type`}
                render={({ field }) => (
                  <FormItem className="flex-1 max-w-75 mb-0 space-y-0">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background h-9">
                            <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exerciseTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button" variant="ghost" size="sm" onClick={() => remove(index)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <SetList exerciseIndex={index} />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ exercise_type: "", exercise_sets: [] })}
        className="w-full border-dashed h-12 text-muted-foreground hover:text-primary hover:border-primary/50"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Another Exercise
      </Button>
    </div>
  );
};

// ------------------------------------------------------------------
// 3. MAIN COMPONENT
// ------------------------------------------------------------------

export const WorkoutTwacker = () => {
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm<WorkoutFormValues>({
        resolver: zodResolver(workoutSchema),
        defaultValues: {
            workoutdate: new Date().toISOString(),
            begintime: new Date().toISOString(),
            endtime: add(new Date(), { hours: 1 }).toISOString(),
            exercise_logs: []
        },
        mode: "onChange",
    });

    const onSubmit = async (data: WorkoutFormValues) => {
        const payload = {
            begintime: data.begintime,
            endtime: data.endtime,
            exercise_logs: data.exercise_logs.map(log => ({
                exercise_type: parseInt(log.exercise_type), 
                exercise_sets: log.exercise_sets
            }))
        };

        try {
            if (editingId) {
                // Mock update for now
                setLogs(prev => prev.map(log => 
                    log.id === editingId ? { ...payload, id: editingId } as unknown as WorkoutLog : log
                ));
            } else {
                const response = await api.post("api/v1/workouts/", payload);
                setLogs([response.data, ...logs]);
            }
            handleCloseForm();
        } catch (error) {
            console.error("Submission failed", error);
        }
    };

    const handleOpenForm = () => {
        setIsFormOpen(true);
        form.reset({
            workoutdate: new Date().toISOString(),
            begintime: new Date().toISOString(),
            endtime: add(new Date(), { hours: 1 }).toISOString(),
            exercise_logs: []
        });
        setEditingId(null);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        form.reset();
    };

    const handleEdit = (log: WorkoutLog) => {
        const formCompatibleData: WorkoutFormValues = {
            workoutdate: log.workoutdate,
            begintime: log.begintime,
            endtime: log.endtime,
            exercise_logs: log.exercise_logs.map(ex => ({
                exercise_type: ex.exercise_type.id.toString(),
                exercise_sets: ex.exercise_sets
            }))
        };
        
        setEditingId(log.id);
        setIsFormOpen(true);
        // Timeout ensures the form is mounted before reset happens
        setTimeout(() => form.reset(formCompatibleData), 0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        api.get("api/v1/exercise-types/").then(e => setExerciseTypes(e.data));
        api.get("api/v1/workouts/").then(e => setLogs(e.data));
    }, []);

    const calculateVolume = (log: WorkoutLog) => {
        let volume = 0;
        log.exercise_logs.forEach(ex => {
            ex.exercise_sets.forEach(set => volume += set.weight_kg * set.reps);
        });
        return volume;
    };

    // Helper for handling Date Input changes
    const onDateChange = (newDateString: string) => {
        if (!newDateString) return; // Handle clear/invalid

        const currentStart = parseISO(form.getValues("begintime"));
        const currentEnd = parseISO(form.getValues("endtime"));
        
        const [year, month, day] = newDateString.split('-').map(Number);

        // Update Start Time Date
        const newStart = set(currentStart, { year, month: month - 1, date: day });
        form.setValue("begintime", newStart.toISOString(), { shouldDirty: true, shouldValidate: true });

        // Update End Time Date (Optional: keep end time on same day)
        const newEnd = set(currentEnd, { year, month: month - 1, date: day });
        form.setValue("endtime", newEnd.toISOString(), { shouldDirty: true, shouldValidate: true });
    };

    const onTimeChange = (fieldName: "begintime" | "endtime", newTimeString: string) => {
        if (!newTimeString) return;

        const currentIso = form.getValues(fieldName);
        const currentDate = parseISO(currentIso);
        
        const [hours, minutes] = newTimeString.split(':').map(Number);
        
        const newDate = set(currentDate, { hours, minutes });
        form.setValue(fieldName, newDate.toISOString(), { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
            {/* ACTION HEADER */}
            {!isFormOpen && (
                <Card className="hover:border-green-500 transition-all cursor-pointer group" onClick={handleOpenForm}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold group-hover:text-green-600 transition-colors">
                            Log Workout
                        </CardTitle>
                        <Dumbbell className="h-6 w-6 text-muted-foreground group-hover:text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Record a new session.</p>
                    </CardContent>
                </Card>
            )}

            {/* FORM AREA */}
            {isFormOpen && (
                <Card className="border-green-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                            {editingId ? 'Edit Workout' : 'New Workout Session'}
                        </CardTitle>
                    </CardHeader>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6 pt-6">
                                {/* DATE & TIME */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="workoutdate"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    type="date" 
                                                    // TRANSFORM: ISO -> yyyy-MM-dd
                                                    value={format(parseISO(form.watch("begintime")), "yyyy-MM-dd")} 
                                                    onChange={(e) => onDateChange(e.target.value)}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="begintime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Time</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    type="time" 
                                                    // TRANSFORM: ISO -> HH:mm
                                                    value={format(parseISO(field.value), "HH:mm")}
                                                    onChange={(e) => onTimeChange("begintime", e.target.value)}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endtime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Time</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    type="time" 
                                                    // TRANSFORM: ISO -> HH:mm
                                                    value={format(parseISO(field.value), "HH:mm")}
                                                    onChange={(e) => onTimeChange("endtime", e.target.value)}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />
                                <ExerciseList exerciseTypes={exerciseTypes} />
                            </CardContent>
                            
                            <CardFooter className="flex justify-end gap-3 border-t bg-muted/30 p-6">
                                <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingId ? 'Update Workout' : 'Save Workout'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            )}

            {/* HISTORY TABLE */}
            <Card>
                <CardHeader><CardTitle>History</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{new Date(log.begintime).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(parseISO(log.begintime), "HH:mm")} - {format(parseISO(log.endtime), "HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-mono">{calculateVolume(log).toLocaleString()} kg</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(log)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};