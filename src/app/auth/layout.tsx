import { Suspense } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The Suspense boundary tells React to wait for client-side hooks like useSearchParams
    <Suspense>
      {children}
    </Suspense>
  );
}