import { UserRole } from '../enums/user-role.enum';
export interface UserDTO {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    avatar?: string;
    createdAt: Date | string;
}
export type User = UserDTO;
