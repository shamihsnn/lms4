import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit3, Eye } from "lucide-react";
import EditIdModal from "@/components/modals/edit-id-modal";
import type { Patient, InsertPatient } from "@shared/schema";

export default function Patients() {
  const [formData, setFormData] = useState({
    patientId: "",
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
  });
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);

  const { toast } = useToast();

  // Get next patient ID
  const { data: nextIdData } = useQuery<{ nextId: string }>({
    queryKey: ["/api/patients/next-id"],
  });

  // Get all patients
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/next-id"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({
        patientId: "",
        name: "",
        age: "",
        gender: "",
        phone: "",
        address: "",
      });
      toast({
        title: "Patient registered successfully",
        description: "New patient has been added to the system",
      });
    },
  });

  // Update patient ID mutation
  const updatePatientIdMutation = useMutation({
    mutationFn: async ({ id, newPatientId }: { id: number; newPatientId: string }) => {
      const response = await apiRequest("PUT", `/api/patients/${id}/patient-id`, { newPatientId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient ID updated successfully",
        description: "Patient ID has been changed",
      });
    },
  });

  // Set initial patient ID when component loads
  useEffect(() => {
    if (nextIdData?.nextId && !formData.patientId) {
      setFormData(prev => ({ ...prev, patientId: nextIdData.nextId }));
    }
  }, [nextIdData, formData.patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Patient ID and Name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPatientMutation.mutateAsync({
        patientId: formData.patientId,
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        phone: formData.phone || null,
        address: formData.address || null,
        createdBy: undefined,
        modifiedBy: undefined,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register patient",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleEditId = (patientId: number) => {
    setEditingPatientId(patientId);
  };

  const handleIdUpdate = async (newId: string) => {
    if (editingPatientId) {
      try {
        await updatePatientIdMutation.mutateAsync({
          id: editingPatientId,
          newPatientId: newId,
        });
        setEditingPatientId(null);
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update patient ID",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Patient Management</h1>
        <p className="text-slate-600">Register and manage patient information</p>
      </div>

      {/* Patient Registration Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Patient Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Patient ID with Edit Button */}
            <div className="col-span-1">
              <Label className="block text-sm font-medium text-slate-700 mb-2">Patient ID</Label>
              <div className="flex">
                <Input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  readOnly
                  className="flex-1 rounded-r-none bg-slate-50 text-slate-600"
                />
                <Button
                  type="button"
                  className="rounded-l-none bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)]"
                  onClick={() => handleEditId(0)} // Use 0 for new patient ID editing
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Full Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Age</Label>
              <Input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Enter age"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Gender</Label>
              <Select value={formData.gender} onValueChange={handleGenderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <Label className="block text-sm font-medium text-slate-700 mb-2">Address</Label>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter complete address"
              />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                disabled={createPatientMutation.isPending}
                className="bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white"
              >
                {createPatientMutation.isPending ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No patients registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.patientId}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.age || "-"}</TableCell>
                        <TableCell className="capitalize">{patient.gender || "-"}</TableCell>
                        <TableCell>{patient.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditId(patient.id)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditIdModal
        isOpen={editingPatientId !== null}
        onClose={() => setEditingPatientId(null)}
        currentId={editingPatientId ? patients.find(p => p.id === editingPatientId)?.patientId || "" : formData.patientId}
        idType="Patient"
        onUpdate={handleIdUpdate}
      />
    </div>
  );
}
