"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	MapPin,
	Camera,
	Bell,
	Users,
	Shield,
	Clock,
	AlertTriangle,
	CheckCircle,
	LogOut,
	Menu,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile-header";
import { ResponsiveCard } from "@/components/responsive-card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const { user, userData, logout } = useAuth();
	const router = useRouter();
	const isMobile = useIsMobile();

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	const getDashboardRoute = () => {
		if (!userData) return "/dashboard";
		switch (userData.role) {
			case "admin":
				return "/admin";
			case "citizen":
				return "/citizen";
			case "maintenance":
				return "/maintenance";
			default:
				return "/dashboard";
		}
	};

	// Mobile Navigation Component
	const MobileNav = () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" size="sm" className="md:hidden">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-80">
				<div className="flex flex-col space-y-4 mt-8">
					{user ? (
						<>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href={getDashboardRoute()}>Dashboard</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/report">Report Issue</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/issues">All Issues</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/playground">Playgrounds</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/status">Status</Link>
							</Button>
							<div className="border-t pt-4">
								<Button variant="outline" className="w-full" onClick={handleLogout}>
									<LogOut className="h-4 w-4 mr-2" />
									Logout
								</Button>
							</div>
						</>
					) : (
						<>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/issues">View Issues</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/playground">View Playgrounds</Link>
							</Button>
							<Button variant="ghost" className="justify-start" asChild>
								<Link href="/status">Safety Status</Link>
							</Button>
							<div className="border-t pt-4 space-y-2">
								<Button variant="outline" className="w-full" asChild>
									<Link href="/login">Login</Link>
								</Button>
								<Button className="w-full" asChild>
									<Link href="/register">Sign Up</Link>
								</Button>
							</div>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);

	return (
		<div className="min-h-screen bg-background">
			{/* Header Navigation */}
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
							<h1 className="text-lg md:text-2xl font-bold text-foreground">PLAYSAFE</h1>
						</div>

						{/* Desktop Navigation */}
						{user ? (
							<>
								<nav className="hidden md:flex items-center gap-6">
									<Button variant="ghost" size="sm" asChild>
										<Link href={getDashboardRoute()}>Dashboard</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/report">Report Issue</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/issues">All Issues</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/playground">Playgrounds</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/status">Status</Link>
									</Button>
								</nav>
								<div className="flex items-center gap-2">
									{!isMobile && <NotificationBell />}
									<Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
										<LogOut className="h-4 w-4 mr-2" />
										Logout
									</Button>
									<MobileNav />
								</div>
							</>
						) : (
							<>
								<nav className="hidden md:flex items-center gap-6">
									<Button variant="ghost" size="sm" asChild>
										<Link href="/issues">View Issues</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/playground">View Playgrounds</Link>
									</Button>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/status">Safety Status</Link>
									</Button>
								</nav>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" asChild className="hidden md:flex">
										<Link href="/login">Login</Link>
									</Button>
									<Button size="sm" asChild className="hidden md:flex">
										<Link href="/register">Sign Up</Link>
									</Button>
									<MobileNav />
								</div>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="py-8 md:py-16 px-4">
				<div className="container mx-auto text-center max-w-4xl">
					<Badge variant="secondary" className="mb-4 text-xs md:text-sm">
						Real-Time Playground Safety
					</Badge>
					<h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-balance mb-4 md:mb-6 leading-tight">
						Keep Our Playgrounds Safe & Well-Maintained
					</h2>
					<p className="text-base md:text-xl text-muted-foreground text-balance mb-6 md:mb-8 max-w-2xl mx-auto px-4">
						Report issues instantly, track maintenance progress, and help create
						safer play spaces for our community's children.
					</p>
					
					<div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
						<Button size={isMobile ? "default" : "lg"} className="gap-2 w-full sm:w-auto" asChild>
							<Link href="/report">
								<Camera className="h-4 w-4 md:h-5 md:w-5" />
								Report an Issue
							</Link>
						</Button>
						<Button
							variant="outline"
							size={isMobile ? "default" : "lg"}
							className="gap-2 bg-transparent w-full sm:w-auto"
							asChild
						>
							<Link href="/playground">
								<MapPin className="h-4 w-4 md:h-5 md:w-5" />
								Find Playgrounds
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Quick Stats */}
			<section className="py-8 md:py-12 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
						<div className="text-center p-4">
							<div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">247</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								Issues Resolved
							</div>
						</div>
						<div className="text-center p-4">
							<div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">18</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								Active Playgrounds
							</div>
						</div>
						<div className="text-center p-4">
							<div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">1.5s</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								Avg Report Time
							</div>
						</div>
						<div className="text-center p-4">
							<div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">95%</div>
							<div className="text-xs md:text-sm text-muted-foreground">Success Rate</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h3 className="text-3xl font-bold mb-4">How PLAYSAFE Works</h3>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Our three-way system connects citizens, administrators, and
							maintenance staff for efficient playground management.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Citizens */}
						<ResponsiveCard className="text-center" mobileBorderless={isMobile}>
							<CardHeader>
								<div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Users className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>For Citizens</CardTitle>
								<CardDescription>
									Report issues and track progress
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<Camera className="h-4 w-4 text-muted-foreground" />
									<span>Photo & GPS reporting</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Bell className="h-4 w-4 text-muted-foreground" />
									<span>Real-time notifications</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span>Status tracking</span>
								</div>
							</CardContent>
						</ResponsiveCard>

						{/* Admin */}
						<ResponsiveCard className="text-center" mobileBorderless={isMobile}>
							<CardHeader>
								<div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Shield className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>For Administrators</CardTitle>
								<CardDescription>
									Manage and prioritize maintenance
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<AlertTriangle className="h-4 w-4 text-muted-foreground" />
									<span>Issue prioritization</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span>Staff assignment</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<span>Multi-site management</span>
								</div>
							</CardContent>
						</ResponsiveCard>

						{/* Maintenance Staff */}
						<ResponsiveCard className="text-center" mobileBorderless={isMobile}>
							<CardHeader>
								<div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<CheckCircle className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>For Maintenance Staff</CardTitle>
								<CardDescription>
									Receive and complete assignments
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<Bell className="h-4 w-4 text-muted-foreground" />
									<span>Task notifications</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Camera className="h-4 w-4 text-muted-foreground" />
									<span>Progress updates</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<CheckCircle className="h-4 w-4 text-muted-foreground" />
									<span>Completion tracking</span>
								</div>
							</CardContent>
						</ResponsiveCard>
					</div>
				</div>
			</section>

			{/* Recent Activity */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="flex items-center justify-between mb-8">
						<h3 className="text-2xl font-bold">Recent Activity</h3>
						<Button variant="outline" size="sm" asChild>
							<Link href="/issues">View All</Link>
						</Button>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						<ResponsiveCard mobileBorderless={isMobile}>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<Badge variant="secondary">Resolved</Badge>
									<span className="text-sm text-muted-foreground">
										2 hours ago
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<h4 className="font-semibold mb-2">Broken Swing Repaired</h4>
								<p className="text-sm text-muted-foreground mb-3">
									Central Park Playground - Swing set chain replaced
								</p>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" />
									<span>Central Park</span>
								</div>
							</CardContent>
						</ResponsiveCard>

						<ResponsiveCard mobileBorderless={isMobile}>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<Badge variant="outline">In Progress</Badge>
									<span className="text-sm text-muted-foreground">
										4 hours ago
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<h4 className="font-semibold mb-2">Slide Surface Cleaning</h4>
								<p className="text-sm text-muted-foreground mb-3">
									Riverside Playground - Graffiti removal in progress
								</p>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" />
									<span>Riverside Park</span>
								</div>
							</CardContent>
						</ResponsiveCard>

						<ResponsiveCard mobileBorderless={isMobile}>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<Badge variant="destructive">Urgent</Badge>
									<span className="text-sm text-muted-foreground">
										6 hours ago
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<h4 className="font-semibold mb-2">Safety Hazard Reported</h4>
								<p className="text-sm text-muted-foreground mb-3">
									Oak Street Playground - Loose equipment bolts
								</p>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" />
									<span>Oak Street Park</span>
								</div>
							</CardContent>
						</ResponsiveCard>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-4">
				<div className="container mx-auto text-center max-w-3xl">
					<h3 className="text-3xl font-bold mb-4">
						Ready to Make a Difference?
					</h3>
					<p className="text-muted-foreground mb-8">
						Join our community of safety-conscious citizens helping to maintain
						safe, enjoyable playgrounds for everyone.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" className="gap-2">
							<Camera className="h-5 w-5" />
							Report Your First Issue
						</Button>
						<Button variant="outline" size="lg">
							Learn More
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-12 px-4">
				<div className="container mx-auto">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<Shield className="h-6 w-6 text-primary" />
								<span className="font-bold">PLAYSAFE</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Real-time playground maintenance and safety tracking for safer
								communities.
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-3">Features</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>Issue Reporting</li>
								<li>Status Tracking</li>
								<li>GPS Integration</li>
								<li>Push Notifications</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-3">Users</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>Citizens</li>
								<li>Administrators</li>
								<li>Maintenance Staff</li>
								<li>Community Groups</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-3">Support</h4>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>Help Center</li>
								<li>Contact Us</li>
								<li>Privacy Policy</li>
								<li>Terms of Service</li>
							</ul>
						</div>
					</div>
					<div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
						<p>&copy; 2025 PLAYSAFE. Built for safer communities.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
