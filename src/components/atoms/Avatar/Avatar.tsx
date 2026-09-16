import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  /** Absent for most providers — the fallback is the normal case, not the error case. */
  src?: string;
  name?: string;
  className?: string;
}

/** Two letters from the name, which is all a 32px circle has room for. */
function initialsOf(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  // First and last, not the first two: "Ana Silva Pereira" is AP to anyone who knows her.
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Radix rather than a bare `<img>`, for the fallback behaviour: it renders the initials
 * until the image has actually decoded, so a slow logo does not flash a broken-image icon,
 * and a URL that 404s degrades to the initials instead of an empty box.
 */
export function Avatar({ src, name, className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-700/12',
        className,
      )}
    >
      <RadixAvatar.Image src={src} alt="" className="size-full object-cover" />
      <RadixAvatar.Fallback className="text-xs font-semibold text-brand-800">
        {initialsOf(name)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
