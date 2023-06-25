import React from "react";
import { Layout } from "../layout";
import { OidcSecure, useOidcIdToken } from "@axa-fr/react-oidc";

export const Admin = () => {
  return (
    <OidcSecure>
      <Layout>
      <main>
        <h1>Admin</h1>
        </main>
      </Layout>
    </OidcSecure>
  );
};
