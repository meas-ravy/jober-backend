import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

type UserAvatarProps = {
  name: string;
  src?: string;
  className?: string;
};

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
