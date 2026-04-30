import { ConfidentialClientApplication } from "@azure/msal-node";

export async function getMsToken(
  tenant_id?: string,
  client_id?: string,
  secret_value?: string,
) {
  if (!tenant_id || !client_id || !secret_value)
    throw new Error("missing id or value secret");
  
  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: client_id,
      authority: `https://login.microsoftonline.com/${tenant_id}`,
      clientSecret: secret_value,
    },
  });
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) throw new Error("!!! no result.accessToken");
  return result.accessToken;
}
