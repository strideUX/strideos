import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { IconSearch, IconUser, IconCalendar, IconBuilding, IconMail } from "@tabler/icons-react"

export const metadata: Metadata = {
  title: "Team",
  description: "Team capacity planning and member management",
}

// Mock team data - will be replaced with Convex queries
const mockTeamMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Senior Designer",
    department: "Design",
    avatar: "",
    workload: 85,
    currentSprint: "Q1 Website Launch",
    activeTasks: 3,
    completedTasks: 12,
    capacity: 32,
    status: "available",
    skills: ["UI/UX Design", "Prototyping", "User Research"],
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    role: "Full Stack Developer",
    department: "Engineering",
    avatar: "",
    workload: 95,
    currentSprint: "Q1 Website Launch",
    activeTasks: 5,
    completedTasks: 8,
    capacity: 32,
    status: "busy",
    skills: ["React", "Node.js", "TypeScript", "AWS"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "Product Manager",
    department: "Product",
    avatar: "",
    workload: 60,
    currentSprint: "Mobile App Development",
    activeTasks: 2,
    completedTasks: 15,
    capacity: 32,
    status: "available",
    skills: ["Product Strategy", "Agile", "User Stories"],
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@company.com",
    role: "Frontend Developer",
    department: "Engineering",
    avatar: "",
    workload: 70,
    currentSprint: "Q1 Website Launch",
    activeTasks: 4,
    completedTasks: 10,
    capacity: 32,
    status: "available",
    skills: ["React", "Vue.js", "CSS", "JavaScript"],
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa.thompson@company.com",
    role: "UX Researcher",
    department: "Design",
    avatar: "",
    workload: 45,
    currentSprint: "Mobile App Development",
    activeTasks: 1,
    completedTasks: 6,
    capacity: 32,
    status: "available",
    skills: ["User Research", "Usability Testing", "Data Analysis"],
  },
]

const getWorkloadColor = (workload: number) => {
  if (workload >= 90) return "text-red-600"
  if (workload >= 75) return "text-yellow-600"
  return "text-green-600"
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 border-green-200"
    case "busy":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "unavailable":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getDepartmentColor = (department: string) => {
  switch (department) {
    case "Design":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "Engineering":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Product":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function TeamPage() {
  const totalMembers = mockTeamMembers.length
  const availableMembers = mockTeamMembers.filter(member => member.status === "available").length
  const averageWorkload = Math.round(mockTeamMembers.reduce((sum, member) => sum + member.workload, 0) / totalMembers)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Team</h2>
        <Button>
          <IconUser className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Team Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableMembers}</div>
            <p className="text-xs text-muted-foreground">
              Ready for new assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Workload</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getWorkloadColor(averageWorkload)}`}>
              {averageWorkload}%
            </div>
            <p className="text-xs text-muted-foreground">
              Current capacity utilization
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage team capacity and workload distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockTeamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{member.name}</h3>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getDepartmentColor(member.department)}>
                      {member.department}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {member.capacity}h capacity
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Workload</span>
                      <span className={`font-medium ${getWorkloadColor(member.workload)}`}>
                        {member.workload}%
                      </span>
                    </div>
                    <Progress value={member.workload} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Active Tasks</p>
                      <p className="font-medium">{member.activeTasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{member.completedTasks}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Current Sprint</p>
                    <p className="text-sm font-medium">{member.currentSprint}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <IconMail className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <IconCalendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 