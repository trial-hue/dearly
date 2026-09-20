import { HqShell } from '@/components/hq/HqShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HqShell>{children}</HqShell>;
}
