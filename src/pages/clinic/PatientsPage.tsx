import React, { useState } from "react";
import { usePatients, useCreatePatient } from "@/hooks/usePatients";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function PatientsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // For demo: clinic slug isn't used to filter in this starter; in production, map slug -> clinic_id
  const { data: patients, isLoading, isError } = usePatients();
  const createPatient = useCreatePatient();

  const { register, handleSubmit } = useForm();

  async function onCreate(values: any) {
    try {
      // For demo, require clinic_id to be looked up; fallback to null (RLS will block if necessary)
      await createPatient.mutateAsync({
        clinic_id: values.clinic_id || null,
        first_name: values.first_name,
        last_name: values.last_name,
        date_of_birth: values.date_of_birth || null
      });
      toast.success("Patient created");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create patient");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Patients</h3>
      </div>

      <div className="mb-8">
        <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label>First name</Label>
            <Input {...register("first_name", { required: true })} />
          </div>
          <div>
            <Label>Last name</Label>
            <Input {...register("last_name", { required: true })} />
          </div>
          <div>
            <Label>DOB</Label>
            <Input type="date" {...register("date_of_birth")} />
          </div>
          <div className="sm:col-span-3">
            <Label>Clinic ID (for demo)</Label>
            <Input {...register("clinic_id")} placeholder="Optional clinic id (demo only)" />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit">Create patient</Button>
          </div>
        </form>
      </div>

      <div>
        {isLoading && <div>Loading patients...</div>}
        {isError && <div className="text-red-500">Error loading patients</div>}
        {!isLoading && patients?.length === 0 && <div>No patients yet</div>}
        {!isLoading && patients?.length > 0 && (
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">DOB</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients!.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.date_of_birth || "-"}</td>
                  <td className="text-right">
                    <Link to={`/clinic/${slug}/patients/${p.id}`} className="text-primary">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
