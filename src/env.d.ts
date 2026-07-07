interface ImportMetaEnv {
  readonly DATALIST_STATES?: string;
  readonly DATALIST_CITIES?: string;
  readonly DATALIST_TIMEZONES?: string;
  readonly WP_USERNAME?: string;
  readonly WP_APP_PASSWORD?: string;
  readonly WORDPRESS_ENDPOINT?: string;
  readonly DEFAULT_ROLE_ID?: string;
  readonly MS_SHAREPOINT_KYU_FOLDER_URL?: string;
  readonly PGUSER?: string;
  readonly PGPASSWORD?: string;
  readonly PGDATABASE?: string;
  readonly PGPORT?: string;
  readonly PGHOST?: string;
  readonly NODE_ENV?: "production" | "development";
  readonly DATABASE_ID_SECRET?: string;
  readonly SITE_TITLE?: string;
  readonly SITE_EXCERPT?: string;
  readonly UMAMI_HOST?: string;
  readonly UMAMI_SCRIPT?: string;
  readonly UMAMI_WEB_ID?: string;
  readonly DOMAIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
