/** Shared by the root layout (server) and the theme helpers (client). */
export const USER_THEME_STORAGE_KEY = "kzn-user-theme";

/**
 * Inline script for <head>: applies a saved light theme before the first
 * paint on every page (website, login, dashboards), so there is no dark flash.
 */
export const USER_THEME_BOOT_SCRIPT = `try{if(localStorage.getItem('${USER_THEME_STORAGE_KEY}')==='light'){document.documentElement.dataset.theme='light'}}catch(e){}`;
