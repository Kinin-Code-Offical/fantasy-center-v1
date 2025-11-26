"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { newVerification } from "@/lib/actions/new-verification";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function NewVerificationPage() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Missing token!");
      return;
    }

    newVerification(token)
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuccess(data.message);
          signOut({ redirect: false });
        }
      })
      .catch(() => {
        setError("Something went wrong!");
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-green-500 font-mono">
      <div className="w-[500px] border border-green-500 p-8 shadow-[0_0_20px_rgba(0,255,0,0.3)]">
        <h1 className="mb-8 text-center text-2xl font-bold tracking-widest border-b border-green-500 pb-4">
          SYSTEM VERIFICATION
        </h1>

        <div className="flex flex-col items-center justify-center space-y-6">
          {!success && !error && (
            <div className="animate-pulse text-xl">VERIFYING ENCRYPTION KEY...</div>
          )}

          {success && (
            <div className="text-center">
              <div className="mb-4 text-xl font-bold text-green-400">ACCESS GRANTED</div>
              <p className="mb-6 text-sm opacity-80">{success}</p>
              <Link
                href="/login"
                className="inline-block border border-green-500 px-6 py-2 hover:bg-green-500 hover:text-black transition-colors duration-300"
              >
                PROCEED TO LOGIN
              </Link>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="mb-4 text-xl font-bold text-red-500">ACCESS DENIED</div>
              <p className="mb-6 text-sm text-red-400">{error}</p>
              <Link
                href="/login"
                className="inline-block border border-red-500 text-red-500 px-6 py-2 hover:bg-red-500 hover:text-black transition-colors duration-300"
              >
                RETURN TO LOGIN
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs opacity-50">
          SECURE CONNECTION // ENCRYPTED
        </div>
      </div>
    </div>
  );
}
