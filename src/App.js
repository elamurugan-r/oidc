import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { RouteList } from "./Routes";
import { OidcProvider, OidcSecure, } from "@axa-fr/react-oidc";

const configuration = {
  client_id: "interactive.public.short",
  redirect_uri: window.location.origin + "/authentication/callback",
  silent_redirect_uri:
    window.location.origin + "/authentication/silent-callback",
  scope: "openid profile email api offline_access", // offline_access scope allow your client to retrieve the refresh_token
  authority: "https://demo.duendesoftware.com",
  service_worker_relative_url: "/OidcServiceWorker.js",
  service_worker_only: false,
};

function App() {
  return (
    <OidcProvider configuration={configuration}>
      <div className="App">
        <BrowserRouter>
          <RouteList />
        </BrowserRouter>
      </div>
    </OidcProvider>
  );
}

export default App;
