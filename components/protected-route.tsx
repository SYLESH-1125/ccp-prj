"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('citizen' | 'admin' | 'maintenance')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
        // Redirect to appropriate dashboard if user doesn't have permission
        switch (userData.role) {
          case "citizen":
            router.push("/citizen");
            break;
          case "admin":
            router.push("/admin");
            break;
          case "maintenance":
            router.push("/maintenance");
            break;
          default:
            router.push("/dashboard");
        }
      }
    }
  }, [user, userData, loading, router, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
