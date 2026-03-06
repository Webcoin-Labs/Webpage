import { MessageSquare } from "lucide-react";

export const metadata = { title: "Messages — Webcoin Labs" };

export default function MessagesPage() {
    return (
        <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Messages</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Messaging is coming soon. For now, reach the team via{" "}
                <a href="https://t.me/webcoinlabs" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
                    Telegram
                </a>{" "}
                or{" "}
                <a href="mailto:hello@webcoinlabs.com" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
                    email
                </a>.
            </p>
        </div>
    );
}
