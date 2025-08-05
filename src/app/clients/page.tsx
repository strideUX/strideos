import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSearch, IconBuilding, IconPlus, IconCalendar, IconUsers, IconFolder, IconChartBar } from "@tabler/icons-react"

export const metadata: Metadata = {
  title: "Clients",
  description: "Client management and project overview",
}

// Mock client data - will be replaced with Convex queries
const mockClients = [
  {
    id: "1",
    name: "Acme Corp",
    industry: "Technology",
    status: "active",
    departments: [
      {
        id: "1",
        name: "Product Development",
        projects: 3,
        activeSprints: 2,
        teamMembers: 8,
        capacity: 256,
        utilization: 85,
      },
      {
        id: "2",
        name: "Marketing",
        projects: 2,
        activeSprints: 1,
        teamMembers: 4,
        capacity: 128,
        utilization: 60,
      },
    ],
    totalProjects: 5,
    totalSprints: 3,
    totalTeamMembers: 12,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "Tech Solutions",
    industry: "Software",
    status: "active",
    departments: [
      {
        id: "3",
        name: "Engineering",
        projects: 4,
        activeSprints: 3,
        teamMembers: 12,
        capacity: 384,
        utilization: 92,
      },
    ],
    totalProjects: 4,
    totalSprints: 3,
    totalTeamMembers: 12,
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    name: "Startup Inc",
    industry: "E-commerce",
    status: "active",
    departments: [
      {
        id: "4",
        name: "Development",
        projects: 2,
        activeSprints: 1,
        teamMembers: 6,
        capacity: 192,
        utilization: 75,
      },
      {
        id: "5",
        name: "Design",
        projects: 1,
        activeSprints: 1,
        teamMembers: 3,
        capacity: 96,
        utilization: 80,
      },
    ],
    totalProjects: 3,
    totalSprints: 2,
    totalTeamMembers: 9,
    lastActivity: "3 days ago",
  },
  {
    id: "4",
    name: "Enterprise Co",
    industry: "Finance",
    status: "planning",
    departments: [
      {
        id: "6",
        name: "Digital Transformation",
        projects: 1,
        activeSprints: 0,
        teamMembers: 5,
        capacity: 160,
        utilization: 0,
      },
    ],
    totalProjects: 1,
    totalSprints: 0,
    totalTeamMembers: 5,
    lastActivity: "1 week ago",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200"
    case "planning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "on-hold":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getIndustryColor = (industry: string) => {
  switch (industry) {
    case "Technology":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Software":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "E-commerce":
      return "bg-green-100 text-green-800 border-green-200"
    case "Finance":
      return "bg-orange-100 text-orange-800 border-orange-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function ClientsPage() {
  const totalClients = mockClients.length
  const activeClients = mockClients.filter(client => client.status === "active").length
  const totalProjects = mockClients.reduce((sum, client) => sum + client.totalProjects, 0)
  const totalTeamMembers = mockClients.reduce((sum, client) => sum + client.totalTeamMembers, 0)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Client Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Across all industries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Currently engaged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <IconFolder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Total capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>
            Manage client relationships and view project status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="e-commerce">E-commerce</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockClients.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.industry}</p>
                        </div>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Projects</p>
                          <p className="font-medium">{client.totalProjects}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Sprints</p>
                          <p className="font-medium">{client.totalSprints}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Team Members</p>
                          <p className="font-medium">{client.totalTeamMembers}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Departments</p>
                          <p className="font-medium">{client.departments.length}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Departments</p>
                        <div className="space-y-1">
                          {client.departments.map((dept) => (
                            <div key={dept.id} className="flex items-center justify-between text-sm">
                              <span>{dept.name}</span>
                              <span className="text-muted-foreground">
                                {dept.utilization}% util
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last activity: {client.lastActivity}</span>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <IconPlus className="h-3 w-3 mr-1" />
                          Add Project
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <div className="space-y-4">
                {mockClients.map((client) => (
                  <Card key={client.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.industry}</p>
                        </div>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {client.departments.map((dept) => (
                          <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{dept.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {dept.teamMembers} members • {dept.capacity}h capacity
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">{dept.projects} projects</p>
                                <p className="text-xs text-muted-foreground">{dept.activeSprints} active sprints</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{dept.utilization}%</p>
                                <p className="text-xs text-muted-foreground">utilization</p>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="text-center py-8">
                <IconChartBar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Project Management</h3>
                <p className="text-muted-foreground">
                  View and manage projects across all clients
                </p>
                <Button className="mt-4">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 