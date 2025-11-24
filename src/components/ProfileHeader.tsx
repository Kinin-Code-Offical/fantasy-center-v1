"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/lib/profile-actions";
import AvatarSelector from "./AvatarSelector";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ProfileHeaderProps {
    user: any;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    const { update } = useSession();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || user.image || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        email: user.email || "",
    });
    const [loading, setLoading] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile(formData);
            // Force session update to reflect changes in Navbar immediately
            await update({
                ...formData
            });
            setIsEditing(false);
            router.refresh(); // Refresh server components
        } catch (error) {
            console.error(error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage("Passwords do not match");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage("Password must be at least 6 characters");
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword(passwordData.oldPassword, passwordData.newPassword);
            setPasswordMessage("Password updated successfully!");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (e: any) {
            setPasswordMessage(e.message || "Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute -top-12 left-0 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider">Back</span>
            </button>

            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.05)]">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Avatar */}
                    <div
                        className={`relative group ${isEditing ? 'cursor-pointer' : ''}`}
                        onClick={() => isEditing && setShowAvatarSelector(true)}
                    >
                        <div className="w-32 h-32 relative">
                            {/* Hexagonal Clip Path or Glowing Ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse" />
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-black relative z-10">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-4xl text-gray-600">👤</div>
                                )}
                            </div>
                        </div>
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <span className="text-xs text-green-400 font-bold tracking-wider uppercase">Change</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left w-full">
                        {isEditing ? (
                            <div className="space-y-4 max-w-md mx-auto md:mx-0">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none transition-colors placeholder:text-gray-600"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none transition-colors placeholder:text-gray-600"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none transition-colors placeholder:text-gray-600"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none transition-colors [color-scheme:dark]"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                                <textarea
                                    placeholder="Bio"
                                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none resize-none h-20 placeholder:text-gray-600"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />

                                {/* Password Section */}
                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <h3 className="text-xs font-bold text-green-400 mb-4 uppercase tracking-widest">Security Protocol</h3>
                                    {user.hasPassword && (
                                        <input
                                            type="password"
                                            placeholder="Current Password"
                                            className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none mb-2 placeholder:text-gray-600"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        />
                                    )}
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="password"
                                            placeholder={user.hasPassword ? "New Password" : "Set Password"}
                                            className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none placeholder:text-gray-600"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirm"
                                            className="w-full bg-transparent border-b border-white/20 px-3 py-2 text-white focus:border-green-500 outline-none placeholder:text-gray-600"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                    {passwordMessage && (
                                        <p className={`text-xs mb-2 ${passwordMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
                                            {passwordMessage}
                                        </p>
                                    )}
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={passwordLoading || !passwordData.newPassword}
                                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors disabled:opacity-50 uppercase tracking-wider"
                                    >
                                        {passwordLoading ? "Updating..." : (user.hasPassword ? "Update Password" : "Set Password")}
                                    </button>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold text-sm transition-colors uppercase tracking-wider clip-path-polygon-[0_0,100%_0,95%_100%,0%_100%]"
                                    >
                                        {loading ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-4 py-2 bg-transparent border border-white/20 hover:bg-white/5 text-white font-bold text-sm transition-colors uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h1 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase">
                                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                                    </h1>
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <p className="text-green-400 font-mono text-lg tracking-widest">@{user.username || "USER"}</p>
                                    </div>
                                </div>

                                <p className="text-gray-400 max-w-lg mx-auto md:mx-0 leading-relaxed border-l-2 border-white/10 pl-4 mb-6 text-sm">
                                    {user.bio || "No bio data available in system."}
                                </p>

                                {user.birthDate && (
                                    <p className="text-gray-600 text-xs font-mono mb-6">
                                        DOB: {new Date(user.birthDate).toLocaleDateString('en-GB')}
                                    </p>
                                )}

                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="bg-black/40 border border-green-500/20 px-6 py-3 min-w-[120px] relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="block text-[10px] text-green-500/70 uppercase tracking-widest mb-1">Reputation</span>
                                        <span className="text-2xl font-mono font-bold text-white">★ {user.reputation}</span>
                                    </div>
                                    <div className="bg-black/40 border border-green-500/20 px-6 py-3 min-w-[120px] relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="block text-[10px] text-green-500/70 uppercase tracking-widest mb-1">Credits</span>
                                        <span className="text-2xl font-mono font-bold text-green-400">${user.credits}</span>
                                    </div>
                                    <div className="bg-black/40 border border-green-500/20 px-6 py-3 min-w-[120px] relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="block text-[10px] text-green-500/70 uppercase tracking-widest mb-1">Leagues</span>
                                        <span className="text-2xl font-mono font-bold text-white">{user.teams.length}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Edit Button */}
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-green-400 transition-colors"
                        >
                            <span className="sr-only">Edit Profile</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                    )}
                </div>
                {showAvatarSelector && (
                    <AvatarSelector
                        currentAvatar={formData.avatarUrl}
                        onSelect={(url) => setFormData({ ...formData, avatarUrl: url })}
                        onClose={() => setShowAvatarSelector(false)}
                    />
                )}
            </div>
        </div>
    );
}
