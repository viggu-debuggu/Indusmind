"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { MemoryHeader } from "@/components/MemoryHeader";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  FileText,
  User,
  Settings,
  Info,
  Loader2
} from "lucide-react";

export default function AddExperiencePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Selector data
  const [plantsList, setPlantsList] = useState<any[]>([]);
  const [deptsList, setDeptsList] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    author_role: "",
    plant_id: "",
    department_id: "",
    equipment_id: "",
    category: "Mechanical",
    failure_mode: "",
    root_cause: "",
    maintenance_type: "",
    safety_risk: "Medium",
    process_stage: "",
    weather_condition: "Standard conditions"
  });

  const loadSelectionData = async () => {
    try {
      const [eqRes, hierarchyRes] = await Promise.all([
        api.get("/api/equipment").catch(() => ({ data: [] })),
        api.get("/api/hierarchy/tree").catch(() => ({ data: { organizations: [] } }))
      ]);
      
      setEquipmentList(eqRes.data || []);
      
      // Extract plants and departments from hierarchy tree
      const orgs = hierarchyRes.data?.organizations || [];
      const plants: any[] = [];
      const depts: any[] = [];
      
      orgs.forEach((org: any) => {
        (org.plants || []).forEach((p: any) => {
          plants.push({ id: p.id, name: p.name });
          (p.departments || []).forEach((d: any) => {
            depts.push({ id: d.id, name: d.name, plantId: p.id });
          });
        });
      });
      
      setPlantsList(plants);
      setDeptsList(depts);
    } catch (err) {
      console.error("Failed to load hierarchical structures", err);
    }
  };

  useEffect(() => {
    loadSelectionData();
  }, []);

  // Filter departments based on selected plant
  const filteredDepts = formData.plant_id
    ? deptsList.filter(d => d.plantId === parseInt(formData.plant_id))
    : deptsList;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author || !formData.author_role || !formData.title || !formData.description) {
      setFormError("All required fields in Step 1 and Step 2 must be completed.");
      setStep(1);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Clean up optional numeric fields
      const payload: any = {
        ...formData,
        plant_id: formData.plant_id ? parseInt(formData.plant_id) : null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        equipment_id: formData.equipment_id ? parseInt(formData.equipment_id) : null
      };

      await api.post("/api/expert-knowledge", payload);
      router.push("/dashboard/memory/library");
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || "Failed to submit tribal knowledge report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <MemoryHeader />

      <div className="max-w-3xl mx-auto p-6 rounded-2xl border border-slate-805 bg-slate-900 shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              {step}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {step === 1 && "Step 1: Expert Metadata & Location"}
                {step === 2 && "Step 2: Experience Detail Capture"}
                {step === 3 && "Step 3: Diagnostics & Preventive Actions"}
              </h3>
              <span className="text-[10px] text-slate-500">Step {step} of 3</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-1 rounded transition-colors ${
                  step >= s ? "bg-indigo-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {formError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* STEP 1: METADATA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Author / Expert Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. John Miller"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expert Job Role / Designation <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Retired Senior Pump Technician (30 Yrs)"
                    value={formData.author_role}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_role: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Plant Facility</label>
                  <select
                    value={formData.plant_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, plant_id: e.target.value, department_id: "" }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  >
                    <option value="">Select Plant Facility</option>
                    {plantsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    disabled={!formData.plant_id}
                  >
                    <option value="">Select Department</option>
                    {filteredDepts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipment Asset Tag</label>
                  <select
                    value={formData.equipment_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  >
                    <option value="">Select Equipment Asset</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.assetTag} - {eq.assetName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Memory Title / Symptom Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Suction Whistle signs on Centrifugal cavitation"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Knowledge Classification Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                >
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Process">Process</option>
                  <option value="Operational">Operational</option>
                  <option value="Safety">Safety</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expert experience description <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Provide a comprehensive narrative of the observations, standard operating responses, symptoms, warning sounds, or check-sheets tweaks..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 h-40 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: DIAGNOSTICS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Potential Failure Mode</label>
                  <input
                    type="text"
                    placeholder="e.g. Impeller erosion cavitation"
                    value={formData.failure_mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, failure_mode: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maintenance Type / Method</label>
                  <input
                    type="text"
                    placeholder="e.g. Viscosity audit check"
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenance_type: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Safety Risk Level</label>
                  <select
                    value={formData.safety_risk}
                    onChange={(e) => setFormData(prev => ({ ...prev, safety_risk: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Process Stage / Operation Mode</label>
                  <input
                    type="text"
                    placeholder="e.g. System hot startup cycle"
                    value={formData.process_stage}
                    onChange={(e) => setFormData(prev => ({ ...prev, process_stage: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Root Cause Explanation</label>
                  <textarea
                    placeholder="Describe exactly what triggers the physical anomaly (e.g. cooling channel restrictions)..."
                    value={formData.root_cause}
                    onChange={(e) => setFormData(prev => ({ ...prev, root_cause: e.target.value }))}
                    className="w-full px-3 py-2 h-20 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div className="flex justify-between pt-4 border-t border-slate-805">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev + 1)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-md shadow-indigo-600/10"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Experience Card
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
