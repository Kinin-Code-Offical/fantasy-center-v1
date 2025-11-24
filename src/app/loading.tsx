import CyberLoader from "@/components/CyberLoader";

export default function Loading() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <CyberLoader />
        </div>
    );
}
