export default { 
    content: [
        './index.html', 
        './src/**/*.{js,ts,jsx,tsx}'
    ], 
    theme: { 
        extend: { 
            fontFamily: { 
                sans: [
                    'Inter', 
                    'sans-serif'
                ] 
            }, 
            colors: { 
                background: '#000000', 
                surface: '#0A0A0A', 
                'surface-hover': '#141414', 
                border: '#1F1F1F', 
                primary: '#FFFFFF', 
                secondary: '#A1A1AA', 
                accent: '#6366F1' 
            }, 
            animation: { 
                'fade-in': 'fadeIn 0.5s ease-out forwards', 
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', 
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
            }, 
            keyframes: { 
                fadeIn: { 
                    '0%': { opacity: '0' }, 
                    '100%': { opacity: '1' } 
                }, 
                slideUp: { 
                    '0%': { 
                        opacity: '0', 
                        transform: 'translateY(20px)' 
                    }, 
                    '100%': { 
                        opacity: '1', 
                        transform: 'translateY(0)' 
                    } 
                } 
            } 
        } 
    }, 
    plugins: [], 
}