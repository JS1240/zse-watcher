import type { Preview } from '@storybook/react-vite';
import '@/config/i18n';
import '@/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#f8f9fa' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
};

export default preview;