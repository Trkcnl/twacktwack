export interface UserProfile {
  readonly id: number;
  name: string;
  birthdate: string;
  height: number;
  bio: string;
}

export interface User {
  readonly id: number;
  username: string;
  password: string;
  email: string;
  user_profile: UserProfile;
}

export interface JWToken {
  access: string;
  refresh: string;
}
