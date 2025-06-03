/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/app/features/patient/**/*.{html,ts}", // Added for patient UI components
  ],
  darkMode: false, // Désactive le mode sombre
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#2C6EAA', // Medium blue - main UI elements
          light: '#4A8AC2',   // Patient UI
          dark: '#1F5A8F',    // Patient UI
        },
        accent: {
          DEFAULT: '#3EB5BD', // Teal/turquoise - buttons and interactive elements
          light: '#62C8CF',   // Patient UI
          dark: '#2A999F',    // Patient UI
        },
        // Secondary colors
        background: '#F7F9FC', // Patient UI - Light gray for main content areas
        card: '#FFFFFF',      // Patient UI - White for information cards
        text: {
          DEFAULT: '#253746', // Patient UI - Dark blue-gray for main text
          light: '#546A7B',   // Patient UI
          muted: '#8096A7',   // Patient UI
        },
        // Status/Alert colors
        status: {
          urgent: '#E05C5C',  // Patient UI - Soft red
          success: '#5CBA99', // Patient UI - Mint green
          warning: '#F0B86C', // Patient UI - Amber
          info: '#6098D3',    // Patient UI - Light blue
        },
        // Additional colors
        border: '#E2E8F0',    // Patient UI - Light gray for borders
        hover: '#EDF2F7',     // Patient UI - Very light blue for hover states
        focus: '#CBE1FF',     // Patient UI - Light blue for focus states
        // Analytics color palette
        analytics: {
          login: '#4A8AC2',    // Same as primary-light
          session: '#5CBA99',  // Same as status-success
          logout: '#E05C5C',   // Same as status-urgent
          bg: {
            login: '#EBF5FF',  // Light blue background
            session: '#EBFAF5', // Light green background
            logout: '#FFF0F0',  // Light red background
          },
          // Module chart colors
          modules: {
            1: {
              bg: 'rgba(44, 110, 170, 0.7)',  // Primary
              border: 'rgba(44, 110, 170, 1)'
            },
            2: {
              bg: 'rgba(96, 152, 211, 0.7)',  // Info
              border: 'rgba(96, 152, 211, 1)'
            },
            3: {
              bg: 'rgba(92, 186, 153, 0.7)',  // Success
              border: 'rgba(92, 186, 153, 1)'
            },
            4: {
              bg: 'rgba(240, 184, 108, 0.7)', // Warning
              border: 'rgba(240, 184, 108, 1)'
            },
            5: {
              bg: 'rgba(224, 92, 92, 0.7)',   // Urgent
              border: 'rgba(224, 92, 92, 1)'
            },
            6: {
              bg: 'rgba(168, 85, 247, 0.7)',  // Purple
              border: 'rgba(168, 85, 247, 1)'
            },
            7: {
              bg: 'rgba(249, 115, 22, 0.7)',  // Orange
              border: 'rgba(249, 115, 22, 1)'
            },
            8: {
              bg: 'rgba(107, 114, 128, 0.7)', // Gray
              border: 'rgba(107, 114, 128, 1)'
            },
            9: {
              bg: 'rgba(16, 185, 129, 0.7)',  // Emerald
              border: 'rgba(16, 185, 129, 1)'
            }
          },
          // Heatmap legend
          heatmap: {
            lowest: 'rgba(235, 245, 255, 0.7)',
            low: 'rgba(155, 192, 225, 0.7)',
            medium: 'rgba(74, 138, 194, 0.7)',
            high: 'rgba(44, 110, 170, 0.9)'
          },
          // User status colors
          users: {
            active: '#5CBA99',     // Same as status-success
            pending: '#F0B86C',    // Same as status-warning
            inactive: '#8096A7',   // Same as text-muted
            bg: {
              active: 'rgba(92, 186, 153, 0.15)',
              pending: 'rgba(240, 184, 108, 0.15)',
              inactive: 'rgba(128, 150, 167, 0.15)'
            }
          },
          // Registration chart
          registration: {
            primary: 'rgba(44, 110, 170, 1)',     // Primary color
            light: 'rgba(44, 110, 170, 0.6)',     // Lighter version
            fill: 'rgba(44, 110, 170, 0.1)',      // Very light fill
            growth: {
              positive: 'rgba(92, 186, 153, 1)',  // Success color
              negative: 'rgba(224, 92, 92, 1)'    // Urgent color
            }
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Patient UI
        display: ['Montserrat', 'system-ui', 'sans-serif'], // Patient UI
      },
      fontSize: {
        'dashboard-title': ['22px', { lineHeight: '28px', fontWeight: '600' }], // Patient UI
        'section-header': ['18px', { lineHeight: '24px', fontWeight: '600' }], // Patient UI
        'card-title': ['16px', { lineHeight: '22px', fontWeight: '500' }],    // Patient UI
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],          // Patient UI
        'sidebar': ['15px', { lineHeight: '20px', fontWeight: '500' }],       // Patient UI
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',             // Patient UI
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',       // Patient UI
        'dropdown': '0 2px 10px rgba(0, 0, 0, 0.15)',       // Patient UI
      },
      borderRadius: {
        'card': '8px',    // Patient UI
        'button': '6px',  // Patient UI
        'input': '6px',   // Patient UI
      },
      spacing: {
        'card-padding': '20px', // Patient UI
        'card-margin': '24px',  // Patient UI
      },
      lineHeight: {
        'comfortable': '1.5', // Patient UI
      },
    },
  },
  plugins: [],
}