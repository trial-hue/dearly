import { ToastProvider } from '@/components/shell/Toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
