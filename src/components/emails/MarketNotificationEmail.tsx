import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface MarketNotificationEmailProps {
    playerName: string;
    leagueName: string;
    playerPoints: number;
    playerProfileUrl: string;
}

export const MarketNotificationEmail = ({
    playerName,
    leagueName,
    playerPoints,
    playerProfileUrl,
}: MarketNotificationEmailProps) => {
    const previewText = `MARKET ALERT: ${playerName} is now available in ${leagueName}`;

    return (
        <Html>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                neonGreen: "#00ff41",
                                neonCyan: "#06b6d4",
                                darkBg: "#050a05",
                            },
                        },
                    },
                }}
            >
                <Head />
                <Preview>{previewText}</Preview>
                <Body className="bg-[#050a05] my-auto mx-auto font-mono text-white">
                    <Container className="border border-[#00ff41] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-black/90">
                        <Section className="mt-[32px]">
                            <Heading className="text-[#00ff41] text-[24px] font-normal text-center p-0 my-[30px] mx-0 tracking-[0.2em]">
                                // MARKET_ALERT
                            </Heading>
                        </Section>

                        <Section className="text-center">
                            <Text className="text-gray-400 text-[14px] leading-[24px] uppercase tracking-widest">
                                New Asset Detected in Sector:
                            </Text>
                            <Text className="text-white text-[18px] font-bold uppercase tracking-wider mb-8">
                                [{leagueName}]
                            </Text>
                        </Section>

                        <Section className="border border-[#00ff41]/30 bg-[#00ff41]/5 p-6 rounded mb-8 text-center">
                            <Text className="text-[#06b6d4] text-[12px] font-bold uppercase tracking-[0.2em] mb-2">
                                TARGET ASSET
                            </Text>
                            <Heading className="text-white text-[32px] font-black m-0 uppercase italic">
                                {playerName}
                            </Heading>
                            <Text className="text-[#00ff41] text-[16px] font-bold mt-2 font-mono">
                                AVG PTS: {playerPoints}
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                href={playerProfileUrl}
                                className="bg-[#00ff41] text-black px-8 py-4 font-bold text-[14px] no-underline rounded hover:bg-white transition-all uppercase tracking-widest"
                            >
                                Analyze Asset
                            </Link>
                        </Section>

                        <Text className="text-gray-500 text-[12px] leading-[24px] text-center mt-8 border-t border-gray-800 pt-8">
                            SECURE TRANSMISSION // TRADE CENTER INTELLIGENCE
                            <br />
                            <span className="text-[10px]">
                                If you did not request this intelligence, please ignore this transmission.
                            </span>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default MarketNotificationEmail;
