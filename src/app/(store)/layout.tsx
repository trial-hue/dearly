import { StoreShell } from '@/components/store/StoreShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
