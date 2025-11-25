"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Lock, Terminal, User, Mail, Calendar } from "lucide-react";
import { registerUser } from "@/lib/auth-actions";
import { useRouter } from "next/navigation";

// Zod schema
const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens allowed"),
    birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date",
    }),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    securityCode: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const [securityCode, setSecurityCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverSuccess, setServerSuccess] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            username: "",
            birthDate: "",
            email: "",
            password: "",
            confirmPassword: "",
            securityCode: "",
        },
    });

    useEffect(() => {
        // Generate random 6-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSecurityCode(code);
        form.setValue("securityCode", code);
    }, [form]);

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setServerError(null);
        setServerSuccess(null);

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });

        try {
            // We need to pass an initial state as the first argument because registerUser is designed for useActionState/useFormState
            const result = await registerUser({ error: "", success: false, message: "" }, formData);

            if (result.error) {
                setServerError(result.error);
            } else if (result.success) {
                setServerSuccess(result.message || "Registration successful!");
                // Optionally redirect or show success message
                // router.push("/login"); 
            }
        } catch (err) {
            setServerError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-1">
            {/* Container */}
            <div className="relative bg-black/90 border border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.2)] p-8 overflow-hidden">
                {/* Decorative Corner Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ff41]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ff41]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ff41]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ff41]" />

                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="text-[#00ff41] font-mono text-2xl font-bold tracking-widest mb-2">
                        NEW_USER_REGISTRATION
                    </h2>
                    <div className="h-px w-full bg-[#00ff41]/30" />
                </div>

                {/* Secure Handshake Box */}
                <div className="mb-8 bg-gray-900/50 border border-[#00ff41]/50 p-4 text-center relative group">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-[#00ff41] text-xs font-mono">
                        SESSION SECURITY ID
                    </div>
                    <div className="text-3xl font-mono font-bold text-[#00ff41] tracking-[0.5em] drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]">
                        {securityCode || "LOADING..."}
                    </div>
                    <p className="text-gray-500 text-xs mt-2 font-mono">
                        Verify this code matches the one in your email to prevent phishing.
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                                FIRST_NAME
                            </label>
                            <input
                                {...form.register("firstName")}
                                className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                                placeholder="John"
                            />
                            {form.formState.errors.firstName && (
                                <p className="text-red-500 text-xs font-mono">{form.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                                LAST_NAME
                            </label>
                            <input
                                {...form.register("lastName")}
                                className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                                placeholder="Doe"
                            />
                            {form.formState.errors.lastName && (
                                <p className="text-red-500 text-xs font-mono">{form.formState.errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                            <User size={14} /> USERNAME
                        </label>
                        <input
                            {...form.register("username")}
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                            placeholder="Enter codename..."
                        />
                        {form.formState.errors.username && (
                            <p className="text-red-500 text-xs font-mono">{form.formState.errors.username.message}</p>
                        )}
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-2">
                        <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                            <Calendar size={14} /> BIRTH_DATE
                        </label>
                        <input
                            {...form.register("birthDate")}
                            type="date"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans [color-scheme:dark]"
                        />
                        {form.formState.errors.birthDate && (
                            <p className="text-red-500 text-xs font-mono">{form.formState.errors.birthDate.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                            <Mail size={14} /> EMAIL_ADDRESS
                        </label>
                        <input
                            {...form.register("email")}
                            type="email"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                            placeholder="name@domain.com"
                        />
                        {form.formState.errors.email && (
                            <p className="text-red-500 text-xs font-mono">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                            <Lock size={14} /> PASSWORD
                        </label>
                        <input
                            {...form.register("password")}
                            type="password"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.password && (
                            <p className="text-red-500 text-xs font-mono">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-[#00ff41] text-xs font-mono tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} /> CONFIRM_PASSWORD
                        </label>
                        <input
                            {...form.register("confirmPassword")}
                            type="password"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 focus:outline-none focus:border-[#00ff41] transition-colors font-sans"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.confirmPassword && (
                            <p className="text-red-500 text-xs font-mono">{form.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Messages */}
                    {serverError && (
                        <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-500 text-xs font-mono text-center">
                            ERROR: {serverError}
                        </div>
                    )}
                    {serverSuccess && (
                        <div className="bg-green-900/20 border border-green-500/50 p-3 text-green-500 text-xs font-mono text-center">
                            SUCCESS: {serverSuccess}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#00ff41] text-black font-bold py-4 hover:bg-[#ccff00] transition-all duration-300 tracking-widest relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoading ? "ESTABLISHING CONNECTION..." : "INITIALIZE ACCOUNT"}
                    </button>
                </form>
            </div>
        </div>
    );
}
