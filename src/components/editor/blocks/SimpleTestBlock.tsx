'use client';

import { createReactBlockSpec } from '@blocknote/react';

// Minimal test block - this should definitely work if BlockNote is functioning properly
export const simpleTestBlockSpec = createReactBlockSpec(
  {
    type: 'simpletest',
    propSchema: {
      text: {
        default: "Test Block",
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      return (
        <div 
          style={{
            padding: '16px',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            margin: '8px 0'
          }}
        >
          <h3 style={{ margin: 0, color: '#1e40af' }}>
            ✅ Simple Test Block Working!
          </h3>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>
            Text: {props.block.props.text}
          </p>
        </div>
      );
    },
  }
);