import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
    Link,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface VerifyEmailProps {
    confirmLink: string;
    email: string;
    securityCode: string;
    date?: string;
}

export const VerifyEmail = ({
    confirmLink,
    email,
    securityCode,
    date = new Date().toLocaleString(),
}: VerifyEmailProps) => {
    return (
        <Html>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                void: "#050505",
                                neon: "#00ff41",
                                "neon-dim": "rgba(0, 255, 65, 0.1)",
                                cyber: "#ccff00",
                                slate: "#0a0a0a",
                                dim: "#4b5563",
                                alert: "#ff0033",
                                "alert-dim": "rgba(255, 0, 51, 0.1)",
                            },
                            fontFamily: {
                                mono: ["Courier New", "Roboto Mono", "monospace"],
                                sans: ["Helvetica", "Arial", "sans-serif"],
                            },
                            boxShadow: {
                                glow: "0 0 10px #00ff41, 0 0 20px rgba(0, 255, 65, 0.2)",
                            },
                        },
                    },
                }}
            >
                <Head />
                <Preview>VERIFY IDENTITY // TRADE CENTER</Preview>
                <Body className="bg-void text-white font-sans my-auto mx-auto px-2 py-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.5) 3px)" }}>
                    <Container className="border border-neon rounded-none shadow-[0_0_15px_rgba(0,255,65,0.3)] bg-slate max-w-[600px] mx-auto overflow-hidden relative">

                        {/* Status Bar */}
                        <Section className="bg-black border-b border-dim p-2">
                            <Text className="text-dim font-mono text-[10px] m-0 flex justify-between">
                                <span className="float-left">PROTOCOL: HANDSHAKE</span>
                                <span className="float-right">ENCRYPTION: AES-256</span>
                            </Text>
                        </Section>

                        {/* Header Block */}
                        <Section className="bg-neon p-4 text-center">
                            <Text className="text-black font-mono text-xl font-bold tracking-widest m-0">
                                INCOMING TRANSMISSION
                            </Text>
                        </Section>

                        <Section className="p-8">

                            {/* User Identity */}
                            <Section className="bg-black border border-dashed border-neon p-3 mb-6 text-center">
                                <Text className="text-neon font-mono text-sm m-0 tracking-wide">
                                    TARGET: {email}
                                </Text>
                            </Section>

                            {/* The Message */}
                            <Text className="text-gray-300 text-base leading-relaxed mb-6 font-mono">
                                System has flagged a new registration request for Trade Center Fantasy. To authorize access to the neural network and synchronize Yahoo Data, identity verification is mandatory.
                            </Text>

                            {/* Security Code Section */}
                            <Section className="bg-slate border border-dim p-6 mb-6 text-center">
                                <Text className="text-dim text-xs uppercase tracking-widest mb-2">Personal Security Code</Text>
                                <Text className="text-cyber font-mono text-3xl font-bold tracking-[0.2em] m-0 text-shadow-glow">
                                    {securityCode}
                                </Text>
                                <Text className="text-gray-400 text-xs mt-4">
                                    Verify this code matches the one displayed on your login screen to ensure you are not on a phishing site.
                                </Text>
                            </Section>

                            {/* Warning Section */}
                            <Section className="border-l-4 border-alert bg-alert-dim p-4 mb-8">
                                <Text className="text-alert font-mono font-bold m-0 text-xs tracking-wider">
                                    WARNING: UNAUTHORIZED ACCESS ATTEMPTS WILL BE LOGGED.
                                </Text>
                            </Section>

                            {/* CTA Button */}
                            <Section className="text-center mb-8">
                                <Button
                                    className="bg-neon text-black font-bold px-8 py-4 text-lg tracking-widest hover:bg-cyber transition-colors border-none cursor-pointer block w-full"
                                    href={confirmLink}
                                >
                                    [ EXECUTE VERIFICATION ]
                                </Button>
                            </Section>

                            <Hr className="border-dim my-6" />

                            {/* Footer */}
                            <Text className="text-dim font-mono text-[10px] text-center m-0 leading-tight">
                                SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}
                                <br />
                                TIMESTAMP: {date}
                                <br />
                                ORIGIN IP: [TRACE HIDDEN]
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default VerifyEmail;
