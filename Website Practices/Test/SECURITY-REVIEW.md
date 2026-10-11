# Security Review

## Scope

This review covered the browser-side authentication-token handling and the
admin adjustment/provider request code. It did not audit the API server,
deployment configuration, or the rest of the site.

## Findings

### HIGH — Browser-readable authentication token

The site stores the Discord authentication token as
`localStorage.directrouter_token` ([app.js](./app.js#L62)). The admin adjustment
code reads it and sends it as a bearer token to privileged admin endpoints
([admin-adjustments.js](./admin-adjustments.js#L24)); provider requests use the
same token pattern ([providers.js](./providers.js#L39)).

Any JavaScript executing in this site's origin can read the token. This could
include code injected through a cross-site scripting flaw or a compromised
same-origin script/dependency. An attacker who obtains a still-valid token
could make requests as the signed-in user, bypassing the site's UI. If the
token grants admin privileges, that may include changing user adjustments or
membership through the admin endpoints. The exact reachable data and actions
depend on the token's server-side permissions and API authorization checks;
this review did not inspect those checks. This does not mean an arbitrary
remote visitor can automatically read the token without an injection,
compromised script, or other access to code running in the origin.

**Recommendation:** Prefer a server-managed session using a `Secure`,
`HttpOnly`, appropriately `SameSite` cookie and enforce authorization on every
API request. If browser-readable tokens remain necessary, reduce their scope
and lifetime, and mitigate script injection with appropriate output handling,
dependency controls, and a Content Security Policy.
