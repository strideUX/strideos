import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconBell, IconCheck, IconEye, IconMessage, IconList, IconCalendar } from "@tabler/icons-react"

export const metadata: Metadata = {
  title: "Inbox",
  description: "Unified notification center for all your activities",
}

// Mock notification data - will be replaced with Convex queries
const mockNotifications = [
  {
    id: "1",
    type: "task_assignment",
    title: "New task assigned",
    description: "You have been assigned 'Design homepage mockups'",
    priority: "high",
    read: false,
    timestamp: "2 hours ago",
    source: "Project: Website Redesign",
  },
  {
    id: "2",
    type: "comment",
    title: "New comment on task",
    description: "Sarah commented on 'Update user authentication'",
    priority: "medium",
    read: false,
    timestamp: "4 hours ago",
    source: "Task: Update user authentication",
  },
  {
    id: "3",
    type: "sprint_start",
    title: "Sprint started",
    description: "Sprint 'Q1 Website Launch' is now active",
    priority: "low",
    read: true,
    timestamp: "1 day ago",
    source: "Sprint: Q1 Website Launch",
  },
  {
    id: "4",
    type: "project_status",
    title: "Project status changed",
    description: "Project 'Mobile App Development' moved to 'In Progress'",
    priority: "medium",
    read: true,
    timestamp: "2 days ago",
    source: "Project: Mobile App Development",
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "task_assignment":
      return <IconList className="h-4 w-4" />
    case "comment":
      return <IconMessage className="h-4 w-4" />
    case "sprint_start":
    case "sprint_end":
      return <IconCalendar className="h-4 w-4" />
    default:
      return <IconBell className="h-4 w-4" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function InboxPage() {
  const unreadCount = mockNotifications.filter(n => !n.read).length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {/* Notification Categories */}
        <div className="flex space-x-2">
          <Button variant="default" size="sm">All</Button>
          <Button variant="outline" size="sm">Task Assignments</Button>
          <Button variant="outline" size="sm">Comments</Button>
          <Button variant="outline" size="sm">Sprint Updates</Button>
          <Button variant="outline" size="sm">Project Changes</Button>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Stay updated with all your project activities and team communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-blue-100">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {notification.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.description}
                    </p>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {notification.source}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <IconEye className="h-4 w-4" />
                    </Button>
                    {!notification.read && (
                      <Button variant="ghost" size="sm">
                        <IconCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 