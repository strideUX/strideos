'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { cn } from '@/lib/utils';

export interface TestUser {
  id: string;
  name: string;
  color: string;
}

interface UserControlsProps {
  user: TestUser;
  onChange: (user: TestUser) => void;
  onRandomize?: () => void;
  className?: string;
}

export function UserControls({ user, onChange, onRandomize, className }: UserControlsProps) {
  const names = useMemo(() => [
    'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Edsger Dijkstra', 'Barbara Liskov',
    'Donald Knuth', 'Linus Torvalds', 'Margaret Hamilton', 'Guido van Rossum', 'Brendan Eich'
  ], []);

  const colors = useMemo(() => [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#0EA5E9'
  ], []);

  const randomize = () => {
    const name = names[Math.floor(Math.random() * names.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    onChange({ ...user, name, color });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Input
          value={user.name}
          onChange={(e) => onChange({ ...user, name: e.target.value })}
          placeholder="Your name"
        />
        <Button type="button" variant="outline" onClick={onRandomize || randomize}>Randomize</Button>
      </div>
      <ColorPicker label="User color" value={user.color} onChange={(color) => onChange({ ...user, color })} />
    </div>
  );
}
