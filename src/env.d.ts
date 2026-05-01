interface ImportMetaEnv {
  readonly DATALIST_STATES?: string;
  readonly DATALIST_CITIES?: string;
  readonly DATALIST_TIMEZONES?: string;
  readonly MS_GROUP_ID?: string;
  readonly MS_SITES_READWRITE_ALL_APP_ID?: string;
  readonly MS_SITES_READWRITE_ALL_SECRET_ID?: string;
  readonly MS_SITES_READWRITE_ALL_SECRET_VALUE?: string;
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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
