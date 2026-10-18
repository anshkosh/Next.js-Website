import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const accessControl = createAccessControl({
  ...defaultStatements,
  startup: ["create", "read", "update", "delete", "moderate"],
  category: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  admin: ["create", "read", "delete"],
} as const);

// These are runtime Role objects, not permission dictionaries hidden by a cast.
// Reviewers moderate content but cannot administer accounts or sessions.
export const accountRoles = {
  user: accessControl.newRole({ startup: ["create", "read", "update"], category: ["read"] }),
  reviewer: accessControl.newRole({ startup: ["read", "moderate"], category: ["read", "create", "update"] }),
  admin: accessControl.newRole({
    ...adminAc.statements,
    startup: ["create", "read", "update", "delete", "moderate"],
    category: ["create", "read", "update", "delete"],
    settings: ["read", "update"],
    admin: ["create", "read", "delete"],
  }),
};

export const accountAdminOptions = {
  adminRoles: ["admin", "reviewer"],
  ac: accessControl,
  roles: accountRoles,
};
