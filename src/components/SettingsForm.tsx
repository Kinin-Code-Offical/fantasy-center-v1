"use client";

import { useState } from "react";
import { updateUserProfile, resendVerificationEmailAction } from "@/lib/settings-actions";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, FileText, Image as ImageIcon, Mail, Lock, Shield, Calendar, X, RefreshCw } from "lucide-react";
import AvatarSelector from "./AvatarSelector";
import Image from "next/image";

interface SettingsFormProps {
    user: {
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        email: string | null;
        birthDate: Date | null;
        pendingEmail?: string | null;
        emailVerified?: Date | null;
    };
}

export default function SettingsForm({ user }: SettingsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

    const formattedBirthDate = user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "";

    const handleResendEmail = async () => {
        setResendLoading(true);
        try {
            const result = await resendVerificationEmailAction();
            if (result.success) {
                setMessage({ type: 'success', text: result.message });
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to resend email." });
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Verification Warning */}
            {(!user.emailVerified || user.pendingEmail) && (
                <div className="p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">
                                Security Alert
                            </h3>
                            <p className="text-yellow-200/80 text-sm">
                                {user.pendingEmail 
                                    ? `Pending change to ${user.pendingEmail}. Please check your inbox to verify.`
                                    : "Your account is not verified. Some features (Trading, Market...) are restricted."}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleResendEmail}
                        disabled={resendLoading}
                        className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {resendLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                        Resend Email
                    </button>
                </div>
            )}

            <form action={async (formData) => {
                setLoading(true);
                setMessage(null);

                // Append avatarUrl manually since it's controlled state
                formData.set('avatarUrl', avatarUrl);

                const result = await updateUserProfile(formData);

                if (result.success) {
                    setMessage({ type: 'success', text: result.message });
                    router.refresh();
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
                setLoading(false);
            }} className="space-y-8">
                {message && (
                    <div className={`p-4 rounded border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                        <p className="text-sm font-mono">{message.text}</p>
                    </div>
                )}

                {/* Section 1: Identity */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 uppercase tracking-widest flex items-center gap-2">
                        <User size={16} className="text-green-500" />
                        Identity Matrix
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6">
                        {/* Avatar Preview & Edit */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-green-500/50 bg-black group cursor-pointer" onClick={() => setShowAvatarSelector(true)}>
                                <Image
                                    src={avatarUrl || "/default-avatar.svg"}
                                    alt="Avatar"
                                    fill
                                    className="object-cover group-hover:opacity-50 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon size={20} className="text-white" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAvatarSelector(true)}
                                className="text-[10px] font-bold text-green-500 hover:text-green-400 uppercase tracking-wider border border-green-500/30 px-2 py-1 rounded hover:bg-green-500/10 transition-colors"
                            >
                                Change Avatar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Codename
                                </label>
                                <input
                                    name="username"
                                    defaultValue={user.username || ""}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                    placeholder="ENTER_CODENAME"
                                />
                                <p className="text-[10px] text-gray-500 font-mono">
                                    Only letters, numbers, underscores, and hyphens allowed. No spaces.
                                </p>
                            </div>

                            {/* Real Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        First Name
                                    </label>
                                    <input
                                        name="firstName"
                                        defaultValue={user.firstName || ""}
                                        className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                        placeholder="FIRST_NAME"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Last Name
                                    </label>
                                    <input
                                        name="lastName"
                                        defaultValue={user.lastName || ""}
                                        className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                        placeholder="LAST_NAME"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Manifesto
                                </label>
                                <textarea
                                    name="bio"
                                    defaultValue={user.bio || ""}
                                    rows={3}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm resize-none"
                                    placeholder="SYSTEM_STATUS_NORMAL..."
                                />
                            </div>

                            {/* Birth Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} />
                                    Inception Date (Birth Date)
                                </label>
                                <input
                                    name="birthDate"
                                    type="date"
                                    defaultValue={formattedBirthDate}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Security */}
                <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={16} className="text-green-500" />
                        Security Protocols
                    </h3>

                    <div className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} />
                                Comm Link (Email)
                            </label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={user.email || ""}
                                className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                            />
                        </div>

                        {/* Password Change */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} />
                                    Update Cipher (Password)
                                </label>
                                <input
                                    name="currentPassword"
                                    type="password"
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                    placeholder="CURRENT_PASSWORD"
                                />
                            </div>
                            <div className="space-y-2">
                                <input
                                    name="newPassword"
                                    type="password"
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                    placeholder="NEW_PASSWORD"
                                />
                            </div>
                            <div className="space-y-2">
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                    placeholder="CONFIRM_NEW_PASSWORD"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-4 rounded uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </form>

            {showAvatarSelector && (
                <AvatarSelector
                    currentAvatar={avatarUrl}
                    onSelect={(url) => setAvatarUrl(url)}
                    onClose={() => setShowAvatarSelector(false)}
                />
            )}
        </div>
    );
}
