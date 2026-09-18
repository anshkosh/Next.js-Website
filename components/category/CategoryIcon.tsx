import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface CategoryIconProps extends Omit<LucideProps, "name"> {
  name?: string | null;
  className?: string;
}

export default function CategoryIcon({ name, className = "w-5 h-5", ...props }: CategoryIconProps) {
  if (!name) return <Icons.Folder className={className} {...(props as LucideProps)} />;

  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];

  if (!IconComponent) {
    return <Icons.Folder className={className} {...(props as LucideProps)} />;
  }

  return <IconComponent className={className} {...(props as LucideProps)} />;
}
