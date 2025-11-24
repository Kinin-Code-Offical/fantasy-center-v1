"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/canvasUtils";
import { X, Upload, Image as ImageIcon, ZoomIn, Check } from "lucide-react";

interface AvatarSelectorProps {
    currentAvatar: string;
    onSelect: (avatarUrl: string) => void;
    onClose: () => void;
}

const GALLERY_IMAGES = [
    "/profile-pictures/basketball.PNG",
    "/profile-pictures/dumbell.PNG",
    "/profile-pictures/football.PNG",
    "/profile-pictures/meditation.PNG",
    "/profile-pictures/runner.PNG",
    "/profile-pictures/tennis.PNG",
];

export default function AvatarSelector({ currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
            setActiveTab("upload");
        }
    };

    const handleSaveCrop = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (croppedImage) {
                    onSelect(croppedImage);
                    onClose();
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a12] border border-neon-cyan/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-bold text-white tracking-wide">SELECT AVATAR</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab("gallery")}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "gallery"
                                ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2 uppercase tracking-wider">
                            <ImageIcon size={16} /> Gallery
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("upload")}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "upload"
                                ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2 uppercase tracking-wider">
                            <Upload size={16} /> Upload
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[350px]">
                    {activeTab === "gallery" ? (
                        <div className="grid grid-cols-3 gap-4">
                            {GALLERY_IMAGES.map((src, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelect(src);
                                        onClose();
                                    }}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${currentAvatar === src
                                            ? "border-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                            : "border-transparent hover:border-white/30"
                                        }`}
                                >
                                    <img src={src} alt={`Avatar ${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    {currentAvatar === src && (
                                        <div className="absolute inset-0 bg-neon-cyan/20 flex items-center justify-center">
                                            <Check className="text-white drop-shadow-md" size={24} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {!imageSrc ? (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-16 h-16 bg-gray-800 group-hover:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-neon-cyan transition-colors">
                                        <Upload size={32} />
                                    </div>
                                    <p className="text-white font-bold mb-1 group-hover:text-neon-cyan transition-colors">Click to Upload</p>
                                    <p className="text-gray-400 text-xs">JPG, PNG, GIF up to 5MB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-4 border border-white/10">
                                        {/* @ts-ignore */}
                                        <Cropper
                                            image={imageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            onCropChange={setCrop}
                                            onCropComplete={onCropComplete}
                                            onZoomChange={setZoom}
                                            cropShape="round"
                                            showGrid={false}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <ZoomIn size={20} className="text-gray-400" />
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                        />
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <button
                                            onClick={() => setImageSrc(null)}
                                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-wide"
                                        >
                                            Change Image
                                        </button>
                                        <button
                                            onClick={handleSaveCrop}
                                            className="flex-1 py-3 bg-neon-cyan hover:bg-cyan-400 text-black rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-wide"
                                        >
                                            Save Avatar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function readFile(file: File) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result), false);
        reader.readAsDataURL(file);
    });
}
