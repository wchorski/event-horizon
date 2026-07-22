Event hosting platform (tickets, planning, upcoming/past promotion)

<details>
<summary>⚙️ DEV Environment</summary>

```shell
## spin up development postgres container
cp .env.example .env.development
cp .env.development .env
pnpm db:create
## If any schema changes have been made
pnpm db:generate

pnpm db:push
pnpm db:seed:truncate
```

any changes made to `schema.ts` or `seed-data.ts` need to rerun

```shell
pnpm db:push
pnpm db:seed:truncate
```

Drizzle will warn you of any changes with an interactive cli. For example if a column name is new or a rename

```shell
pnpm db:push

> my-app@0.0.1 db:push
> npx drizzle-kit push

No config path provided, using default 'drizzle.config.ts'
Reading config file '/Volumes/edata/vscode/moeits_staff-astro-htmx/drizzle.config.ts'
Using 'pg' driver for database querying
[✓] Pulling schema from database...

~ date › timestamp column will be renamed
--- all columns conflicts in events table resolved ---


~ date › timestamp column will be renamed
--- all columns conflicts in tickets table resolved ---

[✓] Changes applied
```

### Drizzle Studio

```shell
mkdir -p "$HOME/Library/Application Support/drizzle-studio"
touch "$HOME/Library/Application Support/drizzle-studio/localhost.pem"
touch "$HOME/Library/Application Support/drizzle-studio/localhost-key.pem"

npm run db:studio
```

https://local.drizzle.studio/

---

HOW to generate sql files and migrations with

```shell
npx drizzle-kit generate   # generates SQL migration files
npx drizzle-kit migrate    # runs them against your DB
```

### Better Auth config
https://better-auth.com/docs/installation (with some help from https://www.giorgiosaud.io/notebook/better-auth-drizzle-neon-astro)
```shell
# generate auth-schema.ts
pnpm dlx auth@latest generate
# for this project, I've heavily modified and combined it with db/schema.ts
```

</details>

<details>
<summary>🤖 RAG Chat AI Assistant</summary>
> [!note] This assumes you're already setup with Open-Webui and Ollama LLMs

- https://github.com/open-webui/oikb
- https://docs.openwebui.com/features/knowledge-base-sync/

```shell
pip install oikb
oikb init

```
</details>

<details>
<summary> 🏭 Production</summary>

```shell
cp .env.example .env
cp compose.yml.example compose.yml
docker compose build
docker compose up --remove-orphans
```

</details>



#todo
- [ ] timeline: when moment is deleted, delete all steps from idb
- [ ] timeline: when `+ add item` auto focus the generated input field
- [ ] timeline: sepearte rows (TBD marker bleed together)
- [ ] `+ add moment` double adds moment....
- [ ] convert all env to use https://docs.astro.build/en/guides/environment-variables/
- [ ] add "organization" in schema that allows SaaS multi tenant multi buisness to use this app, but seperate users, locations, bookings, etc to respective user base.
- [ ] if user is not apart of org then only self created/owned Events, Bookings, Timelines, etc are viewable. 
- [ ] print url removal https://stackoverflow.com/questions/2192806/can-i-remove-the-url-from-my-print-css-so-the-web-address-doesnt-print
- [ ] footer linking to open source repo and tawtaw.site
- [ ] REMOVE any microsoft, wordpress, api hooks and functions
- [ ] remove any other testing or example pages from old repo 
- [ ] timeline template importer. think through how data comes in and ui refreshes
- [ ] Move Skills editor to slide in out bar, or maybe popup modal directly on each line
- [ ] umami script in baselayout
- [ ] commit button saves data to server
- [ ] fully utilize timelineStore object so whole UI is reactive
- [ ] timeline, quickstart page w link to templates
- [ ] fetch and show found timelines in local storage for continued editing
- [ ] printable version CSS
- [ ] integrate icon and color to skill editor and reflect in table and print
- [ ] check light mode
- [x] Timeline `commit` button will commit data to local storage, increment revision
- [ ] allow undo and redo (or restore to previous revision)
- [x] create `Timeline` schema that combines Moments, Steps, Groups, Skills into one identifiable.
- [x] ability to import and export a `Timeline` or templates JSON
- [ ] use the db.select() thoughtfully to not just grab ALL data
- [ ] how to create `virtual` fields (like an `event.location_info` pulls the location.name location.address in a short one liner without having to make a join or api)
- [ ] db exporter data to .json file
- [x] table sorting for each column (asc, desc, default)
- [ ] restructure top level errors to include `fieldName` so it can target and style the problem field if it exists
- [ ] show "no changes" and disable `update` button on single-page forms. also set button to disabled upon first press
- [ ] how to seed fresh database automatically (with docker container like `migrate`)
- [ ] TRANSFER what learned from partials/course-tickets/... to partials/users/...
- [ ] use css grid to keep all field-errors in same height (and keep input fields from getting pushed up)
- [x] fix all db `db.ts` fields to use snakecase
- [x] delete button (with are you sure) for editable table
- [ ] For production with auth enabled, generate a token and configure sqld with --auth-jwt-key-file or the SQLD_AUTH_JWT_KEY env var.
- [x] search field for each main admin model page
- [ ] ask how to bypass Cloudflare blocking. WP import is getting 403
- [ ] css style construction theme (road signs, asphalt, road paint, concrete, gerders, tire tracks, scafolding)
- [x] composable and editable table Component!!!!
- [x] admin table for `events` and a "fetch events" button that get Wordpress data
- [x] `/attendance/admin/events/id/[id].astro/admin` make an editable table for admin use
- [x] pull from db all `Event` and display them on page
  - [x] label with subject and date of class (with clickble link)
  - [x] `/events/[id].astro` reveals attendence form.
  - [x] user submits member data (creates their member profile and checks them as attended)
- [x] how do i save db data into an csv and save it to sharepoint?
- [ ] look into using the MS SDK

```js
import { Client } from "@microsoft/microsoft-graph-client";
```

- [x] genrate persistant MS token
      Bottom Line
      Graph Explorer tokens are for testing only. For production or persistent use:
- [ ] move `timestamp` files to real database like sqlite

Register your own app in Azure AD.
Implement OAuth flow with refresh tokens or client credentials.
Use MSAL or similar libraries to handle token lifecycle automatically.

## Wordpress api/events/import endpoint

use with `custom-events-api.php` plugin

endpoint example `${WORDPRESS_ENDPOINT}/wp-json/wchorski/v1/events?after=2024-01-01T00:00:00`

## Docker's Named volumes

because I'm not used to using named volumes (but i must use it to deploy on synology nas)

```shell
docker volume inspect libsql-data


{
  "Name": "libsql-data",
  "Mountpoint": "/var/lib/docker/volumes/libsql-data/_data"
}
```

## Zod Validation

https://www.codegenes.net/blog/zod-validation-based-on-another-field/#prerequisites

## HTMX Learning

- https://singhajit.com/htmx-guide-modern-web-development/
