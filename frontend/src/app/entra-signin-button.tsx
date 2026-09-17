"use client";

import { useMsal } from "@azure/msal-react";

export default function EntraSignInButton() {
  const { instance } = useMsal();

  const signIn = async () => {
    await instance.loginRedirect({
      scopes: ["openid", "profile", "email"],
    });
  };

  return (
    <button type="button" onClick={signIn}>
      Sign in with Microsoft
    </button>
  );
}