/**
 * IconPicker - Emoji picker component for document and page icons
 *
 * @remarks
 * Provides an emoji picker interface for selecting icons for documents and pages.
 * Supports setting, changing, and removing icons with a dropdown picker interface.
 * Integrates with emoji-picker-react for comprehensive emoji selection.
 *
 * @example
 * ```tsx
 * <IconPicker 
 *   value={documentIcon}
 *   onChange={setDocumentIcon}
 * />
 * ```
 */

// 1. External imports
import React, { useEffect, useRef, useState, useCallback, memo, type ReactElement } from 'react';
import EmojiPicker from "emoji-picker-react";
import { SmilePlus } from "lucide-react";

// 2. Internal imports
// (No internal imports needed)

// 3. Types
interface IconPickerProps {
  /** Current icon value (emoji string) */
  value?: string | null;
  /** Callback for icon changes */
  onChange: (val: string | null) => void;
}

// 4. Component definition
export const IconPicker = memo(function IconPicker({ 
  value, 
  onChange 
}: IconPickerProps): ReactElement {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No complex computations needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleToggleOpen = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const handleEmojiClick = useCallback((emojiData: { emoji: string }) => {
    onChange(emojiData.emoji);
    setOpen(false);
  }, [onChange]);

  const handleRemoveIcon = useCallback(() => {
    onChange(null);
    setOpen(false);
  }, [onChange]);

  const handleDocumentClick = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [handleDocumentClick]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="relative inline-block" ref={ref}>
      {value ? (
        <button 
          className="text-5xl leading-none hover:opacity-70 transition-opacity" 
          onClick={handleToggleOpen}
        >
          {value}
        </button>
      ) : (
        <button 
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white text-lg text-neutral-400 hover:text-neutral-600" 
          onClick={handleToggleOpen}
        >
          <SmilePlus className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={320}
            height={400}
          />
          <button 
            className="mt-2 w-full rounded border px-2 py-1 text-xs bg-white hover:bg-neutral-50" 
            onClick={handleRemoveIcon}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
});
