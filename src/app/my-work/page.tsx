import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconSearch, IconCalendar, IconUser, IconFolder } from "@tabler/icons-react"

export const metadata: Metadata = {
  title: "My Work",
  description: "Personal dashboard with your tasks and todos",
}

// Mock work data - will be replaced with Convex queries
const mockWorkItems = [
  {
    id: "1",
    type: "task",
    title: "Design homepage mockups",
    description: "Create wireframes and mockups for the new homepage design",
    status: "in-progress",
    priority: "high",
    assignee: "You",
    project: "Website Redesign",
    dueDate: "2024-02-15",
    estimatedHours: 8,
  },
  {
    id: "2",
    type: "todo",
    title: "Review competitor analysis",
    description: "Analyze competitor websites and document key findings",
    status: "todo",
    priority: "medium",
    assignee: "You",
    project: "Personal",
    dueDate: "2024-02-10",
    estimatedHours: 4,
  },
  {
    id: "3",
    type: "task",
    title: "Update user authentication",
    description: "Implement new authentication flow with OAuth support",
    status: "todo",
    priority: "high",
    assignee: "You",
    project: "Mobile App Development",
    dueDate: "2024-02-20",
    estimatedHours: 12,
  },
  {
    id: "4",
    type: "todo",
    title: "Schedule team meeting",
    description: "Coordinate with team for weekly standup meeting",
    status: "done",
    priority: "low",
    assignee: "You",
    project: "Personal",
    dueDate: "2024-02-08",
    estimatedHours: 1,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800 border-gray-200"
    case "in-progress":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "in-review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "done":
      return "bg-green-100 text-green-800 border-green-200"
    case "blocked":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
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

const getTypeIcon = (type: string) => {
  switch (type) {
    case "task":
      return <IconFolder className="h-4 w-4" />
    case "todo":
      return <IconUser className="h-4 w-4" />
    default:
      return <IconFolder className="h-4 w-4" />
  }
}

export default function MyWorkPage() {
  const totalItems = mockWorkItems.length
  const completedItems = mockWorkItems.filter(item => item.status === "done").length
  const inProgressItems = mockWorkItems.filter(item => item.status === "in-progress").length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Work</h2>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Todo
        </Button>
      </div>

      {/* Work Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <IconFolder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Tasks and todos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressItems}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedItems}</div>
            <p className="text-xs text-muted-foreground">
              Finished this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Upcoming deadlines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>My Work Items</CardTitle>
          <CardDescription>
            Manage your assigned tasks and personal todos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks and todos..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="tasks">Tasks Only</SelectItem>
                <SelectItem value="todos">Todos Only</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Items List */}
          <div className="space-y-4">
            {mockWorkItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-4 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-blue-100">
                    {getTypeIcon(item.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {item.estimatedHours}h
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {item.dueDate}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      Project: {item.project}
                    </span>
                    <span className="text-xs text-gray-500">
                      Assignee: {item.assignee}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex space-x-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 