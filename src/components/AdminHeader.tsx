'use client';

import { useAuth } from "@/hooks/useAuth";

export function AdminHeader() {
  const { logout } = useAuth();

  return (
    <header className="bg-gray-800 py-4 px-6 flex justify-between items-center">
      <h1 className="text-white text-lg">Admin Panel</h1>
      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
        Logout
      </button>
    </header>
  );
}
