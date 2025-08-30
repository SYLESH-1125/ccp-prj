"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

// Mock recent notifications for the bell dropdown
const recentNotifications = [
	{
		id: 1,
		title: "Issue Resolved",
		message: "Broken swing chain at Central Park has been fixed",
		type: "resolution",
		timestamp: "2 hours ago",
		read: false,
	},
	{
		id: 2,
		title: "Maintenance Update",
		message: "Graffiti removal work started at Riverside Park",
		type: "progress",
		timestamp: "4 hours ago",
		read: false,
	},
	{
		id: 3,
		title: "Safety Alert",
		message: "High priority issue reported at Oak Street",
		type: "alert",
		timestamp: "6 hours ago",
		read: true,
	},
];

export function NotificationBell() {
	const [notifications, setNotifications] = useState(recentNotifications);
	const [isOpen, setIsOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		// Check if user is authenticated
		const checkAuth = () => {
			if (typeof window !== "undefined") {
				const userRole = localStorage.getItem("userRole");
				setIsAuthenticated(!!userRole);
			}
		};

		checkAuth();

		// Listen for auth changes
		const handleStorageChange = () => {
			checkAuth();
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "resolution":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "progress":
				return <Clock className="h-4 w-4 text-blue-600" />;
			case "alert":
				return <AlertTriangle className="h-4 w-4 text-red-600" />;
			default:
				return <Bell className="h-4 w-4 text-gray-600" />;
		}
	};

	const markAsRead = (id: number) => {
		setNotifications((prev) =>
			prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
		);
	};

	// Simulate real-time notifications
	useEffect(() => {
		const interval = setInterval(() => {
			// Randomly add a new notification (for demo purposes)
			if (Math.random() > 0.95) {
				const newNotification = {
					id: Date.now(),
					title: "New Update",
					message: "A playground issue has been updated",
					type: "progress",
					timestamp: "Just now",
					read: false,
				};
				setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	// Don't render if not authenticated
	if (!isAuthenticated) {
		return null;
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="relative bg-transparent">
					<Bell className="h-4 w-4" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
						>
							{unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80 p-0">
				<Card className="border-0 shadow-none">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">Notifications</CardTitle>
							<Badge variant="secondary">{unreadCount} unread</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 max-h-96 overflow-y-auto">
						{notifications.slice(0, 5).map((notification) => (
							<div
								key={notification.id}
								className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
									!notification.read ? "bg-primary/5 border-primary/20" : ""
								}`}
								onClick={() => markAsRead(notification.id)}
							>
								<div className="flex items-start gap-3">
									{getNotificationIcon(notification.type)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p
												className={`text-sm font-medium truncate ${
													!notification.read ? "font-semibold" : ""
												}`}
											>
												{notification.title}
											</p>
											{!notification.read && (
												<div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
											)}
										</div>
										<p className="text-xs text-muted-foreground truncate">
											{notification.message}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{notification.timestamp}
										</p>
									</div>
								</div>
							</div>
						))}

						{notifications.length === 0 && (
							<div className="text-center py-6">
								<Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">
									No notifications
								</p>
							</div>
						)}
					</CardContent>
					<div className="border-t p-3">
						<Button
							variant="outline"
							className="w-full bg-transparent"
							asChild
							onClick={() => setIsOpen(false)}
						>
							<Link href="/notifications">View All Notifications</Link>
						</Button>
					</div>
				</Card>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
