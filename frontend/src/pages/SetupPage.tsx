import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";

export default function SetupPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    // Check if user info already exists
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");
    
    if (savedName && savedRole) {
      setName(savedName);
      setRole(savedRole);
    }
  }, []);

  const handleSave = () => {
    if (name.trim() && role.trim()) {
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userRole", role.trim());
      window.location.href = "/";
    }
  };

  const handleSkip = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to Sales Intelligence</CardTitle>
          <CardDescription className="text-center">
            Let's personalize your experience. This information will appear on your briefings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Your Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Marco Sesay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim() && role.trim()) {
                    handleSave();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                Your Role
              </label>
              <Input
                id="role"
                placeholder="e.g., Sales Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim() && role.trim()) {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !role.trim()}
              className="flex-1"
            >
              Save & Continue
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can update this information anytime from the settings menu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob
