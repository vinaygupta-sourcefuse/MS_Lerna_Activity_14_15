import {PermissionKey} from './permissionsKeys.js';

export const RolePermissions: {[role: string]: PermissionKey[]} = {
  admin: [
    PermissionKey.PostBook,
    PermissionKey.DeleteBook,
    PermissionKey.ViewBook,
    PermissionKey.ViewAuthor,
    PermissionKey.UpdateBook,
    PermissionKey.DeleteAuthor,
    PermissionKey.UpdateAuthor,
    PermissionKey.PostAuthor,
    PermissionKey.ViewCategory,
    PermissionKey.UpdateCategory,
    PermissionKey.DeleteCategory,
    PermissionKey.PostCategory,
    PermissionKey.ViewUser,
    PermissionKey.DeleteUser,
  ],
  user: [
    PermissionKey.ViewBook,
    PermissionKey.ViewAuthor,
    PermissionKey.ViewCategory,
  ],
};