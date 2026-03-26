"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { saveWalletConnection } from "@/app/actions/webcoin-os";

type WalletSummary = {
  id: string;
  provider: string;
  network: string;
  address: string;
  isPrimary: boolean;
};

type EthereumProvider = {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request: (payload: { method: string }) => Promise<string[]>;
};

type SolanaProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey?: { toString: () => string } }>;
};

function trimAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function WalletConnectionCard({ wallets }: { wallets: WalletSummary[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState<"EVM" | "SOLANA" | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string>("");

  const walletCountLabel = useMemo(() => {
    if (wallets.length === 0) return "No wallet linked yet.";
    if (wallets.length === 1) return "1 wallet linked.";
    return `${wallets.length} wallets linked.`;
  }, [wallets]);

  const saveDetectedWallet = (network: "EVM" | "SOLANA", provider: string, address: string) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("network", network);
      formData.set("provider", provider);
      formData.set("address", address);
      const result = await saveWalletConnection(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(`${network} wallet linked.`);
    });
  };

  const connectEvmWallet = async () => {
    setError("");
    setSuccess("");
    try {
      const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
      if (!ethereum) {
        setError("No EVM wallet detected. Install MetaMask, Coinbase Wallet, or another injected EVM wallet.");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      if (!account) {
        setError("No EVM account returned by wallet.");
        return;
      }
      const provider = ethereum.isCoinbaseWallet ? "COINBASE" : ethereum.isMetaMask ? "METAMASK" : "OTHER";
      setDetectedAddress(account);
      setDetectedNetwork("EVM");
      setDetectedProvider(provider);
      saveDetectedWallet("EVM", provider, account);
    } catch {
      setError("Unable to connect EVM wallet.");
    }
  };

  const connectSolanaWallet = async () => {
    setError("");
    setSuccess("");
    try {
      const solana = (window as Window & { solana?: SolanaProvider }).solana;
      if (!solana) {
        setError("No Solana wallet detected. Install Phantom or another Solana wallet extension.");
        return;
      }
      const response = await solana.connect();
      const address = response.publicKey?.toString();
      if (!address) {
        setError("No Solana address returned by wallet.");
        return;
      }
      const provider = solana.isPhantom ? "PHANTOM" : "OTHER";
      setDetectedAddress(address);
      setDetectedNetwork("SOLANA");
      setDetectedProvider(provider);
      saveDetectedWallet("SOLANA", provider, address);
    } catch {
      setError("Unable to connect Solana wallet.");
    }
  };

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Wallet connection</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect EVM and Solana wallets here. RainbowKit would be EVM-only, so this settings flow keeps both networks usable in one place.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          {walletCountLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={connectEvmWallet}
          disabled={isPending}
          className="rounded-2xl border border-border/60 bg-background/50 px-4 py-4 text-left transition hover:border-cyan-500/30"
        >
          <p className="text-sm font-semibold text-foreground">Connect EVM wallet</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            MetaMask, Coinbase Wallet, or another injected EVM wallet.
          </p>
        </button>
        <button
          type="button"
          onClick={connectSolanaWallet}
          disabled={isPending}
          className="rounded-2xl border border-border/60 bg-background/50 px-4 py-4 text-left transition hover:border-cyan-500/30"
        >
          <p className="text-sm font-semibold text-foreground">Connect Solana wallet</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Phantom or another injected Solana wallet.
          </p>
        </button>
      </div>

      {isPending ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Linking wallet...
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {detectedAddress && detectedNetwork ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
          Last connected: {detectedNetwork} via {detectedProvider} · {trimAddress(detectedAddress)}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {wallets.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">No wallet linked yet.</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div key={wallet.id} className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {wallet.network} · {wallet.provider}
                </p>
                {wallet.isPrimary ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                    Primary
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{trimAddress(wallet.address)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
