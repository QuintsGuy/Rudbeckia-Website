/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: [
        "./src/**/*.{html,ts}",
        "./node_modules/flowbite/**/*.js"
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Great Vibes"', ...defaultTheme.fontFamily.serif],
                nav: ['"Marcellus"', ...defaultTheme.fontFamily.sans],
                body: ['"Raleway"', ...defaultTheme.fontFamily.sans],
                forum: ['"Forum"', ...defaultTheme.fontFamily.serif],
            }
        },
    },
    plugins: [
        require('flowbite/plugin')
    ],
}

