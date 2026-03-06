"use client";

import { createContext, useContext, useState } from "react";
import { CalendlyModal } from "@/components/modals/CalendlyModal";

const CalendlyContext = createContext<(() => void) | null>(null);

export function CalendlyProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  return (
    <CalendlyContext.Provider value={openModal}>
      {children}
      <CalendlyModal open={open} onClose={() => setOpen(false)} />
    </CalendlyContext.Provider>
  );
}

export function useCalendly() {
  const ctx = useContext(CalendlyContext);
  return ctx ?? (() => {});
}
