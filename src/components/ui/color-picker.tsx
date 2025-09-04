/**
 * ColorPicker - Interactive color selection component
 *
 * @remarks
 * Provides a comprehensive color picker with hex input, native color picker,
 * predefined color palette, and validation. Supports both manual hex entry
 * and visual color selection with proper error handling.
 *
 * @example
 * ```tsx
 * <ColorPicker 
 *   label="Brand Color" 
 *   value="#3B82F6" 
 *   onChange={setBrandColor} 
 * />
 * ```
 */

// 1. External imports
import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { IconPalette } from '@tabler/icons-react';

// 2. Internal imports
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// 3. Types
interface ColorPickerProps {
  /** Label displayed above the color picker */
  label?: string;
  /** Current color value in hex format */
  value: string;
  /** Callback function when color changes */
  onChange: (value: string) => void;
  /** Additional CSS classes */
  className?: string;
}

interface PredefinedColor {
  value: string;
  label: string;
}

// 4. Component definition
export const ColorPicker = memo(function ColorPicker({ 
  label, 
  value, 
  onChange, 
  className 
}: ColorPickerProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const predefinedColors: PredefinedColor[] = useMemo(() => [
    { value: '#0E1828', label: 'Default brand color' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#EF4444', label: 'Red' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6B7280', label: 'Gray' },
    { value: '#000000', label: 'Black' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#1F2937', label: 'Dark gray' },
    { value: '#4B5563', label: 'Medium gray' },
  ], []);

  const isValidColor = useMemo(() => {
    return isValidHexColor(value);
  }, [value]);

  const displayColor = useMemo(() => {
    return isValidColor ? value : '#0E1828';
  }, [isValidColor, value]);

  const isOpenPopover = useMemo(() => {
    return isOpen;
  }, [isOpen]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const isValidHexColor = useCallback((color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }, []);

  const handleColorInputClick = useCallback(() => {
    colorInputRef.current?.click();
  }, []);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    onChange(color);
  }, [onChange]);

  const handleTextInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Ensure it starts with #
    const formattedColor = color.startsWith('#') ? color : `#${color}`;
    onChange(formattedColor);
  }, [onChange]);

  const handlePredefinedColorSelect = useCallback((colorValue: string) => {
    onChange(colorValue);
    setIsOpen(false);
  }, [onChange]);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium mb-2">{label}</Label>
      )}
      
      <div className="flex gap-2">
        {/* Text input for hex value */}
        <Input
          value={value}
          onChange={handleTextInputChange}
          placeholder="#0E1828"
          className="flex-1"
        />
        
        {/* Color preview and picker trigger */}
        <Popover open={isOpenPopover} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-12 h-10 p-0 flex-shrink-0"
              style={{ 
                backgroundColor: displayColor,
                borderColor: displayColor
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
                    value={displayColor}
                    onChange={handleColorChange}
                    className="w-full h-10 rounded border cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleColorInputClick}
                  >
                    <IconPalette className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Predefined color palette */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-2 block">
                  Quick Colors
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      onClick={() => handlePredefinedColorSelect(color.value)}
                      title={color.label}
                    >
                      <span className="sr-only">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current color display */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-2 block">
                  Current Color
                </Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: displayColor }}
                  />
                  <span className="text-sm font-mono">{displayColor}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});