export type Session = {
  userId: number;   // matches User.id — used for userCan() db lookup
  role: string;     // label like "admin", "staff" — optional, mostly for UI hints
};