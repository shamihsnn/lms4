import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const { changePassword, isChangePasswordPending } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated",
      });
      
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to change password");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-12 w-12 bg-[var(--medical-primary)]/10 rounded-full flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-[var(--medical-primary)]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-800">
                Change Password
              </DialogTitle>
              <p className="text-sm text-slate-600">Update your admin password</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Current Password
            </Label>
            <Input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <Label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </Label>
            <Input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm new password"
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3 pt-4">
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
              disabled={isChangePasswordPending}
              className="flex-1 medical-gradient text-white"
            >
              {isChangePasswordPending ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
