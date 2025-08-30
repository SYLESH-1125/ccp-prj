"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Shield,
	Users,
	Settings,
	Wrench,
	ArrowLeft,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile-header";
import { ResponsiveCard } from "@/components/responsive-card";

const userRoles = [
	{
		value: "citizen",
		label: "Citizen",
		description: "Report issues and track maintenance progress",
		icon: Users,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	{
		value: "admin",
		label: "Administrator",
		description: "Manage reports and oversee maintenance operations",
		icon: Settings,
		color: "text-purple-600",
		bgColor: "bg-purple-100",
	},
	{
		value: "maintenance",
		label: "Maintenance Staff",
		description: "Receive assignments and update task progress",
		icon: Wrench,
		color: "text-green-600",
		bgColor: "bg-green-100",
	},
];

export default function LoginPage() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const { signIn, userData, loading } = useAuth();
	const isMobile = useIsMobile();

	useEffect(() => {
		// Redirect immediately when authenticated
		if (!loading && userData) {
			// Use router.replace for faster redirect without adding to history
			switch (userData.role) {
				case "citizen":
					router.replace("/citizen");
					break;
				case "admin":
					router.replace("/admin");
					break;
				case "maintenance":
					router.replace("/maintenance");
					break;
				default:
					router.replace("/dashboard");
			}
		}
	}, [userData, loading, router]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			await signIn(formData.email, formData.password);
			// Redirect will be handled by useEffect when userData is updated
		} catch (error: any) {
			setError(error.message || "Failed to sign in");
		}

		setIsLoading(false);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile Layout */}
			{isMobile ? (
				<>
					<MobileHeader
						title="Sign In"
						backUrl="/"
						backText="Home"
						showLogo={true}
					/>
					
					<div className="px-4 py-6 space-y-6">
						<div className="text-center">
							<h2 className="text-lg font-semibold mb-2">Welcome Back</h2>
							<p className="text-sm text-muted-foreground">
								Access your playground safety dashboard
							</p>
						</div>

						<ResponsiveCard 
							title="Login to Your Account"
							description="Enter your credentials to continue"
							mobileBorderless={true}
						>
							<form onSubmit={handleLogin} className="space-y-4">
								{/* Email */}
								<div>
									<Label htmlFor="email" className="text-sm">Email Address</Label>
									<Input
										id="email"
										type="email"
										placeholder="Enter your email"
										value={formData.email}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, email: e.target.value }))
										}
										className="mt-1"
										required
									/>
								</div>

								{/* Password */}
								<div>
									<Label htmlFor="password" className="text-sm">Password</Label>
									<Input
										id="password"
										type="password"
										placeholder="Enter your password"
										value={formData.password}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												password: e.target.value,
											}))
										}
										className="mt-1"
										required
									/>
								</div>

								{error && (
									<Alert variant="destructive">
										<AlertDescription className="text-sm">{error}</AlertDescription>
									</Alert>
								)}

								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Signing In...
										</>
									) : (
										"Sign In"
									)}
								</Button>
							</form>
						</ResponsiveCard>

						{/* Role Information - Simplified for mobile */}
						<ResponsiveCard 
							title="User Roles"
							description="Different access levels"
							mobileBorderless={true}
						>
							<div className="space-y-3">
								{userRoles.map((role) => (
									<div
										key={role.value}
										className="flex items-start gap-3 p-2 rounded-lg border"
									>
										<div className={`p-1.5 rounded-lg ${role.bgColor}`}>
											<role.icon className={`h-3 w-3 ${role.color}`} />
										</div>
										<div>
											<h4 className="font-medium text-sm">{role.label}</h4>
											<p className="text-xs text-muted-foreground">
												{role.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</ResponsiveCard>

						<div className="text-center">
							<p className="text-xs text-muted-foreground">
								Don't have an account?{" "}
								<Link href="/register" className="text-primary hover:underline">
									Sign up here
								</Link>
							</p>
						</div>
					</div>
				</>
			) : (
				/* Desktop Layout */
				<div className="flex items-center justify-center py-6 md:py-12 px-4 min-h-screen">
					<div className="w-full max-w-md space-y-4 md:space-y-6">
						{/* Header */}
						<div className="text-center">
							<Button variant="ghost" size="sm" asChild className="mb-3 md:mb-4">
								<Link href="/">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Home
								</Link>
							</Button>
							<div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
								<Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
								<h1 className="text-xl md:text-2xl font-bold">PLAYSAFE</h1>
							</div>
							<h2 className="text-lg md:text-xl font-semibold">Sign In</h2>
							<p className="text-sm md:text-base text-muted-foreground">
								Access your playground safety dashboard
							</p>
						</div>

				<ResponsiveCard className="border-0 md:border shadow-none md:shadow-sm">
					<CardHeader className="px-4 md:px-6 pb-4">
						<CardTitle className="text-lg md:text-xl">Login to Your Account</CardTitle>
						<CardDescription className="text-sm">
							Choose your role and enter your credentials
						</CardDescription>
					</CardHeader>
					<CardContent className="px-4 md:px-6">
						<form onSubmit={handleLogin} className="space-y-4">
							{/* Email */}
							<div>
								<Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, email: e.target.value }))
									}
									className="mt-1 h-10 md:h-11"
									required
								/>
							</div>

							{/* Password */}
							<div>
								<Label htmlFor="password" className="text-sm font-medium">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={formData.password}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											password: e.target.value,
										}))
									}
									className="mt-1 h-10 md:h-11"
									required
								/>
							</div>

							{error && (
								<Alert variant="destructive" className="text-sm">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button type="submit" className="w-full h-10 md:h-11" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In"
								)}
							</Button>
						</form>
					</CardContent>
				</ResponsiveCard>

				{/* Role Information - Collapsible on mobile */}
				<ResponsiveCard className="border-0 md:border shadow-none md:shadow-sm">
					<CardHeader className="px-4 md:px-6 pb-3">
						<CardTitle className="text-base md:text-lg">User Roles</CardTitle>
						<CardDescription className="text-xs md:text-sm">
							Learn about different access levels
						</CardDescription>
					</CardHeader>
					<CardContent className="px-4 md:px-6 space-y-2 md:space-y-3">
						{userRoles.map((role) => (
							<div
								key={role.value}
								className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg border"
							>
								<div className={`p-1.5 md:p-2 rounded-lg ${role.bgColor}`}>
									<role.icon className={`h-3 w-3 md:h-4 md:w-4 ${role.color}`} />
								</div>
								<div className="min-w-0 flex-1">
									<h4 className="text-sm md:text-base font-medium">{role.label}</h4>
									<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
										{role.description}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</ResponsiveCard>

				<div className="text-center px-4">
					<p className="text-xs md:text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link href="/register" className="text-primary hover:underline font-medium">
							Sign up here
						</Link>
					</p>
				</div>
			</div>
		</div>
		)}
	</div>
	);
}
