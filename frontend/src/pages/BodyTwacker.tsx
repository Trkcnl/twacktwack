import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {format} from "date-fns"
import type { Measurement, MeasurementType} from '../types/models';
import api from "../services/api"

const DEFAULT_MEASUREMENT_TYPE = {id: 0, name: "Select", unit: ""};


export const BodyTwacker = () => {
    // --- State: Data ---
    const [logs, setLogs] = useState<Measurement[]>([]);
    const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([DEFAULT_MEASUREMENT_TYPE]);

    // --- State: UI ---
    const [isFormOpen, setIsFormOpen] = useState<boolean>(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // --- State: Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // --- Form State ---
    const initialFormState = {
            id: 1,
            date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DDTHH:mm
            value: 0,
            measurement_type: DEFAULT_MEASUREMENT_TYPE
        };

    const [formData, setFormData] = useState<Measurement>(initialFormState);

    const measurementTypesMap = useMemo(() => {
        const map: Record<number, MeasurementType> = {};

        measurementTypes.forEach((measurement_type) => {
            map[measurement_type.id] = measurement_type
        });
        return map;
    }, [measurementTypes]);

    const resetForm = () => {
        setFormData(initialFormState);
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleOpenForm = () => {
        resetForm();
        if (!isFormOpen) {
            setIsFormOpen(true)
        }
    };

    const updateMeasurementType = (typeId: number) => {
        const newFormData = {...formData, measurement_type: measurementTypesMap[typeId]};
        setFormData(newFormData)
    };

    const handleEdit = (log: Measurement) => {
        setFormData({
            id: log.id || 1, 
            value: log.value || 0,
            date: log.date || new Date().toISOString().split("T")[0],
            measurement_type: log.measurement_type || measurementTypes[0]
        });
        setEditingId(log.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit2 = (e: FormEvent) => {
        e.preventDefault();
        if (!isFormOpen) return;
        console.log(formData)

        const payload = {
            date: formData.date,
            value: formData.value,
            measurement_type: formData.measurement_type.id
        };
        console.log(payload)
        if (editingId) {
            const payloadPut = {...payload, id: formData.id}
            api.put(`api/v1/measurements/${editingId}/`, payloadPut).then(e => {console.log(e.data)})
        } else {
            api.post("api/v1/measurements/", payload).then(e => {setLogs([e.data, ...logs])})
        }
        resetForm();
    };


    // 3. Paginate
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const currentLogs = logs.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    // Reset to page 1 if user changes filter or page size
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    useEffect(() => {
        api.get<Measurement[]>("api/v1/measurements/").then((e) => {setLogs(e.data)})
    }, []);
    
    useEffect(() => {
        api.get<MeasurementType[]>("api/v1/measurement-types/").then((e) => {setMeasurementTypes([DEFAULT_MEASUREMENT_TYPE, ...e.data])})
    }, []);
    
    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            
            {/* TOP CARDS (Selection) - Unchanged */}
            <div className="grid grid-cols-1 gap-6">
                <div 
                    onClick={() => handleOpenForm()}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-lg group
                        ${isFormOpen === true ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">Quick Weight Log</h3>
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-full">⚖️</span>
                    </div>
                   <p className="text-sm text-gray-500">
                        Just hopping on the scale? Use this to quickly track your weight progress without extra details.
                    </p>
                </div>
            </div>

            {/* FORM AREA (Middle) - Unchanged logic, just keeping it consistent */}
            {isFormOpen && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className={"px-6 py-4 border-b flex justify-between items-center  bg-blue-600"}>
                        <h2 className="text-white font-bold text-lg">
                            {editingId ? 'Edit Entry' :  'Log Measurements'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit2} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 w-full max-w-xs p-2">Date</label>
                                <input type="date" required value={format(formData.date, "yyyy-MM-dd")} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ">
                                    <select className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 outline-none block w-full max-w-xs p-2"
                                     onChange={(e) => updateMeasurementType(parseInt(e.target.value))}
                                     value={formData.measurement_type? formData.measurement_type.id : ''}>{measurementTypes.map(type => (<option key={type.id} value={type.id}>{type.id === 0 ? `${type.name}` :`${type.name} (${type.unit})`}</option>))}
                                    </select>
                                </label>
                                <input type="number" step="0.1" required value={formData.value || ''} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.0" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                            <button type="submit" className={"px-6 py-2 text-white rounded-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700 "}>
                                {editingId ? 'Update Log' : 'Save Log'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TABLE CONTAINER (Bottom) */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
                {/* Header Controls */}
                <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-gray-800">History</h3>
                    
                    <div className="flex items-center gap-4">
                        {/* Page Size Selector */}
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">Show:</span>
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>                        
                    </div>
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                                            {/* // ${log.type === 'weight' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}
                                            // {log.type} */}
                                        {log.measurement_type.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">{log.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{log.value} {log.measurement_type.unit}</td>

                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleEdit(log)}
                                            className="text-gray-400 hover:text-blue-600 font-semibold text-sm"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Conditional Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <div>
                            {/* Previous Button: Only visible if NOT on page 1 */}
                            {currentPage > 1 ? (
                                <button 
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                                >
                                    Previous
                                </button>
                            ) : (
                                // Spacer to keep "Page X of Y" centered/aligned if desired, 
                                // or just render nothing to shift layout.
                                <div className="w-17.5"></div> 
                            )}
                        </div>

                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <div>
                            {/* Next Button: Only visible if NOT on last page */}
                            {currentPage < totalPages ? (
                                <button 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                                >
                                    Next
                                </button>
                            ) : (
                                <div className="w-12.5"></div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};