import { mutation } from './_generated/server';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

export const seedDatabase = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can seed the database');
    }

    // Check if data already exists
    const existingClients = await ctx.db.query('clients').collect();
    const existingUsers = await ctx.db.query('users').collect();
    if (existingClients.length > 0 || existingUsers.length > 1) { // Allow 1 user (the current admin)
      throw new Error('Database already contains data. Clear existing data first.');
    }

    const now = Date.now();

    // Create sample clients
    const techStartupId = await ctx.db.insert('clients', {
      name: 'TechFlow Innovations',
      description: 'A fast-growing fintech startup focused on payment solutions',
      industry: 'Financial Technology',
      size: 'startup',
      contactEmail: 'contact@techflow.com',
      contactPhone: '+1 (555) 123-4567',
      website: 'https://techflow.com',
      address: {
        street: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States',
      },
      status: 'active',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const enterpriseCorpId = await ctx.db.insert('clients', {
      name: 'Global Enterprise Corp',
      description: 'Large multinational corporation with diverse business units',
      industry: 'Manufacturing',
      size: 'enterprise',
      contactEmail: 'partnerships@globalenterprise.com',
      contactPhone: '+1 (555) 987-6543',
      website: 'https://globalenterprise.com',
      address: {
        street: '456 Corporate Blvd',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      },
      status: 'active',
      timezone: 'America/New_York',
      currency: 'USD',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const consultingFirmId = await ctx.db.insert('clients', {
      name: 'Strategic Solutions Consulting',
      description: 'Management consulting firm specializing in digital transformation',
      industry: 'Consulting',
      size: 'medium',
      contactEmail: 'info@strategicsolutions.com',
      contactPhone: '+1 (555) 456-7890',
      website: 'https://strategicsolutions.com',
      address: {
        street: '789 Business Center',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'United States',
      },
      status: 'active',
      timezone: 'America/Chicago',
      currency: 'USD',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create sample departments for TechFlow Innovations
    const productDeptId = await ctx.db.insert('departments', {
      name: 'Product Development',
      clientId: techStartupId,
      description: 'Core product development team focusing on payment platform features',
      workstreamCount: 3,
      workstreamCapacity: 20,
      sprintDuration: 2,
      workstreamLabels: ['Frontend', 'Backend', 'Mobile'],
      timezone: 'America/Los_Angeles',
      workingHours: {
        start: '09:00',
        end: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      },
      velocityHistory: [
        {
          sprintId: 'sprint-1',
          sprintEndDate: now - (14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          completedPoints: 55,
          plannedPoints: 60,
        },
        {
          sprintId: 'sprint-2',
          sprintEndDate: now - (7 * 24 * 60 * 60 * 1000), // 1 week ago
          completedPoints: 58,
          plannedPoints: 60,
        },
      ],
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const marketingDeptId = await ctx.db.insert('departments', {
      name: 'Marketing & Growth',
      clientId: techStartupId,
      description: 'Marketing team focused on user acquisition and brand development',
      workstreamCount: 2,
      workstreamCapacity: 15,
      sprintDuration: 1,
      workstreamLabels: ['Content', 'Campaigns'],
      timezone: 'America/Los_Angeles',
      workingHours: {
        start: '08:00',
        end: '16:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      velocityHistory: [
        {
          sprintId: 'mkt-sprint-1',
          sprintEndDate: now - (7 * 24 * 60 * 60 * 1000),
          completedPoints: 28,
          plannedPoints: 30,
        },
      ],
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create departments for Global Enterprise Corp
    const itDeptId = await ctx.db.insert('departments', {
      name: 'IT Infrastructure',
      clientId: enterpriseCorpId,
      description: 'Enterprise IT infrastructure and systems management',
      workstreamCount: 4,
      workstreamCapacity: 25,
      sprintDuration: 3,
      workstreamLabels: ['Security', 'Cloud', 'Network', 'Support'],
      timezone: 'America/New_York',
      workingHours: {
        start: '09:00',
        end: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      velocityHistory: [
        {
          sprintId: 'it-sprint-1',
          sprintEndDate: now - (21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          completedPoints: 95,
          plannedPoints: 100,
        },
      ],
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const hrDeptId = await ctx.db.insert('departments', {
      name: 'Human Resources',
      clientId: enterpriseCorpId,
      description: 'HR operations and employee experience initiatives',
      workstreamCount: 2,
      workstreamCapacity: 12,
      sprintDuration: 2,
      workstreamLabels: ['Operations', 'Experience'],
      timezone: 'America/New_York',
      workingHours: {
        start: '08:30',
        end: '17:30',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      velocityHistory: [],
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create department for Strategic Solutions Consulting
    const consultingDeptId = await ctx.db.insert('departments', {
      name: 'Digital Transformation',
      clientId: consultingFirmId,
      description: 'Digital transformation consulting and implementation services',
      workstreamCount: 3,
      workstreamCapacity: 18,
      sprintDuration: 2,
      workstreamLabels: ['Strategy', 'Implementation', 'Change Management'],
      timezone: 'America/Chicago',
      workingHours: {
        start: '08:00',
        end: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      velocityHistory: [
        {
          sprintId: 'consulting-sprint-1',
          sprintEndDate: now - (14 * 24 * 60 * 60 * 1000),
          completedPoints: 52,
          plannedPoints: 54,
        },
      ],
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create sample users
    const user1Id = await ctx.db.insert('users', {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techflow.com',
      role: 'pm',
      status: 'active',
      jobTitle: 'Senior Project Manager',
      bio: 'Experienced PM with 8+ years in software development and agile methodologies',
      timezone: 'America/Los_Angeles',
      preferredLanguage: 'en',
      clientId: techStartupId,
      departmentIds: [productDeptId, marketingDeptId],
      createdAt: now,
      updatedAt: now,
    });

    const user2Id = await ctx.db.insert('users', {
      name: 'Michael Chen',
      email: 'michael.chen@globalenterprise.com',
      role: 'task_owner',
      status: 'active',
      jobTitle: 'Lead Developer',
      bio: 'Full-stack developer specializing in enterprise software solutions',
      timezone: 'America/New_York',
      preferredLanguage: 'en',
      clientId: enterpriseCorpId,
      departmentIds: [itDeptId],
      createdAt: now,
      updatedAt: now,
    });

    const user3Id = await ctx.db.insert('users', {
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@strategicsolutions.com',
      role: 'client',
      status: 'active',
      jobTitle: 'IT Director',
      bio: 'Healthcare IT professional with expertise in patient management systems',
      timezone: 'America/Chicago',
      preferredLanguage: 'en',
      clientId: consultingFirmId,
      departmentIds: [consultingDeptId],
      createdAt: now,
      updatedAt: now,
    });

    const user4Id = await ctx.db.insert('users', {
      name: 'David Kim',
      email: 'david.kim@strideos.com',
      role: 'task_owner',
      status: 'active',
      jobTitle: 'UX Designer',
      bio: 'Creative designer focused on user experience and interface design',
      timezone: 'America/Los_Angeles',
      preferredLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    });

    const user5Id = await ctx.db.insert('users', {
      name: 'Lisa Thompson',
      email: 'lisa.thompson@techflow.com',
      role: 'task_owner',
      status: 'invited',
      jobTitle: 'QA Engineer',
      bio: 'Quality assurance specialist with expertise in automated testing',
      timezone: 'America/Los_Angeles',
      preferredLanguage: 'en',
      clientId: techStartupId,
      departmentIds: [productDeptId],
      invitedBy: userId,
      invitedAt: now,
      invitationToken: 'sample-invitation-token-123',
      createdAt: now,
      updatedAt: now,
    });

    // Update counter for testing
    const existingCounter = await ctx.db
      .query('counters')
      .withIndex('by_name', (q) => q.eq('name', 'global'))
      .first();

    if (existingCounter) {
      await ctx.db.patch(existingCounter._id, {
        count: existingCounter.count + 1,
      });
    } else {
      await ctx.db.insert('counters', {
        name: 'global',
        count: 1,
      });
    }

    // Create sample tasks
    const task1Id = await ctx.db.insert('tasks', {
      title: 'Implement user authentication system',
      description: 'Build secure login/logout functionality with password reset capabilities',
      clientId: techStartupId,
      departmentId: productDeptId,
      status: 'in_progress',
      priority: 'high',
      size: 'lg',
      storyPoints: 5,
      assigneeId: user2Id, // Michael Chen
      reporterId: user1Id, // Sarah Johnson (PM)
      dueDate: now + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      labels: ['feature', 'security'],
      category: 'feature',
      visibility: 'department',
      backlogOrder: 1,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    const task2Id = await ctx.db.insert('tasks', {
      title: 'Fix payment processing bug',
      description: 'Resolve issue where payment confirmations are not being sent to users',
      clientId: techStartupId,
      departmentId: productDeptId,
      status: 'todo',
      priority: 'urgent',
      size: 'md',
      storyPoints: 3,
      assigneeId: user4Id, // David Kim
      reporterId: user1Id, // Sarah Johnson (PM)
      dueDate: now + (3 * 24 * 60 * 60 * 1000), // 3 days from now
      labels: ['bug', 'urgent', 'payments'],
      category: 'bug',
      visibility: 'department',
      backlogOrder: 2,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    const task3Id = await ctx.db.insert('tasks', {
      title: 'Create marketing landing page',
      description: 'Design and develop a conversion-optimized landing page for the new product launch',
      clientId: techStartupId,
      departmentId: marketingDeptId,
      status: 'review',
      priority: 'medium',
      size: 'xl',
      storyPoints: 8,
      assigneeId: user5Id, // Lisa Thompson
      reporterId: user1Id, // Sarah Johnson (PM)
      dueDate: now + (14 * 24 * 60 * 60 * 1000), // 14 days from now
      labels: ['marketing', 'design'],
      category: 'feature',
      visibility: 'client',
      backlogOrder: 3,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    const task4Id = await ctx.db.insert('tasks', {
      title: 'Database optimization',
      description: 'Optimize database queries to improve application performance',
      clientId: enterpriseCorpId,
      departmentId: itDeptId,
      status: 'done',
      priority: 'medium',
      size: 'lg',
      storyPoints: 5,
      assigneeId: user2Id, // Michael Chen
      reporterId: user1Id, // Sarah Johnson (PM)
      completedDate: now - (2 * 24 * 60 * 60 * 1000), // Completed 2 days ago
      labels: ['performance', 'database'],
      category: 'improvement',
      visibility: 'department',
      backlogOrder: 4,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now - (10 * 24 * 60 * 60 * 1000), // Created 10 days ago
      updatedAt: now - (2 * 24 * 60 * 60 * 1000), // Updated 2 days ago
      version: 3,
    });

    const task5Id = await ctx.db.insert('tasks', {
      title: 'Update documentation',
      description: 'Update API documentation to reflect recent changes and improvements',
      clientId: consultingFirmId,
      departmentId: consultingDeptId,
      status: 'todo',
      priority: 'low',
      size: 'sm',
      storyPoints: 2,
      reporterId: user1Id, // Sarah Johnson (PM)
      // No assignee yet
      dueDate: now + (21 * 24 * 60 * 60 * 1000), // 21 days from now
      labels: ['documentation'],
      category: 'documentation',
      visibility: 'department',
      backlogOrder: 5,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    const task6Id = await ctx.db.insert('tasks', {
      title: 'Security audit',
      description: 'Conduct comprehensive security audit of the application',
      clientId: enterpriseCorpId,
      departmentId: hrDeptId,
      status: 'archived',
      priority: 'high',
      size: 'xl',
      storyPoints: 8,
      assigneeId: user4Id, // David Kim
      reporterId: user1Id, // Sarah Johnson (PM)
      completedDate: now - (30 * 24 * 60 * 60 * 1000), // Completed 30 days ago
      labels: ['security', 'audit'],
      category: 'maintenance',
      visibility: 'private',
      backlogOrder: 6,
      createdBy: user1Id,
      updatedBy: user1Id,
      createdAt: now - (45 * 24 * 60 * 60 * 1000), // Created 45 days ago
      updatedAt: now - (30 * 24 * 60 * 60 * 1000), // Updated 30 days ago
      version: 5,
    });

    return {
      message: 'Database seeded successfully!',
      clientsCreated: 3,
      departmentsCreated: 5,
      usersCreated: 5,
      tasksCreated: 6,
      clients: [
        { id: techStartupId, name: 'TechFlow Innovations' },
        { id: enterpriseCorpId, name: 'Global Enterprise Corp' },
        { id: consultingFirmId, name: 'Strategic Solutions Consulting' },
      ],
      departments: [
        { id: productDeptId, name: 'Product Development', client: 'TechFlow Innovations' },
        { id: marketingDeptId, name: 'Marketing & Growth', client: 'TechFlow Innovations' },
        { id: itDeptId, name: 'IT Infrastructure', client: 'Global Enterprise Corp' },
        { id: hrDeptId, name: 'Human Resources', client: 'Global Enterprise Corp' },
        { id: consultingDeptId, name: 'Digital Transformation', client: 'Strategic Solutions Consulting' },
      ],
      users: [
        { id: user1Id, name: 'Sarah Johnson', role: 'pm', client: 'TechFlow Innovations' },
        { id: user2Id, name: 'Michael Chen', role: 'task_owner', client: 'Global Enterprise Corp' },
        { id: user3Id, name: 'Emily Rodriguez', role: 'client', client: 'Strategic Solutions Consulting' },
        { id: user4Id, name: 'David Kim', role: 'task_owner', client: 'None' },
        { id: user5Id, name: 'Lisa Thompson', role: 'task_owner', client: 'TechFlow Innovations', status: 'invited' },
      ],
      tasks: [
        { id: task1Id, title: 'Implement user authentication system', status: 'in_progress', assignee: 'Michael Chen' },
        { id: task2Id, title: 'Fix payment processing bug', status: 'todo', assignee: 'David Kim' },
        { id: task3Id, title: 'Create marketing landing page', status: 'review', assignee: 'Lisa Thompson' },
        { id: task4Id, title: 'Database optimization', status: 'done', assignee: 'Michael Chen' },
        { id: task5Id, title: 'Update documentation', status: 'todo', assignee: 'Unassigned' },
        { id: task6Id, title: 'Security audit', status: 'archived', assignee: 'David Kim' },
      ],
    };
  },
}); 