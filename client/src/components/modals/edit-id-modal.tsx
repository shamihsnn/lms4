import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, AlertCircle } from "lucide-react";

interface EditIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentId: string;
  idType: "Patient" | "Test";
  onUpdate: (newId: string) => void;
}

export default function EditIdModal({ isOpen, onClose, currentId, idType, onUpdate }: EditIdModalProps) {
  const [password, setPassword] = useState("");
  const [newId, setNewId] = useState("");
  const [step, setStep] = useState<"verify" | "edit">("verify");
  const [error, setError] = useState("");

  const { verifyPassword, isVerifyPasswordPending } = useAuth();
  const { toast } = useToast();

  const handlePasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await verifyPassword(password);
      if (result.valid) {
        setStep("edit");
        setNewId(currentId);
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to verify password");
    }
  };

  const handleIdUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newId.trim()) {
      setError("ID cannot be empty");
      return;
    }

    if (newId === currentId) {
      setError("New ID must be different from current ID");
      return;
    }

    onUpdate(newId);
    handleClose();
  };

  const handleClose = () => {
    setPassword("");
    setNewId("");
    setStep("verify");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-800">
                {step === "verify" ? "Enter Admin Password" : `Edit ${idType} ID`}
              </DialogTitle>
              <p className="text-sm text-slate-600">
                {step === "verify" 
                  ? `Password required to edit ${idType} ID` 
                  : `Change ${idType} ID from ${currentId}`
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        {step === "verify" ? (
          <form onSubmit={handlePasswordVerify}>
            <div className="mb-6">
              <Label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifyPasswordPending}
                className="flex-1 bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white"
              >
                {isVerifyPasswordPending ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleIdUpdate}>
            <div className="mb-6">
              <Label className="block text-sm font-medium text-slate-700 mb-2">
                New {idType} ID
              </Label>
              <Input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                required
                placeholder={`Enter new ${idType.toLowerCase()} ID`}
              />
            </div>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[var(--medical-primary)] hover:bg-[var(--medical-primary-dark)] text-white"
              >
                Update ID
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
