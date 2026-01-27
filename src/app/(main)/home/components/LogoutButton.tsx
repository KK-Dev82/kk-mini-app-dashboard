"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={() => window.location.href = '/auth/logout'}
      className="w-full rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
    >
      Logout
    </button>
  );
}
