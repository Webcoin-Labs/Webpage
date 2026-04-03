import type { SimpleIcon } from "simple-icons";
import {
  siCalendly,
  siCaldotcom,
  siFarcaster,
  siGithub,
  siGmail,
  siGooglecalendar,
  siJira,
  siNotion,
} from "simple-icons";

/** Brand SVGs from the simple-icons project (CC0-1.0). */
const INTEGRATION_ICONS: Record<string, SimpleIcon> = {
  GMAIL: siGmail,
  GOOGLE_CALENDAR: siGooglecalendar,
  NOTION: siNotion,
  GITHUB: siGithub,
  JIRA: siJira,
  CALENDLY: siCalendly,
  CAL_DOT_COM: siCaldotcom,
  FARCASTER: siFarcaster,
};

export function hasIntegrationBrandIcon(id: string) {
  return Boolean(INTEGRATION_ICONS[id]);
}

/** Dark UI: near-black brand marks need a light fill for contrast on charcoal cards. */
const FILL_ON_DARK: Partial<Record<string, string>> = {
  GITHUB: "#ffffff",
  NOTION: "#ffffff",
};

export function IntegrationBrandIcon({ id, className }: { id: string; className?: string }) {
  const icon = INTEGRATION_ICONS[id];
  if (!icon) return null;
  const fill = FILL_ON_DARK[id] ?? `#${icon.hex}`;
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <title>{icon.title}</title>
      <path d={icon.path} fill={fill} />
    </svg>
  );
}
