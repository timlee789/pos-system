"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// 타입 정의
interface Employee {
  id: number;
  name: string;
  pin_code: string;
  role: string;
  created_at: string;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => { 
    fetchEmployees(); 
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from('employees').select('*').order('id');
    if (data) setEmployees(data);
    setLoading(false);
  };

  const handleAddEmployee = async () => {
    const name = prompt("Enter Employee Name:");
    if (!name) return;
    
    const pin = prompt(`Enter 4-digit PIN for ${name}:`);
    if (!pin || pin.length !== 4) {
        alert("PIN must be 4 digits.");
        return;
    }

    // 역할 입력 (기본값: Server)
    const roleInput = prompt("Enter Role (e.g., Manager, Server, Kitchen):", "Server");
    const role = roleInput || "Server";

    const { error } = await supabase.from('employees').insert({ 
        name, 
        pin_code: pin,
        role: role 
    });

    if (error) alert("Error: " + error.message);
    else fetchEmployees();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this employee?")) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert("Failed to delete: " + error.message);
    else fetchEmployees();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-black text-gray-800">Employee Management</h1>
            <p className="text-gray-500 mt-1">Manage staff access and PIN codes.</p>
        </div>
        <button 
            onClick={handleAddEmployee} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
            <span>+</span> Add Employee
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 mb-2">No employees found.</p>
            <button onClick={handleAddEmployee} className="text-blue-500 font-bold hover:underline">Add your first employee</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
            <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                            {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{emp.name}</h3>
                    </div>
                    
                    <div className="ml-12">
                        <p className="text-gray-400 font-mono text-sm tracking-widest">PIN: ••••</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded uppercase border ${
                            emp.role.toLowerCase() === 'manager' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                            {emp.role}
                        </span>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleDelete(emp.id)} 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg font-bold text-sm transition-colors"
                    title="Delete Employee"
                >
                    🗑️
                </button>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}