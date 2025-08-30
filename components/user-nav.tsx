"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function UserNav() {
  const { userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">
          {userData.firstName} {userData.lastName}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          ({userData.role})
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
