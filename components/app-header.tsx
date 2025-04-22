import { auth } from '@/app/(auth)/auth';
import React from 'react';

export async function AppHeader() {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="font-semibold text-lg">Shock IA Labs</div>
      </div>
    </header>
  );
}
