"use strict";
const N = "OidcTrustedDomains.js",
  A = "*",
  _ = {
    REFRESH_TOKEN: "REFRESH_TOKEN_SECURED_BY_OIDC_SERVICE_WORKER",
    ACCESS_TOKEN: "ACCESS_TOKEN_SECURED_BY_OIDC_SERVICE_WORKER",
    NONCE_TOKEN: "NONCE_SECURED_BY_OIDC_SERVICE_WORKER",
    CODE_VERIFIER: "CODE_VERIFIER_SECURED_BY_OIDC_SERVICE_WORKER",
  },
  w = {
    access_token_or_id_token_invalid: "access_token_or_id_token_invalid",
    access_token_invalid: "access_token_invalid",
    id_token_invalid: "id_token_invalid",
  },
  x = "/.well-known/openid-configuration";
function K(n, e) {
  if (!e) return;
  if (
    !n.find((o) => {
      var i;
      let t;
      return (
        typeof o == "string" ? (t = new RegExp(`^${o}`)) : (t = o),
        (i = t.test) == null ? void 0 : i.call(t, e)
      );
    })
  )
    throw new Error(
      "Domain " + e + " is not trusted, please add domain in " + N
    );
}
const D = (n, e) =>
    Array.isArray(n) ? n : n[`${e}Domains`] ?? n.domains ?? [],
  M = (n, e, s) => {
    var o;
    if (e.endsWith(x)) return null;
    for (const [t, i] of Object.entries(n)) {
      const d = i.oidcServerConfiguration;
      if (
        !d ||
        (d.tokenEndpoint && e === d.tokenEndpoint) ||
        (d.revocationEndpoint && e === d.revocationEndpoint)
      )
        continue;
      const l = s == null ? [] : s[t],
        f = D(l, "accessToken"),
        a = d.userInfoEndpoint ? [d.userInfoEndpoint, ...f] : [...f];
      let c = !1;
      if (a.find((h) => h === A)) c = !0;
      else
        for (let h = 0; h < a.length; h++) {
          let r = a[h];
          if (
            (typeof r == "string" && (r = new RegExp(`^${r}`)),
            (o = r.test) != null && o.call(r, e))
          ) {
            c = !0;
            break;
          }
        }
      if (c) return i.tokens ? i : null;
    }
    return null;
  };
function U(n, e) {
  return n.split(e).length - 1;
}
function P(n) {
  return JSON.parse(W(n.split(".")[1].replace("-", "+").replace("_", "/")));
}
function W(n) {
  return decodeURIComponent(
    Array.prototype.map
      .call(
        atob(n),
        (e) => "%" + ("00" + e.charCodeAt(0).toString(16)).slice(-2)
      )
      .join("")
  );
}
function F(n, e) {
  const s = new Date().getTime() / 1e3;
  return Math.round(e - n - s);
}
function b(n) {
  return n ? F(0, n.expiresAt) > 0 : !1;
}
const O = (n) => {
    try {
      return n && U(n, ".") === 2 ? P(n) : null;
    } catch (e) {
      console.warn(e);
    }
    return null;
  },
  q = (n, e, s) => {
    if (n.idTokenPayload) {
      const o = n.idTokenPayload;
      if (s.issuer !== o.iss)
        return { isValid: !1, reason: "Issuer does not match" };
      const t = new Date().getTime() / 1e3;
      if (o.exp && o.exp < t) return { isValid: !1, reason: "Token expired" };
      const i = 60 * 60 * 24 * 7;
      if (o.iat && o.iat + i < t)
        return { isValid: !1, reason: "Token is used from too long time" };
      if (o.nonce && o.nonce !== e)
        return { isValid: !1, reason: "Nonce does not match" };
    }
    return { isValid: !0, reason: "" };
  };
function L(n, e, s) {
  if (!n.issued_at) {
    const u = new Date().getTime() / 1e3;
    n.issued_at = u;
  }
  const o = O(n.access_token),
    t = { ...n, accessTokenPayload: o };
  e.hideAccessToken && (t.access_token = _.ACCESS_TOKEN + "_" + s),
    (n.accessTokenPayload = o);
  let i = null;
  if (n.id_token) {
    if (
      ((i = O(n.id_token)),
      (n.idTokenPayload = { ...i }),
      i.nonce && e.nonce != null)
    ) {
      const u = _.NONCE_TOKEN + "_" + e.configurationName;
      i.nonce = u;
    }
    t.idTokenPayload = i;
  }
  n.refresh_token && (t.refresh_token = _.REFRESH_TOKEN + "_" + s);
  const d = i && i.exp ? i.exp : Number.MAX_VALUE,
    l = o && o.exp ? o.exp : n.issued_at + n.expires_in;
  let f;
  const a = e.oidcConfiguration.token_renew_mode;
  a === w.access_token_invalid
    ? (f = l)
    : a === w.id_token_invalid
    ? (f = d)
    : (f = d < l ? d : l),
    (t.expiresAt = f),
    (n.expiresAt = f);
  const c = e.nonce ? e.nonce.nonce : null,
    { isValid: h, reason: r } = q(n, c, e.oidcServerConfiguration);
  if (!h) throw Error(`Tokens are not OpenID valid, reason: ${r}`);
  if (
    e.tokens != null &&
    "refresh_token" in e.tokens &&
    !("refresh_token" in n)
  ) {
    const u = e.tokens.refresh_token;
    e.tokens = { ...n, refresh_token: u };
  } else e.tokens = n;
  return (e.status = "LOGGED_IN"), t;
}
function y(n) {
  const e = n.configurationName;
  return (s) =>
    s.status !== 200
      ? s
      : s.json().then((o) => {
          const t = L(o, n, e),
            i = JSON.stringify(t);
          return new Response(i, s);
        });
}
function m(n) {
  const e = {};
  for (const s of n.keys()) n.has(s) && (e[s] = n.get(s));
  return e;
}
const V = (n) => new Promise((e) => setTimeout(e, n)),
  E = self;
E.importScripts(N);
const I = Math.round(new Date().getTime() / 1e3).toString(),
  H = "OidcKeepAliveServiceWorker.json",
  j = (n) => {
    console.log("[OidcServiceWorker] service worker installed " + I),
      n.waitUntil(E.skipWaiting());
  },
  J = (n) => {
    console.log("[OidcServiceWorker] service worker activated " + I),
      n.waitUntil(E.clients.claim());
  };
let T = null;
const g = {
    default: {
      configurationName: "default",
      tokens: null,
      status: null,
      state: null,
      codeVerifier: null,
      nonce: null,
      oidcServerConfiguration: null,
      hideAccessToken: !0,
    },
  },
  Y = (n, e) => {
    const s = [];
    for (const [, o] of Object.entries(n))
      ((o.oidcServerConfiguration != null &&
        e.startsWith(o.oidcServerConfiguration.tokenEndpoint)) ||
        (o.oidcServerConfiguration != null &&
          o.oidcServerConfiguration.revocationEndpoint &&
          e.startsWith(o.oidcServerConfiguration.revocationEndpoint))) &&
        s.push(o);
    return s;
  },
  $ = async (n) => {
    const e = n.request,
      s = e.headers.has("oidc-vanilla"),
      o = { status: 200, statusText: "oidc-service-worker" },
      t = new Response("{}", o);
    if (!s) {
      const i = new URL(e.url),
        d = Number(i.searchParams.get("minSleepSeconds")) || 240;
      for (let l = 0; l < d; l++)
        await V(1e3 + Math.floor(Math.random() * 1e3)),
          await (
            await caches.open("oidc_dummy_cache")
          ).put(n.request, t.clone());
    }
    return t;
  },
  z = async (n) => {
    const e = n.request,
      s = e.url;
    if (e.url.includes(H)) {
      n.respondWith($(n));
      return;
    }
    const o = M(g, e.url, trustedDomains);
    if (o && o.tokens && o.tokens.access_token) {
      for (; o.tokens && !b(o.tokens); ) await V(200);
      const l =
        e.mode == "navigate"
          ? new Request(e, {
              headers: {
                ...m(e.headers),
                authorization: "Bearer " + o.tokens.access_token,
              },
            })
          : new Request(e, {
              headers: {
                ...m(e.headers),
                authorization: "Bearer " + o.tokens.access_token,
              },
              mode: o.oidcConfiguration
                .service_worker_convert_all_requests_to_cors
                ? "cors"
                : e.mode,
            });
      n.waitUntil(n.respondWith(fetch(l)));
      return;
    }
    if (n.request.method !== "POST") return;
    let t = null;
    const i = Y(g, e.url),
      d = i.length;
    if (d > 0) {
      const l = new Promise((f, a) => {
        const c = e.clone();
        c.text()
          .then((r) => {
            if (r.includes(_.REFRESH_TOKEN) || r.includes(_.ACCESS_TOKEN)) {
              let u = r;
              for (let p = 0; p < d; p++) {
                const k = i[p];
                if (k && k.tokens != null) {
                  const R = _.REFRESH_TOKEN + "_" + k.configurationName;
                  if (r.includes(R)) {
                    (u = u.replace(
                      R,
                      encodeURIComponent(k.tokens.refresh_token)
                    )),
                      (t = k);
                    break;
                  }
                  const v = _.ACCESS_TOKEN + "_" + k.configurationName;
                  if (r.includes(v)) {
                    (u = u.replace(
                      v,
                      encodeURIComponent(k.tokens.access_token)
                    )),
                      (t = k);
                    break;
                  }
                }
              }
              const S = fetch(e, {
                body: u,
                method: c.method,
                headers: { ...m(e.headers) },
                mode: c.mode,
                cache: c.cache,
                redirect: c.redirect,
                referrer: c.referrer,
                credentials: c.credentials,
                integrity: c.integrity,
              });
              return t &&
                t.oidcServerConfiguration != null &&
                t.oidcServerConfiguration.revocationEndpoint &&
                s.startsWith(t.oidcServerConfiguration.revocationEndpoint)
                ? S.then(async (p) => {
                    const k = await p.text();
                    return new Response(k, p);
                  })
                : S.then(y(t));
            } else if (r.includes("code_verifier=") && T) {
              (t = g[T]), (T = null);
              let u = r;
              if (t && t.codeVerifier != null) {
                const S = _.CODE_VERIFIER + "_" + t.configurationName;
                r.includes(S) && (u = u.replace(S, t.codeVerifier));
              }
              return fetch(e, {
                body: u,
                method: c.method,
                headers: { ...m(e.headers) },
                mode: c.mode,
                cache: c.cache,
                redirect: c.redirect,
                referrer: c.referrer,
                credentials: c.credentials,
                integrity: c.integrity,
              }).then(y(t));
            }
          })
          .then((r) => {
            r !== void 0
              ? f(r)
              : (console.log("success undefined"),
                a(new Error("Response is undefined inside a success")));
          })
          .catch((r) => {
            r !== void 0
              ? a(r)
              : (console.log("error undefined"),
                a(new Error("Response is undefined inside a error")));
          });
      });
      n.waitUntil(n.respondWith(l));
    }
  },
  C = {},
  G = (n) => {
    const e = n.ports[0],
      s = n.data,
      o = s.configurationName;
    let t = g[o];
    if ((trustedDomains == null && (trustedDomains = {}), !t)) {
      if (C[o] === void 0) {
        let i = trustedDomains[o];
        C[o] = Array.isArray(i) ? !1 : i.showAccessToken;
      }
      (g[o] = {
        tokens: null,
        state: null,
        codeVerifier: null,
        oidcServerConfiguration: null,
        oidcConfiguration: void 0,
        nonce: null,
        status: null,
        configurationName: o,
        hideAccessToken: !C[o],
      }),
        (t = g[o]),
        trustedDomains[o] || (trustedDomains[o] = []);
    }
    switch (s.type) {
      case "clear":
        (t.tokens = null),
          (t.state = null),
          (t.codeVerifier = null),
          (t.status = s.data.status),
          e.postMessage({ configurationName: o });
        return;
      case "init": {
        const i = s.data.oidcServerConfiguration;
        let d = trustedDomains[o];
        const l = D(d, "oidc");
        l.find((a) => a === A) ||
          [
            i.tokenEndpoint,
            i.revocationEndpoint,
            i.userInfoEndpoint,
            i.issuer,
          ].forEach((a) => {
            K(l, a);
          }),
          (t.oidcServerConfiguration = i),
          (t.oidcConfiguration = s.data.oidcConfiguration);
        const f = s.data.where;
        if (
          (f === "loginCallbackAsync" || f === "tryKeepExistingSessionAsync"
            ? (T = o)
            : (T = null),
          !t.tokens)
        )
          e.postMessage({
            tokens: null,
            status: t.status,
            configurationName: o,
          });
        else {
          const a = { ...t.tokens };
          t.hideAccessToken && (a.access_token = _.ACCESS_TOKEN + "_" + o),
            a.refresh_token && (a.refresh_token = _.REFRESH_TOKEN + "_" + o),
            a.idTokenPayload &&
              a.idTokenPayload.nonce &&
              t.nonce != null &&
              (a.idTokenPayload.nonce = _.NONCE_TOKEN + "_" + o),
            e.postMessage({
              tokens: a,
              status: t.status,
              configurationName: o,
            });
        }
        return;
      }
      case "setState":
        (t.state = s.data.state), e.postMessage({ configurationName: o });
        return;
      case "getState": {
        const i = t.state;
        e.postMessage({ configurationName: o, state: i });
        return;
      }
      case "setCodeVerifier":
        (t.codeVerifier = s.data.codeVerifier),
          e.postMessage({ configurationName: o });
        return;
      case "getCodeVerifier": {
        e.postMessage({
          configurationName: o,
          codeVerifier: _.CODE_VERIFIER + "_" + o,
        });
        return;
      }
      case "setSessionState":
        (t.sessionState = s.data.sessionState),
          e.postMessage({ configurationName: o });
        return;
      case "getSessionState": {
        const i = t.sessionState;
        e.postMessage({ configurationName: o, sessionState: i });
        return;
      }
      case "setNonce":
        (t.nonce = s.data.nonce), e.postMessage({ configurationName: o });
        return;
      default:
        (t.items = { ...s.data }), e.postMessage({ configurationName: o });
    }
  };
E.addEventListener("install", j);
E.addEventListener("activate", J);
E.addEventListener("fetch", z);
E.addEventListener("message", G);
//# sourceMappingURL=OidcServiceWorker.js.map
