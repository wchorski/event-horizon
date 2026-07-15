export type LoginCredentials = {
  email: string;
  password: string;
//   username: string;
};

export type LoginResult =
  | { success: true; setCookies: string[] }
  | { success: false; error: string };