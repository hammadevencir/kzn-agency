/**
 * Password reset runs on Firebase's hosted action page (the project can't customise the
 * email action URL). Its "Continue" button returns to `PASSWORD_RESET_CONTINUE_PATH`,
 * where the login page shows `PASSWORD_RESET_DONE_MESSAGE`.
 */
export const PASSWORD_RESET_DONE_PARAM = "reset";
export const PASSWORD_RESET_CONTINUE_PATH = `/login?${PASSWORD_RESET_DONE_PARAM}=done`;
export const PASSWORD_RESET_DONE_MESSAGE = "Your password is approved and ready to use.";
