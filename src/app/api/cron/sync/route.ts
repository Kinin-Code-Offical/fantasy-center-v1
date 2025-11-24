import { syncPlayerNews } from "@/lib/actions/sync";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const result = await syncPlayerNews();
        return NextResponse.json({ success: true, result, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error("Cron Sync Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
