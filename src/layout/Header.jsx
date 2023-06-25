import { useOidcUser } from "@axa-fr/react-oidc";
import React from "react";

export const Header = () => {
  const { oidcUser, oidcUserLoadingState } = useOidcUser();
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/admin">Admin</a>
      {oidcUser && <p id="user-email">{oidcUser.email}</p>}
    </nav>
  );
};
