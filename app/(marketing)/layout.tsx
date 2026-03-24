import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatSupportWidgetClient } from "@/components/chat/ChatSupportWidgetClient";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col dark bg-background text-foreground">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatSupportWidgetClient />
        </div>
    );
}
