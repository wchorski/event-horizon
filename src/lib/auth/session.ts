export type Session = {
  user_id: number;   // matches User.id — used for userCan() db lookup
  role: string;     // label like "admin", "staff" — optional, mostly for UI hints
};

// test session — drop this anywhere during dev
export const TEST_ADMIN_SESSION: Session = {
  user_id: 1,
  role: "admin",
};
export const TEST_EDITOR_SESSION: Session = {
  user_id: 1,
  role: "admin",
};
export const TEST_MEMBER_SESSION: Session = {
  user_id: 1,
  role: "admin",
};
// export const TEST_ANON_SESSION: Session = null;