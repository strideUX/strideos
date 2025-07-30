import { mutation, query } from './_generated/server';
import { auth } from './auth';

// Create a demo document for testing the editor
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

    // Create a demo document with some initial content
    const demoContent = [
      {
        id: 'demo-title',
        type: 'heading',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left',
          level: 1
        },
        content: [
          {
            type: 'text',
            text: 'Welcome to the Enhanced BlockNote Editor Demo',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-intro',
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: 'This is a real document connected to the database. You can edit this content and see the auto-save functionality in action. Try typing some text, using the toolbar, or adding different block types.',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-features',
        type: 'heading',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left',
          level: 2
        },
        content: [
          {
            type: 'text',
            text: 'Key Features to Test',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-list',
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: 'Smart auto-save with visual feedback',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-list-2',
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: 'Keyboard shortcuts (Ctrl/Cmd + S)',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-list-3',
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: 'Professional shadcn/ui theming',
            styles: {}
          }
        ],
        children: []
      },
      {
        id: 'demo-list-4',
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [
          {
            type: 'text',
            text: 'Word count and reading time estimates',
            styles: {}
          }
        ],
        children: []
      }
    ];

    const documentId = await ctx.db.insert('documents', {
      title: 'Enhanced Editor Demo Document',
      clientId,
      departmentId,
      documentType: 'project_brief',
      content: demoContent,
      status: 'active',
      sections: [
        {
          id: 'demo-section',
          title: 'Demo Content',
          order: 1,
          anchor: 'demo-content'
        }
      ],
      permissions: {
        canView: ['admin', 'manager', 'consultant', 'client'],
        canEdit: ['admin', 'manager', 'consultant'],
        clientVisible: true
      },
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
      lastModified: now,
      version: 1,
    });

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
      .filter(q => q.eq(q.field('title'), 'Enhanced Editor Demo Document'))
      .collect();

    if (demoDocuments.length > 0) {
      return demoDocuments[0]._id;
    }

    return null; // No demo document exists yet
  },
}); 