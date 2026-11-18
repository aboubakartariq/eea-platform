const labels: Record<string, string> = {
  "login.password_ok": "entered the correct password",
  "login.success": "signed in",
  "login.failed": "failed to sign in",
  "login.locked": "was locked out after failed sign-ins",
  "login.totp_failed": "entered a wrong two-step code",
  logout: "signed out",
  "user.created": "created a user",
  "user.updated": "updated a user",
  "user.roles_changed": "changed a user's roles",
  "user.disabled": "disabled a user",
  "user.enabled": "re-enabled a user",
  "user.password_reset": "reset a user's password",
  "user.password_changed": "changed their password",
  "user.2fa_enabled": "turned on two-step verification",
  "user.2fa_reset": "reset a user's two-step verification",
  "role.permissions_changed": "changed a role's permissions",
  "enquiry.received": "sent a website enquiry",
  "enquiry.status_changed": "updated an enquiry",
};

export const describeAction = (action: string) => labels[action] ?? action;
