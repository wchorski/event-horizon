I want to learn how to allow access, check author ownership, booking participation, org membership, admin bypass, banned users, and the location_id ownership check while filtering out unathorized data. 

I also want to retain the flexability that comes with better-auth's organization `auth.api.hasPermission` checks while minimizing `where` filters in any db call in a route template. better-auth hasPermission stays in the app for action-level rules inside an org: publish, check-in, and who can edit org locations.

## Recommended split
- *RLS* owns the floor: who may ever see or write a row. That means ownership, booking participation, org membership, admin bypass, banned users, and the location_id ownership check.
- *better-auth* hasPermission stays in the app for action-level rules inside an org: publish, check-in, and who can edit org locations. Call it once per request, and if a result needs to reach the database, pass it in as another setting (for example app.can_manage_locations).
- *Skip the data-layer*. withUser plus policies replaces it, and you keep ESLint’s no-restricted-imports on the privileged db so routes can only reach appDb through withUser.

> [!note] upgrading to drizzle v1

## Instructions
RLS only applies to roles that aren’t superusers or table owners. This is the role your requests will run as.
