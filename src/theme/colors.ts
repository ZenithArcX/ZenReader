import { ThemeMode } from '../storage/db';

export interface ThemeColors {
  bg: string;
  text: string;
  cardBg: string;
  controlBg: string;
  border: string;
  subtext: string;
  btnBg: string;
  btnText: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: '#ffffff',
    text: '#111111',
    cardBg: '#f9f9f9',
    controlBg: 'rgba(0,0,0,0.05)',
    border: '#e0e0e0',
    subtext: '#666666',
    btnBg: '#ffffff',
    btnText: '#111111',
  },
  sepia: {
    bg: '#fbf0d9',
    text: '#3e2723',
    cardBg: '#f4e4c1',
    controlBg: 'rgba(95, 75, 50, 0.1)',
    border: '#e2cfab',
    subtext: '#6d4c41',
    btnBg: '#f4e4c1',
    btnText: '#3e2723',
  },
  amoled: {
    bg: '#000000',
    text: '#e0e0e0',
    cardBg: '#121212',
    controlBg: '#181818',
    border: '#282828',
    subtext: '#9e9e9e',
    btnBg: '#181818',
    btnText: '#ffffff',
  },
  dark: {
    bg: '#181818',
    text: '#e0e0e0',
    cardBg: '#242424',
    controlBg: '#2d2d2d',
    border: '#383838',
    subtext: '#aaaaaa',
    btnBg: '#2d2d2d',
    btnText: '#ffffff',
  },
};
