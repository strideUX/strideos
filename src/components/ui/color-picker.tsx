'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconPalette } from '@tabler/icons-react';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Validate hex color
  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const handleColorInputClick = () => {
    colorInputRef.current?.click();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    onChange(color);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Ensure it starts with #
    const formattedColor = color.startsWith('#') ? color : `#${color}`;
    onChange(formattedColor);
  };

  // Predefined color palette
  const colorPalette = [
    '#0E1828', // Default brand color
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#000000', // Black
    '#FFFFFF', // White
    '#1F2937', // Dark gray
    '#4B5563', // Medium gray
  ];

  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium mb-2">{label}</Label>}
      
      <div className="flex gap-2">
        {/* Text input for hex value */}
        <Input
          value={value}
          onChange={handleTextInputChange}
          placeholder="#0E1828"
          className="flex-1"
        />
        
        {/* Color preview and picker trigger */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-12 h-10 p-0 flex-shrink-0"
              style={{ 
                backgroundColor: isValidHexColor(value) ? value : '#0E1828',
                borderColor: isValidHexColor(value) ? value : '#0E1828'
              }}
            >
              <span className="sr-only">Open color picker</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-4">
              {/* Native color picker */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-2 block">
                  Color Picker
                </Label>
                <div className="flex gap-2">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={isValidHexColor(value) ? value : '#0E1828'}
                    onChange={handleColorChange}
                    className="w-full h-10 rounded border cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleColorInputClick}
                  >
                    <IconPalette className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Color palette */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-2 block">
                  Quick Colors
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 cursor-pointer transition-all hover:scale-110 ${
                        value === color ? 'border-slate-800 shadow-md' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onChange(color);
                        setIsOpen(false);
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Color preview area */}
      <div className="mt-2">
        <div 
          className="w-full h-12 rounded border"
          style={{ backgroundColor: isValidHexColor(value) ? value : '#0E1828' }}
        >
          <div className="p-2 h-full flex items-center">
            <span className="text-white text-xs font-medium drop-shadow-sm">
              Preview: {value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}