import React from "react";
import { Layout } from "../layout";
import { useOidc, useOidcIdToken } from "@axa-fr/react-oidc";

export const Home = () => {
  const { isAuthenticated, login, logout } = useOidc();
  const { idToken, idTokenPayload } = useOidcIdToken();
  return (
    <Layout>
      <h1>Home</h1>
      {!isAuthenticated && (
        <button onClick={() => login("/admin")}>Login</button>
      )}
      {isAuthenticated && <button onClick={() => logout()}>Logout</button>}
      {idToken &&
        <p class="token-details">
          <div className="card text-white bg-info mb-3">
            <div className="card-body">
              <h5 className="card-title">ID Token</h5>
              {<p className="card-text">{JSON.stringify(idToken)}</p>}
              {idTokenPayload != null && (
                <p className="card-text">{JSON.stringify(idTokenPayload)}</p>
              )}
            </div>
          </div>
        </p>
      }
    </Layout>
  );
};
