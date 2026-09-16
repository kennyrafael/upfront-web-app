import { Avatar as ThemedAvatar } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  /** Absent for most providers — the fallback is the normal case, not the error case. */
  src?: string;
  name?: string;
  className?: string;
}

/** Two letters from the name, which is all a small circle has room for. */
function initialsOf(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  // First and last, not the first two: "Ana Silva Pereira" is AP to anyone who knows her.
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ src, name, className }: AvatarProps) {
  return (
    <ThemedAvatar
      size="2"
      radius="full"
      variant="soft"
      src={src}
      // Rendered until the image has actually decoded, so a slow logo does not flash a
      // broken-image icon and a URL that 404s degrades to the initials.
      fallback={initialsOf(name)}
      className={cn(className)}
    />
  );
}
