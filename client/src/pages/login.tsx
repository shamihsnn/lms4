import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import ChangePasswordModal from "@/components/auth/change-password-modal";
import Logo from "@/components/brand/logo";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { login, isLoginPending } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(formData);
      toast({
        title: "Login successful",
        description: "Welcome to Laboratory Management System",
      });
    } catch (error: any) {
      setError(error.message || "Login failed");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-cyan-50">
      <div className="max-w-md w-full space-y-8">
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200">
          <CardContent className="pt-8 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4">
                <Logo className="h-16 w-auto mx-auto" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">AL-QASIM Clinic & Lab</h2>
              <p className="text-slate-600 mt-2">Secure Admin Access</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--medical-primary)] focus:border-[var(--medical-primary)] transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--medical-primary)] focus:border-[var(--medical-primary)] transition-colors pr-12"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: !!checked }))
                    }
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-slate-600">
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-[var(--medical-primary)] hover:text-[var(--medical-primary-dark)] p-0"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isLoginPending}
                className="w-full medical-gradient text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-[var(--medical-primary)]/25"
              >
                {isLoginPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Error Message */}
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
