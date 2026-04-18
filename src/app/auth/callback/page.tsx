"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopoBackground from "@/components/topo-background";
import Logo from "@/components/logo";

export default function AuthCallbackPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/dashboard";
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setLoading(false);
        if (error) {
          setError("Link ongeldig of verlopen.");
        } else {
          router.replace(next);
        }
      });
    } else {
      setLoading(false);
      setError("Geen code in de URL gevonden.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-4">
      <TopoBackground />
      <div className="relative z-10 w-full max-w-md text-center">
        <Logo size="lg" variant="dark" />
        <h1 className="mt-6 text-xl font-semibold text-[var(--text-main)]">Aanmelden…</h1>
        {loading && <p className="mt-4 text-[var(--text-soft)]">Even geduld…</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </div>
  );
}
