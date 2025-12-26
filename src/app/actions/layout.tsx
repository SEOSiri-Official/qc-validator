import { Suspense } from 'react';

export default function ActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This tells Next.js to wait for client-side hooks to load within this route.
  return (
    <Suspense>
      {children}
    </Suspense>
  );
}