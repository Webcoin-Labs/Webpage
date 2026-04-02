import "server-only";

import type { IntegrationProvider } from "@prisma/client";

export type IntegrationPluginMode = "oauth" | "manual" | "native";

export type IntegrationPluginDefinition = {
  provider: IntegrationProvider | "OPENCLAW" | "TELEGRAM" | "WALLET";
  label: string;
  mode: IntegrationPluginMode;
  description: string;
  connectPath?: string;
};

export const INTEGRATION_PLUGINS: IntegrationPluginDefinition[] = [
  {
    provider: "GITHUB",
    label: "GitHub Plugin",
    mode: "oauth",
    description: "OAuth plugin for repo sync, profile proof, and project import.",
    connectPath: "/api/integrations/connect/github",
  },
  {
    provider: "GMAIL",
    label: "Gmail Plugin",
    mode: "oauth",
    description: "OAuth plugin for inbound email context and outreach continuity.",
    connectPath: "/api/integrations/connect/google",
  },
  {
    provider: "GOOGLE_CALENDAR",
    label: "Google Calendar Plugin",
    mode: "oauth",
    description: "OAuth plugin for scheduling context and meeting sync.",
    connectPath: "/api/integrations/connect/google",
  },
  {
    provider: "NOTION",
    label: "Notion Plugin",
    mode: "oauth",
    description: "OAuth plugin for docs and workspace knowledge sync.",
    connectPath: "/api/integrations/connect/notion",
  },
  {
    provider: "JIRA",
    label: "Jira Plugin",
    mode: "oauth",
    description: "OAuth plugin for issue context and execution signals.",
    connectPath: "/api/integrations/connect/jira",
  },
  {
    provider: "CALENDLY",
    label: "Calendly Plugin",
    mode: "oauth",
    description: "OAuth plugin for investor/founder booking workflows.",
    connectPath: "/api/integrations/connect/calendly",
  },
  {
    provider: "CAL_DOT_COM",
    label: "Cal.com Plugin",
    mode: "manual",
    description: "Manual plugin setup for external scheduling workflows.",
  },
  {
    provider: "FARCASTER",
    label: "Farcaster Plugin",
    mode: "manual",
    description: "Manual identity link for social-proof and ecosystem presence.",
  },
  {
    provider: "OPENCLAW",
    label: "OpenClaw Plugin",
    mode: "native",
    description: "Native connector for Telegram workspace sync and replies.",
  },
  {
    provider: "TELEGRAM",
    label: "Telegram Plugin",
    mode: "native",
    description: "Native plugin powered by OpenClaw workspace/thread sync.",
  },
  {
    provider: "WALLET",
    label: "Wallet Plugin",
    mode: "native",
    description: "Native wallet identity plugin (EVM and Solana).",
  },
];

export function getIntegrationPlugin(provider: IntegrationPluginDefinition["provider"]) {
  return INTEGRATION_PLUGINS.find((plugin) => plugin.provider === provider) ?? null;
}
