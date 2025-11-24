"use client";

import { useActionState } from "react";
import { completeOnboarding, OnboardingState } from "@/lib/onboarding-actions";

export default function OnboardingForm({ user }: { user: any }) {
    const initialState: OnboardingState = {};
    const [state, action, isPending] = useActionState(completeOnboarding, initialState);

    return (
        <form action={action} className="space-y-6" autoComplete="off">
            {state?.error?.form && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                    {state.error.form[0]}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-neon-purple tracking-widest uppercase">Username</label>
                <input
                    name="username"
                    type="text"
                    placeholder="Ex: CyberKing23"
                    defaultValue={user?.username || ""}
                    required
                    autoComplete="off"
                    className="w-full bg-[#12122a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    Only letters, numbers, underscores, and hyphens. No spaces.
                </p>
                {state?.error?.username && (
                    <p className="text-red-400 text-xs">{state.error.username[0]}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neon-purple tracking-widest uppercase">First Name</label>
                    <input
                        name="firstName"
                        type="text"
                        defaultValue={user?.firstName || ""}
                        required
                        className="w-full bg-[#12122a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    {state?.error?.firstName && (
                        <p className="text-red-400 text-xs">{state.error.firstName[0]}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neon-purple tracking-widest uppercase">Last Name</label>
                    <input
                        name="lastName"
                        type="text"
                        defaultValue={user?.lastName || ""}
                        required
                        className="w-full bg-[#12122a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    {state?.error?.lastName && (
                        <p className="text-red-400 text-xs">{state.error.lastName[0]}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-neon-purple tracking-widest uppercase">Date of Birth</label>
                <input
                    name="birthDate"
                    type="date"
                    defaultValue={user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ""}
                    required
                    className="w-full bg-[#12122a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-all [color-scheme:dark]"
                />
                {state?.error?.birthDate && (
                    <p className="text-red-400 text-xs">{state.error.birthDate[0]}</p>
                )}
            </div>

            {!user?.password && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neon-purple tracking-widest uppercase">Set Password</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="Create a secure password"
                        required
                        autoComplete="new-password"
                        className="w-full bg-[#12122a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-all"
                    />
                    {state?.error?.password && (
                        <p className="text-red-400 text-xs">{state.error.password[0]}</p>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-neon-cyan text-black font-bold py-4 rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all uppercase tracking-widest mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? "Saving..." : "Complete Registration"}
            </button>
        </form>
    );
}
