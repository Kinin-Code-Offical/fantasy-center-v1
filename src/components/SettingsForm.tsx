"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserProfile, resendVerificationEmailAction } from "@/lib/settings-actions";
import { useRouter } from "next/navigation";
import { Save, Loader2, User, FileText, Mail, Lock, Shield, Calendar, AlertTriangle, CheckCircle2, Terminal, RefreshCw } from "lucide-react";
import SecurityModal from "./SecurityModal";
import AvatarSelector from "./AvatarSelector";
import DeleteAccountButton from "./DeleteAccountButton";
import Image from "next/image";

// --- Schemas ---

const generalSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Invalid characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    bio: z.string().optional(),
    birthDate: z.string().optional(),
});

const securitySchema = z.object({
    email: z.string().email("Invalid email address"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    if (data.newPassword && data.newPassword.length > 0 && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
}).refine((data) => {
    if (data.newPassword !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type GeneralFormValues = z.infer<typeof generalSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

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
    const [activeTab, setActiveTab] = useState<"general" | "security">("general");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Security Modal State
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityCode, setSecurityCode] = useState("");
    const [pendingSecurityData, setPendingSecurityData] = useState<SecurityFormValues | null>(null);

    // Avatar State
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

    // --- Forms ---

    const generalForm = useForm<GeneralFormValues>({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            username: user.username || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            bio: user.bio || "",
            birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        },
    });

    const securityForm = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            email: user.email || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // --- Handlers ---

    const onGeneralSubmit = async (data: GeneralFormValues) => {
        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("username", data.username);
        formData.append("firstName", data.firstName);
        formData.append("lastName", data.lastName);
        formData.append("bio", data.bio || "");
        formData.append("birthDate", data.birthDate || "");
        formData.append("avatarUrl", avatarUrl);

        try {
            const result = await updateUserProfile(formData);
            if (result.success) {
                setMessage({ type: 'success', text: "PROFILE_UPDATED // SYNC_COMPLETE" });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: `ERROR: ${result.message}` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "SYSTEM_FAILURE // TRY_AGAIN" });
        } finally {
            setLoading(false);
        }
    };

    const onSecuritySubmit = async (data: SecurityFormValues) => {
        // Check if sensitive data is being changed
        const isEmailChanged = data.email !== user.email;
        const isPasswordChanged = !!data.newPassword;

        if (isEmailChanged || isPasswordChanged) {
            // Trigger Security Protocol
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setSecurityCode(code);
            setPendingSecurityData(data);
            setShowSecurityModal(true);
        } else {
            // No changes to sensitive data, just submit (though likely nothing to do)
            setMessage({ type: 'success', text: "NO_CHANGES_DETECTED" });
        }
    };

    const handleSecurityConfirm = async () => {
        if (!pendingSecurityData) return;

        setLoading(true);
        // Keep modal open but show loading state inside it if supported, or close it.
        // The modal has an isLoading prop.

        const formData = new FormData();
        formData.append("email", pendingSecurityData.email);
        if (pendingSecurityData.newPassword) {
            formData.append("currentPassword", pendingSecurityData.currentPassword || "");
            formData.append("newPassword", pendingSecurityData.newPassword);
            formData.append("confirmPassword", pendingSecurityData.confirmPassword || "");
        }
        formData.append("securityCode", securityCode);

        try {
            const result = await updateUserProfile(formData);
            if (result.success) {
                setMessage({ type: 'success', text: "SECURITY_UPDATE_SUCCESS // ENCRYPTED" });
                setShowSecurityModal(false);
                securityForm.reset({
                    email: pendingSecurityData.email,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: `SECURITY_FAIL: ${result.message}` });
                setShowSecurityModal(false);
            }
        } catch (error) {
            setMessage({ type: 'error', text: "CRITICAL_ERROR // ABORTED" });
            setShowSecurityModal(false);
        } finally {
            setLoading(false);
            setPendingSecurityData(null);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <SecurityModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                securityCode={securityCode}
                onConfirm={handleSecurityConfirm}
                isLoading={loading}
            />

            {/* Header */}
            <div className="mb-8 border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2 flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-[#00ff41]" />
                    Account_Settings
                </h1>
                <p className="text-slate-400 font-mono text-sm">
                    MANAGE_IDENTITY // SECURITY_PROTOCOLS
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`px-6 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "general"
                        ? "border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                >
                    General_Info
                </button>
                <button
                    onClick={() => setActiveTab("security")}
                    className={`px-6 py-2 font-mono text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "security"
                        ? "border-[#00ff41] text-[#00ff41] bg-[#00ff41]/5"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                >
                    Security_Clearance
                </button>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`mb-6 p-4 rounded border font-mono text-sm flex items-center gap-3 ${message.type === 'success'
                    ? "bg-green-500/10 border-green-500/50 text-green-400"
                    : "bg-red-500/10 border-red-500/50 text-red-400"
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="bg-[#0a0a12] border border-white/10 rounded-xl p-8 relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                {activeTab === "general" ? (
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="relative z-10 space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                            <User className="w-10 h-10 text-[#00ff41]" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarSelector(true)}
                                    className="absolute bottom-0 right-0 bg-[#00ff41] text-black p-1.5 rounded-full hover:bg-[#00cc33] transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-white font-bold uppercase tracking-wider">Profile_Image</h3>
                                <p className="text-slate-500 text-xs font-mono mt-1">RECOMMENDED: 500x500PX // PNG_JPG</p>
                            </div>
                        </div>

                        {showAvatarSelector && (
                            <div className="mb-8 p-4 border border-white/10 rounded bg-black/50">
                                <AvatarSelector
                                    currentAvatar={avatarUrl}
                                    onSelect={(url) => {
                                        setAvatarUrl(url);
                                        setShowAvatarSelector(false);
                                    }}
                                    onClose={() => setShowAvatarSelector(false)}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        {...generalForm.register("username")}
                                        className="w-full bg-black/50 border border-white/10 rounded px-10 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                        placeholder="ENTER_USERNAME"
                                    />
                                </div>
                                {generalForm.formState.errors.username && (
                                    <p className="text-red-400 text-xs font-mono">{generalForm.formState.errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">Birth_Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        {...generalForm.register("birthDate")}
                                        className="w-full bg-black/50 border border-white/10 rounded px-10 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">First_Name</label>
                                <input
                                    {...generalForm.register("firstName")}
                                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                    placeholder="ENTER_FIRST_NAME"
                                />
                                {generalForm.formState.errors.firstName && (
                                    <p className="text-red-400 text-xs font-mono">{generalForm.formState.errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">Last_Name</label>
                                <input
                                    {...generalForm.register("lastName")}
                                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                    placeholder="ENTER_LAST_NAME"
                                />
                                {generalForm.formState.errors.lastName && (
                                    <p className="text-red-400 text-xs font-mono">{generalForm.formState.errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">Bio_Data</label>
                            <textarea
                                {...generalForm.register("bio")}
                                rows={4}
                                className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700 resize-none"
                                placeholder="ENTER_BIO_DESCRIPTION..."
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#00ff41] text-black font-bold font-mono px-8 py-3 rounded hover:bg-[#00cc33] transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-wider"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save_Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="relative z-10 space-y-8">
                        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded flex items-start gap-3">
                            <Shield className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                            <div>
                                <h4 className="text-red-500 font-bold font-mono text-sm uppercase tracking-wider mb-1">Restricted Area</h4>
                                <p className="text-slate-400 text-xs font-mono">
                                    Modifying these settings requires high-level clearance.
                                    A security handshake will be initiated upon save.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#00ff41] uppercase tracking-widest font-mono">Email_Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        {...securityForm.register("email")}
                                        className="w-full bg-black/50 border border-white/10 rounded px-10 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                    />
                                </div>
                                {user.pendingEmail && (
                                    <p className="text-yellow-500 text-xs font-mono mt-1 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Pending verification: {user.pendingEmail}
                                    </p>
                                )}
                                {securityForm.formState.errors.email && (
                                    <p className="text-red-400 text-xs font-mono">{securityForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-6 space-y-6">
                                <h3 className="text-white font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-[#00ff41]" />
                                    Password_Reset
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Current_Password</label>
                                    <input
                                        type="password"
                                        {...securityForm.register("currentPassword")}
                                        className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                        placeholder="••••••••"
                                    />
                                    {securityForm.formState.errors.currentPassword && (
                                        <p className="text-red-400 text-xs font-mono">{securityForm.formState.errors.currentPassword.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">New_Password</label>
                                        <input
                                            type="password"
                                            {...securityForm.register("newPassword")}
                                            className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Confirm_Password</label>
                                        <input
                                            type="password"
                                            {...securityForm.register("confirmPassword")}
                                            className="w-full bg-black/50 border border-white/10 rounded px-4 py-2.5 text-white font-mono focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] outline-none transition-all placeholder-slate-700"
                                            placeholder="••••••••"
                                        />
                                        {securityForm.formState.errors.confirmPassword && (
                                            <p className="text-red-400 text-xs font-mono">{securityForm.formState.errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6 space-y-6">
                            <h3 className="text-red-500 font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Danger_Zone
                            </h3>
                            <div className="bg-red-500/5 border border-red-500/20 rounded p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-bold font-mono text-sm uppercase tracking-wider">Delete Account</h4>
                                    <p className="text-slate-400 text-xs font-mono mt-1">
                                        PERMANENTLY_REMOVE_DATA // NO_RECOVERY
                                    </p>
                                </div>
                                <DeleteAccountButton />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-red-500/10 border border-red-500 text-red-500 font-bold font-mono px-8 py-3 rounded hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-wider"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                Update_Security
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}