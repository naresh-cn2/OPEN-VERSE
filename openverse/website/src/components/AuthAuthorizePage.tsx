import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Copy, ArrowRight, ExternalLink } from "lucide-react";

export const AuthAuthorizePage: React.FC = () => {
  const [provider, setProvider] = useState<"google" | "github">("google");
  const [redirectTo, setRedirectTo] = useState("openverse://auth/callback");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("user@openverse.account");
  const [name, setName] = useState("Authorized Developer");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const p = url.searchParams.get("provider");
    if (p === "github" || p === "google") {
      setProvider(p);
      if (p === "github") {
        setEmail("developer@github.account");
        setName("GitHub Developer");
      } else {
        setEmail("user@gmail.com");
        setName("Google User");
      }
    }
    const r = url.searchParams.get("redirect_to");
    if (r) setRedirectTo(r);
  }, []);

  const token = `ov_auth_${provider}_${Date.now()}`;
  const callbackUrl = `${redirectTo}#access_token=${token}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&provider=${provider}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    // Attempt automatic deep link redirect
    const timer = setTimeout(() => {
      window.location.href = callbackUrl;
    }, 800);
    return () => clearTimeout(timer);
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111116] border border-[#27272a] rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/30 inline-flex items-center justify-center mb-5 text-violet-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-4">
          {provider === "github" ? "GitHub" : "Google"} Authorization
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Connect to OPEN-VERSE</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Authorize OPEN-VERSE Mobile to access your account securely.
        </p>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 mb-6 flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{name}</div>
            <div className="text-xs text-zinc-400 truncate">{email}</div>
          </div>
        </div>

        <a
          href={callbackUrl}
          className="w-full py-3.5 px-4 rounded-xl font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 mb-3 transition-colors shadow-lg shadow-violet-900/30"
        >
          <span>Authorize &amp; Open App</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-3 px-4 rounded-xl font-medium bg-[#18181b] hover:bg-[#27272a] text-zinc-300 border border-[#27272a] flex items-center justify-center gap-2 transition-colors text-sm mb-4"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Copied URL to Clipboard!" : "Copy Callback URL"}</span>
        </button>

        <p className="text-xs text-zinc-500">
          If your browser did not redirect automatically, tap <strong>Authorize &amp; Open App</strong> or copy the URL and paste it into the app.
        </p>
      </div>
    </div>
  );
};

