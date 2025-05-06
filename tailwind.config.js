/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#2C6EAA', // Medium blue - main UI elements
          light: '#4A8AC2',
          dark: '#1F5A8F',
        },
        accent: {
          DEFAULT: '#3EB5BD', // Teal/turquoise - buttons and interactive elements
          light: '#62C8CF',
          dark: '#2A999F',
        },
        // Secondary colors
        background: '#F7F9FC', // Light gray for main content areas
        card: '#FFFFFF',      // White for information cards
        text: {
          DEFAULT: '#253746', // Dark blue-gray for main text
          light: '#546A7B',
          muted: '#8096A7',
        },
        // Status/Alert colors
        status: {
          urgent: '#E05C5C',  // Soft red - urgent/emergency
          success: '#5CBA99', // Mint green - new items/success
          warning: '#F0B86C', // Amber - warning/pending
          info: '#6098D3',    // Light blue - informational
        },
        // Additional colors
        border: '#E2E8F0',    // Light gray for borders
        hover: '#EDF2F7',     // Very light blue for hover states
        focus: '#CBE1FF',     // Light blue for focus states
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'dashboard-title': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'section-header': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'card-title': ['16px', { lineHeight: '22px', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'sidebar': ['15px', { lineHeight: '20px', fontWeight: '500' }],
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 2px 10px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'input': '6px',
      },
      spacing: {
        'card-padding': '20px',
        'card-margin': '24px',
      },
      lineHeight: {
        'comfortable': '1.5',
      },
    },
  },
  plugins: [],
}