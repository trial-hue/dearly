export function ChatBubble({
  role,
  children,
  footer,
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <li
      className={`max-w-[85%] rounded-[16px] px-4 py-2.5 text-sm ${role === 'user' ? 'self-end bg-ink text-bg' : 'self-start bg-surface-2'}`}
    >
      {children}
      {footer ? <div className="mt-1.5 flex flex-wrap gap-1">{footer}</div> : null}
    </li>
  );
}
