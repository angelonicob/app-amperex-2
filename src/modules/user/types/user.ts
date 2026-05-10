/** Alineado con el backend: id (uuid), globalRole (USER | SUPER_ADMIN). */
export interface User {
  id: string;
  email: string;
  globalRole: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}
