import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Extract mentions from text content
 * @param content - The text content to search for mentions
 * @returns Array of mentioned usernames (without @ symbol)
 */
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Replace mentions with clickable links
 * @param content - The text content
 * @param users - Array of users to match against
 * @param onMentionClick - Callback when mention is clicked
 * @returns JSX elements with mentions as clickable spans
 */
export const renderMentions = (
  content: string,
  users: any[],
  onMentionClick?: (userId: string, username: string) => void
) => {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    const user = users.find(u => 
      u.name?.toLowerCase().includes(username.toLowerCase()) ||
      u.email?.toLowerCase().includes(username.toLowerCase())
    );

    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the mention
    if (user && onMentionClick) {
      parts.push(
        React.createElement('span', {
          key: `mention-${match.index}`,
          className: "text-blue-600 hover:text-blue-800 cursor-pointer font-medium",
          onClick: () => onMentionClick(user._id, user.name || user.email || '')
        }, `@${username}`)
      );
    } else {
      parts.push(
        React.createElement('span', {
          key: `mention-${match.index}`,
          className: "text-blue-600 font-medium"
        }, `@${username}`)
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
};

/**
 * Hook to get users for mention functionality
 */
export const useUsersForMentions = () => {
  return useQuery(api.users.listUsers);
};

/**
 * Validate mention format
 * @param mention - The mention text to validate
 * @returns Whether the mention is valid
 */
export const isValidMention = (mention: string): boolean => {
  // Must start with @ and contain only alphanumeric characters
  return /^@[a-zA-Z0-9_]+$/.test(mention);
};

/**
 * Get mention suggestions based on input
 * @param input - The current input text
 * @param users - Array of users to search through
 * @returns Filtered users that match the input
 */
export const getMentionSuggestions = (input: string, users: any[]): any[] => {
  if (!input.startsWith('@')) return [];

  const searchTerm = input.slice(1).toLowerCase();
  if (searchTerm.length === 0) return users.slice(0, 5); // Show first 5 users

  return users
    .filter(user => {
      const name = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return name.includes(searchTerm) || email.includes(searchTerm);
    })
    .slice(0, 5); // Limit to 5 suggestions
};

/**
 * Format mention for display
 * @param user - The user object
 * @returns Formatted display string
 */
export const formatMentionDisplay = (user: any): string => {
  if (user.name) {
    return `${user.name} (${user.email})`;
  }
  return user.email || 'Unknown User';
}; 