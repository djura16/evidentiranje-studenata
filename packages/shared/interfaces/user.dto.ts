import { UserRole } from '../enums/user-role.enum';

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  indexNumber?: string;
  enrollmentYear?: number;
  role: UserRole;
  avatar?: string;
  createdAt: Date | string; // Date from backend, string when serialized
}

// Alias for convenience
export type User = UserDTO;
