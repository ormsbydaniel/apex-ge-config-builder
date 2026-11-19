---
title: Signing in
---

# Signing in

Sign-in is optional. You can build, load and export a configuration without an
APEx account. Signing in lets the preview use protected APEx services, such as
algorithms and job history, with the same account the Geospatial Explorer uses.

## Sign in

**Login** is at the top right of the Configuration Builder, and on the Apps
page. Inside the preview, use the Geospatial Explorer's own **Login** button.

Choosing it sends you to the APEx sign-in page. You return through
`/callback`, and the builder then opens the screen you left. Your
configuration is kept in the browser while you are away.
When you return, the preview uses that session. You do not sign in a second
time inside the map.

The header shows your name when you are signed in. Open it for **Account**
and **Sign out**.

On the public ESA sites, a session you already have in another APEx tab is
picked up on its own. On a local address you need to choose **Login**.

## Older preview versions

The preview can load older Geospatial Explorer versions. Those versions cannot
take a session from the builder, so the map does not show a login button.
Choose version **4.4.0** or newer, or the **dev-auth** bundle, to sign in
inside the preview. Earlier published versions do not accept a session from
the builder.

## For APEx administrators

The builder uses the existing `apex-explorer` client in the `apex` realm. It
does not have its own client. Sign-in and sign-out return to exactly
`{origin}/callback`. The silent session check uses exactly
`{origin}/silent-check-sso.html`. Both paths are already registered for
`http://localhost:8000`, `http://localhost:5173`, and each project hostname.
No wildcard is used.

A builder served on its own hostname needs those two exact paths, and that
origin in web origins, registered the same way. Confirm the client is public
and uses PKCE (S256). No change to Keycloak framing is required, because the
sign-in page is never shown inside the preview frame.

### Hosting the builder securely

The preview runs the Geospatial Explorer with the builder's origin, and
receives the signed-in user's access token. Serve the builder with these
response headers so other sites cannot frame it:

```text
Content-Security-Policy: frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
```

A stricter `script-src` limited to the builder's origin and
`https://esa-apex.s3.eu-west-1.amazonaws.com` is also worth adding. It needs
`'unsafe-inline'` or script hashes until the inline scripts in
`viewer/viewer-host.html` and `silent-check-sso.html` move into files.

Explorer bundles load from `esa-apex/software/` in S3. Anyone who can write
there can run code in the builder with a user's session, so limit write access
to the release pipeline.

Realm roles, including a future `publisher` role, are shared by the builder,
the explorer and the publishing API. The API is where a role is enforced.
