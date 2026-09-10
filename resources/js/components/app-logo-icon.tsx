import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            <path
                d="M7 12.5A4.5 4.5 0 0 1 11.5 8h17A4.5 4.5 0 0 1 33 12.5V15h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-1v1.5a4.5 4.5 0 0 1-4.5 4.5h-17A4.5 4.5 0 0 1 7 30.5v-18Z"
                fill="currentColor"
            />
            <path
                d="M27 18h7v8h-7a4 4 0 0 1 0-8Z"
                fill="white"
                fillOpacity=".92"
            />
            <circle cx="28" cy="22" r="1.5" fill="currentColor" />
        </svg>
    );
}
