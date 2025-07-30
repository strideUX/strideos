'use client';

import { createReactBlockSpec } from '@blocknote/react';
import { Menu } from '@blocknote/core';
import { FileText, CheckSquare, Calendar, Users, Settings } from 'lucide-react';

// Define the section header block schema
export const SectionHeaderBlock = createReactBlockSpec(
  {
    type: 'section-header' as const,
    propSchema: {
      sectionId: {
        default: 'overview',
        values: ['overview', 'tasks', 'updates', 'team', 'settings'],
      },
      title: {
        default: 'Section Title',
      },
      icon: {
        default: 'FileText',
        values: ['FileText', 'CheckSquare', 'Calendar', 'Users', 'Settings'],
      },
      description: {
        default: '',
      },
    },
    content: 'none',
    group: 'strideOS', // ✅ Add required group property
  },
  {
    render: (props) => {
      const { block, editor } = props;
      const { sectionId, title, icon, description } = block.props;

      // Icon mapping
      const iconMap = {
        FileText,
        CheckSquare,
        Calendar,
        Users,
        Settings,
      };

      const IconComponent = iconMap[icon as keyof typeof iconMap] || FileText;

      return (
        <div
          id={sectionId}
          className="section-header min-h-screen p-8 scroll-mt-4"
          data-section-id={sectionId}
          data-section-title={title}
          data-section-icon={icon}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                </div>
              </div>
              {description && (
                <p className="text-gray-600 text-base leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            
            {/* Content placeholder - will be filled by subsequent blocks */}
            <div className="section-content-area">
              {/* Blocks following this section header will be considered part of this section */}
            </div>
          </div>
        </div>
      );
    },
    parse: (element) => {
      if (element.tagName === 'DIV' && element.classList.contains('section-header')) {
        return {
          sectionId: element.getAttribute('data-section-id') || 'overview',
          title: element.getAttribute('data-section-title') || 'Section Title',
          icon: element.getAttribute('data-section-icon') || 'FileText',
          description: element.textContent?.trim() || '',
        };
      }
      return undefined;
    },
  }
);

// Slash command for inserting section headers
export const insertSectionHeader = (editor: any, sectionType: string) => {
  const sectionConfigs = {
    overview: {
      sectionId: 'overview',
      title: 'Project Overview',
      icon: 'FileText',
      description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
    },
    tasks: {
      sectionId: 'tasks',
      title: 'Tasks & Deliverables',
      icon: 'CheckSquare',
      description: 'Manage project tasks, assignments, and track progress on key deliverables.',
    },
    updates: {
      sectionId: 'updates',
      title: 'Project Updates',
      icon: 'Calendar',
      description: 'Weekly updates, milestones, and project timeline information.',
    },
    team: {
      sectionId: 'team',
      title: 'Team & Stakeholders',
      icon: 'Users',
      description: 'Team member information, roles, and stakeholder management.',
    },
    settings: {
      sectionId: 'settings',
      title: 'Project Settings',
      icon: 'Settings',
      description: 'Project configuration and administrative settings.',
    },
  };

  const config = sectionConfigs[sectionType as keyof typeof sectionConfigs] || sectionConfigs.overview;

  editor.insertBlocks(
    [
      {
        type: 'section-header',
        props: config,
      },
    ],
    editor.getTextCursorPosition().block,
    'after'
  );
};