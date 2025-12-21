import React from "react";

export const MessengerIcon = ({ className = "" }: { className?: string }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.85 1.39 5.37 3.55 7.07.32.25.52.65.52 1.1 0 .24-.07.47-.2.67l-2.3 3.67c-.3.48.14 1.1.74 1.1h.04c.36 0 .7-.22.84-.57l.9-2.2c.3-.74 1.02-1.24 1.84-1.24h.2c4.37-.4 7.87-4.02 7.87-8.6C16 6.14 17.46 2 12 2zm1.5 10.5l-2.6-2.8-5.1 2.8 5.6-6 2.7 2.8 5.1-2.8-5.7 6z" />
        </svg>
    );
};