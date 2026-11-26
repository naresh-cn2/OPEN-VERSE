"use client";

import React from "react";
import { OpenVerseAccountView } from "./open-verse-account-view";

/**
 * OPEN-VERSE Account View
 * Canonical account interface replacing legacy Cline account billing screens.
 */
export function AccountView({
	onNavigateToProviders,
}: {
	onNavigateToProviders?: () => void;
}) {
	return <OpenVerseAccountView onNavigateToProviders={onNavigateToProviders} />;
}

export default AccountView;
