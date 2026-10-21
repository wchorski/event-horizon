export type LoginSignupResult =
  | { success: true; setCookies: string[] }
  | { success: false; error: string; code: string | undefined };
export type CreateUserResult =
  | { success: true; user: CreatedUser }
  | { success: false; error: string };

export type CreatedUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  username: string;
  displayUsername: string;
  id: string;
  phone: string | null;
  first_name: string;
  last_name: string;
};
