"use client";

import { ReactNode } from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID;
const tenantId = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID;
const redirectUri = process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI;

if (!clientId || !tenantId || !redirectUri) {
  throw new Error("Missing Microsoft Entra environment variables");
}

const msalInstance = new PublicClientApplication({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
});

export default function EntraMsalProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}