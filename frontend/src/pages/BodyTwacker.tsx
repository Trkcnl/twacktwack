import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Scale, Calendar, Activity, ChevronLeft, ChevronRight, Save, Edit2 } from 'lucide-react';

// --- YOUR IMPORTS ---
import type { Measurement, MeasurementType } from '../types/models';
import api from "../services/api";

// --- SHADCN IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// ------------------------------------------------------------------
// 1. DEFINE THE SCHEMA
// ------------------------------------------------------------------

const measurementSchema = z.object({
    date: z.string<string>(), // We keep this as ISO string
    value: z.coerce.number<number>().min(0.1, "Value must be greater than 0"),
    // Shadcn Select stores values as strings. We validate it's not empty/zero.
    measurement_type_id: z.string().min(1, "Please select a type").refine(val => val !== "0", "Select a valid type"),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

// ------------------------------------------------------------------
// 2. MAIN COMPONENT
// ------------------------------------------------------------------

export const BodyTwacker = () => {
    // --- STATE ---
    const [logs, setLogs] = useState<Measurement[]>([]);
    const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([]);
    
    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // --- FORM SETUP ---
    const form = useForm<MeasurementFormValues>({
        resolver: zodResolver(measurementSchema),
        defaultValues: {
            date: new Date().toISOString(),
            value: 0,
            measurement_type_id: "" 
        },
        mode: "onChange"
    });

    // --- ACTIONS ---

    const handleOpenForm = () => {
        setIsFormOpen(true);
        setEditingId(null);
        form.reset({
            date: new Date().toISOString(),
            value: 0,
            measurement_type_id: ""
        });
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        form.reset();
    };

    const handleEdit = (log: Measurement) => {
        setEditingId(log.id);
        setIsFormOpen(true);
        
        // Reset form with existing data
        // Note: We convert ID to string for the Select component
        form.reset({
            date: log.date, // Assuming API sends ISO or YYYY-MM-DD
            value: log.value,
            measurement_type_id: log.measurement_type.id.toString()
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSubmit = async (data: MeasurementFormValues) => {
        const payload = {
            date: format(parseISO(data.date), "yyyy-MM-dd"), // Ensure Backend gets YYYY-MM-DD
            value: data.value,
            measurement_type: parseInt(data.measurement_type_id)
        };

        try {
            if (editingId) {
                // Update Logic
                const response = await api.put(`api/v1/measurements/${editingId}/`, { ...payload, id: editingId });
                // Optimistic update or refetch
                setLogs(prev => prev.map(item => item.id === editingId ? { ...item, ...response.data } : item));
            } else {
                // Create Logic
                const response = await api.post("api/v1/measurements/", payload);
                setLogs([response.data, ...logs]);
            }
            handleCloseForm();
        } catch (error) {
            console.error("Failed to save log", error);
        }
    };

    // --- DATA LOADING ---
    useEffect(() => {
        api.get<Measurement[]>("api/v1/measurements/").then((e) => setLogs(e.data));
        api.get<MeasurementType[]>("api/v1/measurement-types/").then((e) => {
            // Filter out placeholder ID 0 if it comes from API, otherwise just set data
            setMeasurementTypes(e.data);
        });
    }, []);

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filter changes
    useEffect(() => setCurrentPage(1), [itemsPerPage]);


    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
            
            {/* 1. TOP SECTION: ACTION CARD */}
            {!isFormOpen && (
                <Card 
                    className="cursor-pointer border-2 hover:border-blue-500 hover:bg-blue-50/10 transition-all group"
                    onClick={handleOpenForm}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                                Quick Weight Log
                            </CardTitle>
                            <CardDescription>
                                Track your progress without the hassle.
                            </CardDescription>
                        </div>
                        <Scale className="h-8 w-8 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </CardHeader>
                </Card>
            )}

            {/* 2. FORM SECTION */}
            {isFormOpen && (
                <Card className="border-blue-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-200\">
                    <CardHeader className="bg-blue-50/50 border-b pb-4">
                        <CardTitle className="flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5"/> : <Activity className="w-5 h-5"/>}
                            {editingId ? 'Edit Entry' : 'Log Measurements'}
                        </CardTitle>
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 gap-6 p-2 max-w-xs">
                                    
                                    {/* DATE INPUT */}
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                            type="date"
                                                            // Logic: Read ISO -> display YYYY-MM-DD
                                                            value={field.value ? format(parseISO(field.value), "yyyy-MM-dd") : ''}
                                                            onChange={(e) => {
                                                                // Logic: Write YYYY-MM-DD -> save ISO
                                                                const dateVal = e.target.value;
                                                                if(!dateVal) return;
                                                                field.onChange(new Date(dateVal).toISOString());
                                                            }}
                                                        />
                                                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4">
                                        {/* MEASUREMENT TYPE SELECT */}
                                        <FormField
                                            control={form.control}
                                            name="measurement_type_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {measurementTypes.map((type) => (
                                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                                    {type.name} {type.unit ? `(${type.unit})` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* VALUE INPUT */}
                                        <FormField
                                            control={form.control}
                                            name="value"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Value</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            step="0.1" 
                                                            placeholder="0.0" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardContent className="flex justify-end gap-3 border-t bg-gray-50/50 p-6 rounded-b-xl">
                                <Button type="button" variant="outline" onClick={handleCloseForm}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingId ? 'Update Log' : 'Save Log'}
                                </Button>
                            </CardContent>
                        </form>
                    </Form>
                </Card>
            )}

            {/* 3. TABLE SECTION */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>History</CardTitle>
                    
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows:</span>
                        <Select 
                            value={itemsPerPage.toString()} 
                            onValueChange={(val) => setItemsPerPage(Number(val))}
                        >
                            <SelectTrigger className="w-17.5 h-8">
                                <SelectValue placeholder="5" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {log.measurement_type.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {/* Handle string dates gracefully */}
                                            {log.date ? format(new Date(log.date), "yyyy-MM-dd") : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {log.value} <span className="text-muted-foreground text-xs">{log.measurement_type.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleEdit(log)}
                                                className="hover:text-blue-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between space-x-2 py-4 border-t mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                            
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};