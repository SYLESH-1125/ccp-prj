"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Clock, User, X } from "lucide-react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "Issue Assigned to You",
    message: "Broken swing chain at Central Park Playground has been assigned to you",
    type: "assignment",
    timestamp: "2025-01-20T10:30:00",
    read: false,
    priority: "medium"
  },
  {
    id: 2,
    title: "Issue Completed",
    message: "Your work on the graffiti removal has been approved by admin",
    type: "completion",
    timestamp: "2025-01-19T15:45:00",
    read: false,
    priority: "low"
  },
  {
    id: 3,
    title: "New High Priority Issue",
    message: "Urgent safety concern reported at Oak Street Playground - requires immediate attention",
    type: "urgent",
    timestamp: "2025-01-19T09:15:00",
    read: true,
    priority: "high"
  },
  {
    id: 4,
    title: "Weekly Summary",
    message: "You completed 3 issues this week. Great work!",
    type: "summary",
    timestamp: "2025-01-18T08:00:00",
    read: true,
    priority: "low"
  },
  {
    id: 5,
    title: "Issue Update",
    message: "Additional information provided for sandbox repair issue",
    type: "update",
    timestamp: "2025-01-17T14:20:00",
    read: true,
    priority: "medium"
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [userRole, setUserRole] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Get back URL based on user role
  const getBackUrl = () => {
    switch (userRole) {
      case "citizen":
        return "/citizen"
      case "admin":
        return "/admin"
      case "maintenance":
        return "/dashboard"
      default:
        return "/citizen"
    }
  }

  // Check user role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole")
      setUserRole(role)
    }
  }, [])

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <User className="h-4 w-4 text-blue-600" />
      case "completion":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "update":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader
          title="Notifications"
          backUrl={getBackUrl()}
          backText="Back"
          actions={
            unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )
          }
        />
      ) : (
        /* Desktop Header */
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getBackUrl()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Notifications</h1>
                  <p className="text-muted-foreground">
                    Stay updated with your playground maintenance activities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={`container mx-auto px-4 py-${isMobile ? '4' : '8'}`}>
        {/* Mobile notification count */}
        {isMobile && unreadCount > 0 && (
          <div className="mb-4 text-center">
            <Badge variant="destructive">{unreadCount} unread notifications</Badge>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <ResponsiveCard
              key={notification.id}
              className={`${!notification.read ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''} transition-all hover:shadow-md`}
              mobileBorderless={false}
            >
              <div className={`flex items-start gap-4 ${isMobile ? 'p-4' : 'p-6'}`}>
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`flex items-start justify-between gap-4 ${isMobile ? 'flex-col' : ''}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${!notification.read ? 'text-blue-900' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''} mb-3`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`${getPriorityColor(notification.priority)} ${isMobile ? 'text-xs' : ''}`}>
                          {notification.priority} priority
                        </Badge>
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-end' : ''}`}>
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ResponsiveCard>
          ))}
        </div>

        {notifications.length === 0 && (
          <ResponsiveCard mobileBorderless={isMobile}>
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          </ResponsiveCard>
        )}

        {/* Quick Actions */}
        <ResponsiveCard 
          title="Quick Actions"
          className="mt-8"
          mobileBorderless={isMobile}
        >
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <Link href="/report">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report New Issue
              </Link>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <Link href="/status">
                <Clock className="h-4 w-4 mr-2" />
                Track Status
              </Link>
            </Button>
          </div>
        </ResponsiveCard>
      </div>
    </div>
  )
}
