import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    400: '#ff4040',
                    500: '#D50209',
                    600: '#a80107',
                },
            },
        },
    },
    plugins: [],
}

export default config
