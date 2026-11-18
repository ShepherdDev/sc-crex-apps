/** Where the app gets its content: the "Shepherd Church TV" Lava Application in Rock. */
export const ROCK_HOST = 'https://rock.shepherdchurch.net';
export const API_BASE = `${ROCK_HOST}/api/v2/lava-app/1/tv`;

/** Shepherd brand colors (screen values) on the dark TV theme. */
export const colors = {
  background: '#0B0C0E',
  surface: '#1A1D21',
  text: '#FFFFFF',
  textMuted: '#C9CDD2',
  textDim: '#A9AEB5',
  blue: '#43B2E5',
  red: '#9F1C20',
  focusRing: '#FFFFFF',
};

/** Width of the always-visible menu on the left. Screens draw to its right. */
export const MENU_WIDTH = 400;

/** Margin inside the content area so rows and banner line up. */
export const SIDE_MARGIN = 72;
