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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Shield,
	Users,
	Settings,
	Wrench,
	ArrowLeft,
	Loader2,
	CheckCircle,
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

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "",
		termsAccepted: false,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const router = useRouter();
	const { signUp, userData, loading } = useAuth();
	const isMobile = useIsMobile();

	useEffect(() => {
		// Redirect immediately when authenticated
		if (!loading && userData) {
			// Use router.replace for faster redirect
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

	const validateForm = () => {
		if (!formData.firstName || !formData.lastName) {
			setError("Please enter your full name");
			return false;
		}
		if (!formData.email) {
			setError("Please enter your email address");
			return false;
		}
		if (!formData.password) {
			setError("Please enter a password");
			return false;
		}
		if (formData.password.length < 6) {
			setError("Password must be at least 6 characters long");
			return false;
		}
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return false;
		}
		if (!formData.role) {
			setError("Please select your role");
			return false;
		}
		if (!formData.termsAccepted) {
			setError("Please accept the terms and conditions");
			return false;
		}
		return true;
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		if (!validateForm()) {
			setIsLoading(false);
			return;
		}

		try {
			await signUp(
				formData.email, 
				formData.password, 
				formData.firstName, 
				formData.lastName, 
				formData.role
			);

			setSuccess(true);

			// Redirect immediately - useEffect will handle the redirect when userData is set
			// No need for setTimeout delay
		} catch (error: any) {
			setError(error.message || "Failed to create account");
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

	if (success) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
				<div className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} space-y-6`}>
					<ResponsiveCard mobileBorderless={isMobile}>
						<div className="text-center space-y-4 pt-6">
							<CheckCircle className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-green-600 mx-auto`} />
							<h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
								Registration Successful!
							</h2>
							<p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
								Your account has been created successfully. Redirecting you to
								the login page...
							</p>
						</div>
					</ResponsiveCard>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile Layout */}
			{isMobile ? (
				<>
					<MobileHeader
						title="Create Account"
						backUrl="/"
						backText="Home"
						showLogo={true}
					/>
					
					<div className="px-4 py-6 space-y-6">
						<div className="text-center">
							<h2 className="text-lg font-semibold mb-2">Join PLAYSAFE</h2>
							<p className="text-sm text-muted-foreground">
								Join the playground safety community
							</p>
						</div>

						<ResponsiveCard 
							title="Register Your Account"
							description="Fill in your details to get started"
							mobileBorderless={true}
						>
							<form onSubmit={handleRegister} className="space-y-4">
								{/* Name Fields */}
								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label htmlFor="firstName" className="text-sm">First Name</Label>
										<Input
											id="firstName"
											type="text"
											placeholder="John"
											value={formData.firstName}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													firstName: e.target.value,
												}))
											}
											required
											className="mt-1"
										/>
									</div>
									<div>
										<Label htmlFor="lastName" className="text-sm">Last Name</Label>
										<Input
											id="lastName"
											type="text"
											placeholder="Doe"
											value={formData.lastName}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													lastName: e.target.value,
												}))
											}
											required
											className="mt-1"
										/>
									</div>
								</div>

								{/* Email */}
								<div>
									<Label htmlFor="email" className="text-sm">Email Address</Label>
									<Input
										id="email"
										type="email"
										placeholder="john.doe@example.com"
										value={formData.email}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, email: e.target.value }))
										}
										required
										className="mt-1"
									/>
								</div>

								{/* Role Selection */}
								<div>
									<Label htmlFor="role" className="text-sm">Select Your Role</Label>
									<Select
										value={formData.role}
										onValueChange={(value) =>
											setFormData((prev) => ({ ...prev, role: value }))
										}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Choose your role" />
										</SelectTrigger>
										<SelectContent>
											{userRoles.map((role) => (
												<SelectItem key={role.value} value={role.value}>
													<div className="flex items-center gap-2">
														<role.icon className={`h-4 w-4 ${role.color}`} />
														<span>{role.label}</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{formData.role && (
										<div className="mt-2 p-2 rounded-lg bg-muted/50">
											<p className="text-xs text-muted-foreground">
												{
													userRoles.find((r) => r.value === formData.role)
														?.description
												}
											</p>
										</div>
									)}
								</div>

								{/* Password */}
								<div>
									<Label htmlFor="password" className="text-sm">Password</Label>
									<Input
										id="password"
										type="password"
										placeholder="Minimum 6 characters"
										value={formData.password}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												password: e.target.value,
											}))
										}
										required
										className="mt-1"
									/>
								</div>

								{/* Confirm Password */}
								<div>
									<Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										placeholder="Re-enter your password"
										value={formData.confirmPassword}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												confirmPassword: e.target.value,
											}))
										}
										required
										className="mt-1"
									/>
								</div>

								{/* Terms and Conditions */}
								<div className="flex items-start space-x-2">
									<Checkbox
										id="terms"
										checked={formData.termsAccepted}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												termsAccepted: checked as boolean,
											}))
										}
									/>
									<div className="grid gap-1.5 leading-none">
										<Label
											htmlFor="terms"
											className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											I agree to the terms and conditions
										</Label>
										<p className="text-xs text-muted-foreground">
											You agree to our{" "}
											<Link
												href="/terms"
												className="text-primary hover:underline"
											>
												Terms of Service
											</Link>{" "}
											and{" "}
											<Link
												href="/privacy"
												className="text-primary hover:underline"
											>
												Privacy Policy
											</Link>
											.
										</p>
									</div>
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
											Creating Account...
										</>
									) : (
										"Create Account"
									)}
								</Button>
							</form>
						</ResponsiveCard>

						{/* User Roles - Simplified for mobile */}
						<ResponsiveCard 
							title="User Roles"
							description="Learn about access levels"
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
								Already have an account?{" "}
								<Link href="/login" className="text-primary hover:underline">
									Sign in here
								</Link>
							</p>
						</div>
					</div>
				</>
			) : (
				/* Desktop Layout */
				<div className="flex items-center justify-center py-12 px-4 min-h-screen">
					<div className="w-full max-w-md space-y-6">
						{/* Header */}
						<div className="text-center">
							<Button variant="ghost" size="sm" asChild className="mb-4">
								<Link href="/">
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Home
								</Link>
							</Button>
							<div className="flex items-center justify-center gap-2 mb-4">
								<Shield className="h-8 w-8 text-primary" />
								<h1 className="text-2xl font-bold">PLAYSAFE</h1>
							</div>
							<h2 className="text-xl font-semibold">Create Account</h2>
							<p className="text-muted-foreground">
								Join the playground safety community
							</p>
						</div>

				<ResponsiveCard>
					<CardHeader>
						<CardTitle>Register Your Account</CardTitle>
						<CardDescription>
							Fill in your details to get started
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleRegister} className="space-y-4">
							{/* Name Fields */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="firstName">First Name</Label>
									<Input
										id="firstName"
										type="text"
										placeholder="John"
										value={formData.firstName}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												firstName: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div>
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										type="text"
										placeholder="Doe"
										value={formData.lastName}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												lastName: e.target.value,
											}))
										}
										required
									/>
								</div>
							</div>

							{/* Email */}
							<div>
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="john.doe@example.com"
									value={formData.email}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, email: e.target.value }))
									}
									required
								/>
							</div>

							{/* Role Selection */}
							<div>
								<Label htmlFor="role">Select Your Role</Label>
								<Select
									value={formData.role}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, role: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Choose your role" />
									</SelectTrigger>
									<SelectContent>
										{userRoles.map((role) => (
											<SelectItem key={role.value} value={role.value}>
												<div className="flex items-center gap-2">
													<role.icon className={`h-4 w-4 ${role.color}`} />
													<span>{role.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{formData.role && (
									<div className="mt-2 p-3 rounded-lg bg-muted/50">
										<p className="text-sm text-muted-foreground">
											{
												userRoles.find((r) => r.value === formData.role)
													?.description
											}
										</p>
									</div>
								)}
							</div>

							{/* Password */}
							<div>
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Minimum 6 characters"
									value={formData.password}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											password: e.target.value,
										}))
									}
									required
								/>
							</div>

							{/* Confirm Password */}
							<div>
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									placeholder="Re-enter your password"
									value={formData.confirmPassword}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											confirmPassword: e.target.value,
										}))
									}
									required
								/>
							</div>

							{/* Terms and Conditions */}
							<div className="flex items-start space-x-2">
								<Checkbox
									id="terms"
									checked={formData.termsAccepted}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											termsAccepted: checked as boolean,
										}))
									}
								/>
								<div className="grid gap-1.5 leading-none">
									<Label
										htmlFor="terms"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										I agree to the terms and conditions
									</Label>
									<p className="text-xs text-muted-foreground">
										You agree to our{" "}
										<Link
											href="/terms"
											className="text-primary hover:underline"
										>
											Terms of Service
										</Link>{" "}
										and{" "}
										<Link
											href="/privacy"
											className="text-primary hover:underline"
										>
											Privacy Policy
										</Link>
										.
									</p>
								</div>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating Account...
									</>
								) : (
									"Create Account"
								)}
							</Button>
						</form>
					</CardContent>
				</ResponsiveCard>

				{/* Role Information */}
				<ResponsiveCard>
					<CardHeader>
						<CardTitle className="text-lg">User Roles</CardTitle>
						<CardDescription>
							Learn about different access levels
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{userRoles.map((role) => (
							<div
								key={role.value}
								className="flex items-start gap-3 p-3 rounded-lg border"
							>
								<div className={`p-2 rounded-lg ${role.bgColor}`}>
									<role.icon className={`h-4 w-4 ${role.color}`} />
								</div>
								<div>
									<h4 className="font-medium">{role.label}</h4>
									<p className="text-sm text-muted-foreground">
										{role.description}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</ResponsiveCard>

				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
