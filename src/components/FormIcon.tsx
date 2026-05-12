import { icons } from 'lucide-react';

export function FormIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = icons[iconName as keyof typeof icons] ?? icons['CircleQuestionMark'];
  return <Icon className={className} />;
}
