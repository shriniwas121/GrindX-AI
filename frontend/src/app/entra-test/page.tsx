"use client";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import EntraSignInButton from "../entra-signin-button";

export default function EntraTestPage() {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, instance } = useMsal();

  const account = accounts[0];

  const signOut = async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: "http://localhost:3000/entra-test",
    });
  };

  return (
    <main style={{ padding: "40px" }}>
      <h1>Microsoft Entra ID Test</h1>

      {!isAuthenticated ? (
        <>
          <p>Not signed in.</p>
          <EntraSignInButton />
        </>
      ) : (
        <>
          <p><strong>OIDC sign-in successful</strong></p>
          <p>Name: {account?.name ?? "Not provided"}</p>
          <p>Username: {account?.username ?? "Not provided"}</p>
          <p>Tenant ID: {account?.tenantId ?? "Not provided"}</p>

          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </>
      )}
    </main>
  );
}