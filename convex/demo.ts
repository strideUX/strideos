import { mutation, query } from './_generated/server';
import { auth } from './auth';

// Create a demo document for testing the section-based editor
export const createDemoDocument = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Authentication required');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get the first client and department for demo purposes
    const clients = await ctx.db.query('clients').collect();
    const departments = await ctx.db.query('departments').collect();

    if (clients.length === 0 || departments.length === 0) {
      throw new Error('No clients or departments found. Please seed the database first.');
    }

    const clientId = clients[0]._id;
    const departmentId = departments[0]._id;

    const now = Date.now();

    // Create the demo document (section-based)
    const documentId = await ctx.db.insert('documents', {
      title: 'Section-Based Document Demo',
      clientId,
      departmentId,
      documentType: 'project_brief',
      status: 'active',
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm'],
        clientVisible: true
      },
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
      lastModified: now,
      version: 1,
    });

    // Create demo sections
    const demoSections = [
      {
        type: 'overview' as const,
        title: 'Overview',
        icon: 'FileText',
        order: 0,
        required: true,
        content: [
          {
            id: 'overview-intro',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Project Overview', styles: {} }],
            children: []
          },
          {
            id: 'overview-description',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'This is a comprehensive demonstration of the section-based document architecture. Each section is a discrete container with its own BlockNote editor, enabling structured organization with editing freedom within boundaries.',
              styles: {} 
            }],
            children: []
          }
        ],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        }
      },
      {
        type: 'deliverables' as const,
        title: 'Deliverables',
        icon: 'CheckSquare',
        order: 1,
        required: true,
        content: [
          {
            id: 'deliverables-intro',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Project Deliverables', styles: {} }],
            children: []
          },
          {
            id: 'deliverables-description',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'This section will contain interactive task management components alongside rich text content. Tasks can be created, assigned, and tracked with real-time updates.',
              styles: {} 
            }],
            children: []
          }
        ],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm', 'task_owner'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
          fieldPermissions: {
            taskStatus: { canEdit: ['admin', 'pm', 'assignee'], canView: ['all'] },
            taskDetails: { canEdit: ['admin', 'pm'], canView: ['all'] }
          }
        }
      },
      {
        type: 'timeline' as const,
        title: 'Timeline',
        icon: 'Calendar',
        order: 2,
        required: false,
        content: [
          {
            id: 'timeline-intro',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Project Timeline', styles: {} }],
            children: []
          },
          {
            id: 'timeline-description',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Timeline and milestone tracking with sprint schedule visualization. This section combines rich text documentation with interactive timeline components.',
              styles: {} 
            }],
            children: []
          }
        ],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        }
      },
      {
        type: 'team' as const,
        title: 'Team',
        icon: 'Users',
        order: 3,
        required: false,
        content: [
          {
            id: 'team-intro',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Team & Stakeholders', styles: {} }],
            children: []
          },
          {
            id: 'team-description',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Team member management and stakeholder coordination. This section includes team member cards, role assignments, and collaborative notes.',
              styles: {} 
            }],
            children: []
          }
        ],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        }
      },
      {
        type: 'feedback' as const,
        title: 'Feedback',
        icon: 'MessageSquare',
        order: 4,
        required: false,
        content: [
          {
            id: 'feedback-intro',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Client Feedback', styles: {} }],
            children: []
          },
          {
            id: 'feedback-description',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Client feedback management and communication tracking. This section supports collaborative feedback with threaded discussions.',
              styles: {} 
            }],
            children: []
          }
        ],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm', 'client'],
          canInteract: ['admin', 'pm', 'client'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        }
      }
    ];

    // Create sections
    for (const sectionData of demoSections) {
      await ctx.db.insert('sections', {
        documentId,
        type: sectionData.type,
        title: sectionData.title,
        icon: sectionData.icon,
        order: sectionData.order,
        required: sectionData.required,
        content: sectionData.content,
        permissions: sectionData.permissions,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return documentId;
  },
});

// Get the demo document ID (creates one if it doesn't exist)
export const getDemoDocumentId = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Look for an existing demo document
    const demoDocuments = await ctx.db
      .query('documents')
      .filter(q => q.eq(q.field('title'), 'Section-Based Document Demo'))
      .collect();

    if (demoDocuments.length > 0) {
      return demoDocuments[0]._id;
    }

    return null; // No demo document exists yet
  },
}); 