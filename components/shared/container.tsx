import { cn } from "@/lib/utils";

/**
 * Page-level horizontal rhythm. Every section on the site sits inside this
 * so margins stay consistent without repeating the same className everywhere.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6 sm:px-8", className)}
      {...props}
    />
  );
}
