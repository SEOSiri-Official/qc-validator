import { Suspense } from 'react';

export default function ActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This tells Next.js to wait for client-side hooks like useSearchParams
  return (
    <Suspense>
      {children}
    </Suspense>
  );
}