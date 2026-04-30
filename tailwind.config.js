// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#020617',     // 極深藍黑 (背景)
        'dark-card': '#0f172a',   // 深藍灰 (卡片)
        'navy-primary': '#1e40af', // 專業深藍
        'status-ok': '#22c55e',
        'status-warn': '#f97316',
        'status-error': '#ef4444',
      }
    },
  },
  plugins: [],
}