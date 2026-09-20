import { BusinessShell } from '@/components/business/BusinessShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BusinessShell>{children}</BusinessShell>;
}
