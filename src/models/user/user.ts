export interface Roles {
  reader: boolean;
  author?: boolean;
  admin?: boolean;
}
export class User {
  displayName:string;
  email: string;
  photoURL: string;
  roles: Roles;
  constructor(authData) {
    this.displayName = authData.displayName;
    this.email = authData.email;
    this.photoURL = authData.photoURL;
    this.roles = { reader: true };
  }
}