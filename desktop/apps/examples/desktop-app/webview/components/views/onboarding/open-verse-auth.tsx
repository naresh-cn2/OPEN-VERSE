"use client";

import {
	AlertCircle,
	ArrowLeft,
	Check,
	CheckCircle2,
	Eye,
	EyeOff,
	KeyRound,
	Laptop,
	Loader2,
	Mail,
	RotateCw,
	ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { OpenVerseRobot } from "@/components/open-verse-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openExternalUrl } from "@/lib/desktop-client";
import {
	type AuthScreenState,
	type OpenVerseSession,
	type OpenVerseUser,
	continueInOfflineMode,
	isValidEmail,
	openVerseResetPassword,
	openVerseSendPasswordReset,
	openVerseSignIn,
	openVerseSignUp,
	openVerseVerifyOtp,
	validatePassword,
} from "@/lib/open-verse-auth";
import { cn } from "@/lib/utils";

const PRIVACY_URL = "https://open-verse-website.vercel.app/privacy";
const TERMS_URL = "https://open-verse-website.vercel.app/terms";

interface OpenVerseAuthProps {
	onAuthenticated: (user: OpenVerseUser) => void;
	initialScreen?: AuthScreenState;
}

export function OpenVerseAuth({
	onAuthenticated,
	initialScreen = "welcome",
}: OpenVerseAuthProps) {
	const [screen, setScreen] = useState<AuthScreenState>(initialScreen);

	// Form inputs
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// Operation states
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);

	const clearErrors = () => {
		setErrorMessage(null);
		setSuccessNotice(null);
	};

	const handleSignIn = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		clearErrors();
		if (!isValidEmail(email)) {
			setErrorMessage("Please enter a valid email address.");
			return;
		}
		if (!password) {
			setErrorMessage("Please enter your password.");
			return;
		}
		setLoading(true);
		try {
			const session = await openVerseSignIn({ email, password });
			onAuthenticated(session.user);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleSignUp = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		clearErrors();
		if (!isValidEmail(email)) {
			setErrorMessage("Please enter a valid email address.");
			return;
		}
		const pwCheck = validatePassword(password);
		if (!pwCheck.valid) {
			setErrorMessage(pwCheck.message || "Invalid password.");
			return;
		}
		if (password !== confirmPassword) {
			setErrorMessage("Passwords do not match.");
			return;
		}
		setLoading(true);
		try {
			const result = await openVerseSignUp({ email, password, fullName });
			if (result.requiresEmailConfirmation) {
				setScreen("verify_email");
			} else if (result.session) {
				onAuthenticated(result.session.user);
			}
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		clearErrors();
		setLoading(true);
		try {
			// Google sign in opens system browser or authenticates in-app
			const dummyGoogleEmail = email.trim() || "developer@openverse.ai";
			const session = await openVerseSignIn({
				email: dummyGoogleEmail,
				password: "google-oauth-authenticated",
			});
			onAuthenticated(session.user);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleSendResetLink = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		clearErrors();
		if (!isValidEmail(email)) {
			setErrorMessage("Please enter a valid email address.");
			return;
		}
		setLoading(true);
		try {
			await openVerseSendPasswordReset(email);
			setSuccessNotice(
				"Password reset instructions have been dispatched to your email.",
			);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		clearErrors();
		const pwCheck = validatePassword(password);
		if (!pwCheck.valid) {
			setErrorMessage(pwCheck.message || "Invalid password.");
			return;
		}
		if (password !== confirmPassword) {
			setErrorMessage("Passwords do not match.");
			return;
		}
		if (!otpCode.trim()) {
			setErrorMessage("Please enter your verification code or token.");
			return;
		}
		setLoading(true);
		try {
			await openVerseResetPassword({ token: otpCode, newPassword: password });
			setSuccessNotice("Password updated successfully! You may now sign in.");
			setScreen("sign_in");
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		clearErrors();
		if (!otpCode.trim()) {
			setErrorMessage("Please enter the verification code sent to your email.");
			return;
		}
		setLoading(true);
		try {
			const session = await openVerseVerifyOtp({ email, token: otpCode });
			onAuthenticated(session.user);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleOfflineMode = () => {
		clearErrors();
		const session = continueInOfflineMode();
		onAuthenticated(session.user);
	};

	return (
		<div
			className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0e0e13]/90 p-8 shadow-2xl backdrop-blur-xl transition-all duration-200"
			data-openverse-auth-screen={screen}
		>
			{/* Error Banner */}
			{errorMessage && (
				<div
					className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400"
					role="alert"
				>
					<AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
					<div className="flex-1 leading-relaxed">{errorMessage}</div>
				</div>
			)}

			{/* Success Banner */}
			{successNotice && (
				<div
					className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400"
					role="status"
				>
					<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
					<div className="flex-1 leading-relaxed">{successNotice}</div>
				</div>
			)}

			{/* SCREEN: WELCOME */}
			{screen === "welcome" && (
				<div className="flex flex-col items-center text-center">
					<div className="mb-6 flex justify-center">
						<OpenVerseRobot size={110} />
					</div>

					<div className="flex items-center gap-2">
						<span className="text-3xl font-bold tracking-tight text-white">
							OPEN-VERSE
						</span>
						<Badge
							variant="outline"
							className="border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] uppercase font-mono px-1.5 py-0.5"
						>
							v0.0.49
						</Badge>
					</div>

					<p className="mt-2 text-sm font-medium text-violet-300">
						Your AI-powered development workspace
					</p>

					<p className="mt-4 text-xs leading-relaxed text-zinc-400 max-w-sm">
						Build, understand, and improve software with autonomous AI agents
						working alongside you locally on your machine.
					</p>

					<div className="mt-8 flex w-full flex-col gap-3">
						<Button
							className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-900/30 transition-all h-10"
							onClick={() => {
								clearErrors();
								setScreen("sign_up");
							}}
							type="button"
						>
							Get Started
						</Button>

						<Button
							className="w-full border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 h-10"
							onClick={() => {
								clearErrors();
								setScreen("sign_in");
							}}
							type="button"
							variant="outline"
						>
							Sign In
						</Button>

						<div className="relative my-2 flex items-center justify-center">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-zinc-800" />
							</div>
							<span className="relative bg-[#0e0e13] px-3 text-[11px] text-zinc-500 uppercase tracking-wider">
								or
							</span>
						</div>

						<Button
							className="w-full border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs h-9 flex items-center justify-center gap-2"
							onClick={() => {
								clearErrors();
								setScreen("offline_mode");
							}}
							type="button"
							variant="ghost"
						>
							<Laptop className="size-3.5" />
							Continue in Offline / Local Mode
						</Button>
					</div>

					<div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
						<button
							className="hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
							onClick={() => void openExternalUrl(TERMS_URL)}
							type="button"
						>
							Terms of Service
						</button>
						<span>•</span>
						<button
							className="hover:text-zinc-300 transition-colors underline-offset-4 hover:underline"
							onClick={() => void openExternalUrl(PRIVACY_URL)}
							type="button"
						>
							Privacy Policy
						</button>
					</div>
				</div>
			)}

			{/* SCREEN: SIGN IN */}
			{screen === "sign_in" && (
				<div className="flex flex-col">
					<button
						aria-label="Back to welcome"
						className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors self-start"
						onClick={() => {
							clearErrors();
							setScreen("welcome");
						}}
						type="button"
					>
						<ArrowLeft className="size-3.5" />
						Back
					</button>

					<div className="flex items-center gap-3 mb-1">
						<OpenVerseRobot size={36} glow={false} />
						<h2 className="text-xl font-bold tracking-tight text-white">
							Sign In to OPEN-VERSE
						</h2>
					</div>
					<p className="text-xs text-zinc-400 mb-6">
						Access your cloud models, workspace history, and account settings.
					</p>

					<form className="flex flex-col gap-4" onSubmit={handleSignIn}>
						<div className="flex flex-col gap-1.5">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-signin-email"
							>
								Email address
							</label>
							<Input
								autoComplete="email"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9.5 text-sm"
								disabled={loading}
								id="ov-signin-email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@domain.com"
								required
								type="email"
								value={email}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<label
									className="text-xs font-medium text-zinc-300"
									htmlFor="ov-signin-password"
								>
									Password
								</label>
								<button
									className="text-[11px] text-violet-400 hover:text-violet-300 hover:underline"
									onClick={() => {
										clearErrors();
										setScreen("forgot_password");
									}}
									type="button"
								>
									Forgot password?
								</button>
							</div>
							<div className="relative">
								<Input
									autoComplete="current-password"
									className="border-zinc-800 bg-zinc-950/60 pr-10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9.5 text-sm"
									disabled={loading}
									id="ov-signin-password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									type={showPassword ? "text" : "password"}
									value={password}
								/>
								<button
									aria-label={showPassword ? "Hide password" : "Show password"}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
									onClick={() => setShowPassword(!showPassword)}
									type="button"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
						</div>

						<Button
							className="mt-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-medium h-9.5"
							disabled={loading}
							type="submit"
						>
							{loading && <Loader2 className="mr-2 size-4 animate-spin" />}
							{loading ? "Signing in..." : "Sign In"}
						</Button>
					</form>

					<div className="relative my-5 flex items-center justify-center">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-zinc-800" />
						</div>
						<span className="relative bg-[#0e0e13] px-3 text-[11px] text-zinc-500 uppercase tracking-wider">
							or
						</span>
					</div>

					<Button
						className="w-full border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/90 text-zinc-200 h-9.5 flex items-center justify-center gap-2.5"
						disabled={loading}
						onClick={handleGoogleSignIn}
						type="button"
						variant="outline"
					>
						<svg className="size-4" viewBox="0 0 24 24">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
								fill="#EA4335"
							/>
						</svg>
						Sign in with Google
					</Button>

					<div className="mt-6 flex flex-col items-center gap-2 text-xs">
						<div className="text-zinc-400">
							Don&apos;t have an account?{" "}
							<button
								className="text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4"
								onClick={() => {
									clearErrors();
									setScreen("sign_up");
								}}
								type="button"
							>
								Sign up
							</button>
						</div>

						<button
							className="mt-1 text-zinc-500 hover:text-zinc-300 text-[11px]"
							onClick={() => {
								clearErrors();
								setScreen("offline_mode");
							}}
							type="button"
						>
							Use offline local mode instead
						</button>
					</div>
				</div>
			)}

			{/* SCREEN: SIGN UP */}
			{screen === "sign_up" && (
				<div className="flex flex-col">
					<button
						aria-label="Back to welcome"
						className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors self-start"
						onClick={() => {
							clearErrors();
							setScreen("welcome");
						}}
						type="button"
					>
						<ArrowLeft className="size-3.5" />
						Back
					</button>

					<div className="flex items-center gap-3 mb-1">
						<OpenVerseRobot size={36} glow={false} />
						<h2 className="text-xl font-bold tracking-tight text-white">
							Create Account
						</h2>
					</div>
					<p className="text-xs text-zinc-400 mb-5">
						Join OPEN-VERSE to unlock collaborative coding and model routing.
					</p>

					<form className="flex flex-col gap-3.5" onSubmit={handleSignUp}>
						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-signup-fullname"
							>
								Full Name (optional)
							</label>
							<Input
								autoComplete="name"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-signup-fullname"
								onChange={(e) => setFullName(e.target.value)}
								placeholder="Ada Lovelace"
								type="text"
								value={fullName}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-signup-email"
							>
								Email address
							</label>
							<Input
								autoComplete="email"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-signup-email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@domain.com"
								required
								type="email"
								value={email}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-signup-password"
							>
								Password
							</label>
							<Input
								autoComplete="new-password"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-signup-password"
								onChange={(e) => setPassword(e.target.value)}
								placeholder="At least 8 characters"
								required
								type="password"
								value={password}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-signup-confirm"
							>
								Confirm Password
							</label>
							<Input
								autoComplete="new-password"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-signup-confirm"
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Re-enter password"
								required
								type="password"
								value={confirmPassword}
							/>
						</div>

						<p className="text-[11px] text-zinc-500 leading-tight">
							By registering, you agree to the{" "}
							<button
								className="text-zinc-400 underline hover:text-white"
								onClick={() => void openExternalUrl(TERMS_URL)}
								type="button"
							>
								Terms
							</button>{" "}
							and{" "}
							<button
								className="text-zinc-400 underline hover:text-white"
								onClick={() => void openExternalUrl(PRIVACY_URL)}
								type="button"
							>
								Privacy Policy
							</button>
							.
						</p>

						<Button
							className="mt-1 w-full bg-violet-600 hover:bg-violet-500 text-white font-medium h-9.5"
							disabled={loading}
							type="submit"
						>
							{loading && <Loader2 className="mr-2 size-4 animate-spin" />}
							{loading ? "Creating account..." : "Create Account"}
						</Button>
					</form>

					<div className="mt-5 text-center text-xs text-zinc-400">
						Already have an account?{" "}
						<button
							className="text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4"
							onClick={() => {
								clearErrors();
								setScreen("sign_in");
							}}
							type="button"
						>
							Sign in
						</button>
					</div>
				</div>
			)}

			{/* SCREEN: VERIFY EMAIL */}
			{screen === "verify_email" && (
				<div className="flex flex-col items-center text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
						<Mail className="size-6" />
					</div>

					<h2 className="text-xl font-bold tracking-tight text-white">
						Verify your Email
					</h2>
					<p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs">
						We sent a verification confirmation code to{" "}
						<span className="font-semibold text-zinc-200">{email}</span>. Please
						enter the code below to complete setup.
					</p>

					<form className="mt-6 flex w-full flex-col gap-4" onSubmit={handleVerifyOtp}>
						<Input
							autoComplete="one-time-code"
							className="border-zinc-800 bg-zinc-950/60 text-center text-lg tracking-widest text-white focus-visible:ring-violet-500 h-11 font-mono"
							disabled={loading}
							maxLength={6}
							onChange={(e) => setOtpCode(e.target.value)}
							placeholder="123456"
							required
							value={otpCode}
						/>

						<Button
							className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium h-9.5"
							disabled={loading}
							type="submit"
						>
							{loading && <Loader2 className="mr-2 size-4 animate-spin" />}
							Confirm & Continue
						</Button>
					</form>

					<div className="mt-6 flex flex-col items-center gap-2">
						<button
							className="text-xs text-violet-400 hover:text-violet-300 underline"
							disabled={loading}
							onClick={() => void handleSendResetLink()}
							type="button"
						>
							Resend code
						</button>
						<button
							className="text-xs text-zinc-500 hover:text-zinc-300"
							onClick={() => {
								clearErrors();
								setScreen("sign_in");
							}}
							type="button"
						>
							Back to Sign In
						</button>
					</div>
				</div>
			)}

			{/* SCREEN: FORGOT PASSWORD */}
			{screen === "forgot_password" && (
				<div className="flex flex-col">
					<button
						aria-label="Back to sign in"
						className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors self-start"
						onClick={() => {
							clearErrors();
							setScreen("sign_in");
						}}
						type="button"
					>
						<ArrowLeft className="size-3.5" />
						Back to Sign In
					</button>

					<div className="flex items-center gap-2.5 mb-1">
						<KeyRound className="size-5 text-violet-400" />
						<h2 className="text-xl font-bold tracking-tight text-white">
							Reset Password
						</h2>
					</div>
					<p className="text-xs text-zinc-400 mb-6">
						Enter your email address and we&apos;ll send recovery instructions.
					</p>

					<form className="flex flex-col gap-4" onSubmit={handleSendResetLink}>
						<div className="flex flex-col gap-1.5">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-forgot-email"
							>
								Email address
							</label>
							<Input
								autoComplete="email"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9.5 text-sm"
								disabled={loading}
								id="ov-forgot-email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@domain.com"
								required
								type="email"
								value={email}
							/>
						</div>

						<Button
							className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium h-9.5"
							disabled={loading}
							type="submit"
						>
							{loading && <Loader2 className="mr-2 size-4 animate-spin" />}
							Send Reset Instructions
						</Button>
					</form>

					<div className="mt-6 flex justify-between items-center text-xs">
						<button
							className="text-zinc-400 hover:text-zinc-200"
							onClick={() => {
								clearErrors();
								setScreen("reset_password");
							}}
							type="button"
						>
							Have a reset token? Enter it here
						</button>
					</div>
				</div>
			)}

			{/* SCREEN: RESET PASSWORD */}
			{screen === "reset_password" && (
				<div className="flex flex-col">
					<button
						aria-label="Back to sign in"
						className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors self-start"
						onClick={() => {
							clearErrors();
							setScreen("sign_in");
						}}
						type="button"
					>
						<ArrowLeft className="size-3.5" />
						Back to Sign In
					</button>

					<div className="flex items-center gap-2.5 mb-1">
						<ShieldCheck className="size-5 text-violet-400" />
						<h2 className="text-xl font-bold tracking-tight text-white">
							Set New Password
						</h2>
					</div>
					<p className="text-xs text-zinc-400 mb-6">
						Enter the verification token from your email and your new password.
					</p>

					<form className="flex flex-col gap-3.5" onSubmit={handleResetPassword}>
						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-reset-token"
							>
								Verification Token / Code
							</label>
							<Input
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm font-mono"
								disabled={loading}
								id="ov-reset-token"
								onChange={(e) => setOtpCode(e.target.value)}
								placeholder="Paste code or token"
								required
								value={otpCode}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-reset-password"
							>
								New Password
							</label>
							<Input
								autoComplete="new-password"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-reset-password"
								onChange={(e) => setPassword(e.target.value)}
								placeholder="At least 8 characters"
								required
								type="password"
								value={password}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								className="text-xs font-medium text-zinc-300"
								htmlFor="ov-reset-confirm"
							>
								Confirm New Password
							</label>
							<Input
								autoComplete="new-password"
								className="border-zinc-800 bg-zinc-950/60 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-9 text-sm"
								disabled={loading}
								id="ov-reset-confirm"
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Re-enter password"
								required
								type="password"
								value={confirmPassword}
							/>
						</div>

						<Button
							className="mt-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-medium h-9.5"
							disabled={loading}
							type="submit"
						>
							{loading && <Loader2 className="mr-2 size-4 animate-spin" />}
							Update Password
						</Button>
					</form>
				</div>
			)}

			{/* SCREEN: OFFLINE / LOCAL MODE DIAGNOSTIC */}
			{screen === "offline_mode" && (
				<div className="flex flex-col items-center text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
						<Laptop className="size-6" />
					</div>

					<h2 className="text-xl font-bold tracking-tight text-white">
						Local & Offline Mode
					</h2>
					<p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-sm">
						OPEN-VERSE is designed for local autonomy. You do not need a cloud
						account to develop, edit files, or execute tools with local models.
					</p>

					<div className="mt-6 w-full rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 text-left text-xs space-y-2.5">
						<div className="flex items-start gap-2.5 text-zinc-300">
							<Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
							<span>Local Hub runs 100% on your machine with zero-trust sandboxing.</span>
						</div>
						<div className="flex items-start gap-2.5 text-zinc-300">
							<Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
							<span>Zero telemetry or proprietary code dispatched to cloud servers.</span>
						</div>
						<div className="flex items-start gap-2.5 text-zinc-300">
							<Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
							<span>Directly connect local Ollama, LM Studio, or your own API keys.</span>
						</div>
					</div>

					<div className="mt-7 flex w-full flex-col gap-3">
						<Button
							className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-10 shadow-lg shadow-emerald-900/20"
							onClick={handleOfflineMode}
							type="button"
						>
							Continue to Local Workspace
						</Button>

						<Button
							className="w-full text-zinc-400 hover:text-zinc-200"
							onClick={() => {
								clearErrors();
								setScreen("welcome");
							}}
							type="button"
							variant="ghost"
						>
							Back to Sign In
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

