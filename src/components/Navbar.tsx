"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export function Navbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser(profile);
      }
      setLoading(false);
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="bg-black border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white tracking-tight uppercase">
            QuizCom
          </Link>
          <Link
            href="/modules"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Modules
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-neutral-800 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <span className="text-sm text-neutral-400">
                {user.display_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
