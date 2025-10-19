// Role-based routing utilities for O7C Hub ecosystem

export type UserRole = 'admin' | 'coach' | 'player' | 'parent';

export interface AppConfig {
  name: string;
  url: string;
  allowedRoles: UserRole[];
  defaultRoute: string;
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  'o7c-hub': {
    name: 'O7C Hub',
    url: process.env.NODE_ENV === 'production'
      ? 'https://o7c-hub-vercel-app.vercel.app'
      : 'http://localhost:3000',
    allowedRoles: ['admin', 'coach'],
    defaultRoute: '/'
  },
  'player-portal': {
    name: 'Player Portal',
    url: process.env.NODE_ENV === 'production'
      ? 'https://o7c-hub-player-portal-l9khcw4px-derrick-ls-projects.vercel.app'
      : 'http://localhost:3001',
    allowedRoles: ['player', 'parent'],
    defaultRoute: '/'
  }
};

export const getAppForRole = (role: UserRole): string => {
  if (['admin', 'coach'].includes(role)) {
    return 'o7c-hub';
  }
  if (['player', 'parent'].includes(role)) {
    return 'player-portal';
  }
  return 'player-portal'; // default fallback
};

export const getRedirectUrl = (role: UserRole): string => {
  const appKey = getAppForRole(role);
  const appConfig = APP_CONFIGS[appKey];
  return appConfig ? appConfig.url + appConfig.defaultRoute : APP_CONFIGS['player-portal'].url;
};

export const hasAccessToApp = (role: UserRole, appKey: string): boolean => {
  const appConfig = APP_CONFIGS[appKey];
  return appConfig ? appConfig.allowedRoles.includes(role) : false;
};

export const getCurrentApp = (): string => {
  const hostname = window.location.hostname;
  const port = window.location.port;

  if (hostname.includes('o7c-hub') || port === '3000') {
    return 'o7c-hub';
  }
  if (hostname.includes('player-portal') || port === '3001') {
    return 'player-portal';
  }
  return 'player-portal'; // default
};

export const shouldRedirectUser = (userRole: UserRole): boolean => {
  const currentApp = getCurrentApp();
  return !hasAccessToApp(userRole, currentApp);
};