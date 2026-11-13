import React from 'react';

interface StudiqLogoProps {
  collapsed?: boolean;
  showTagline?: boolean;
}

export const StudiqLogo: React.FC<StudiqLogoProps> = ({
  collapsed = false,
  showTagline = false,
}) => (
  <div className="flex items-center gap-3 min-w-0">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-color)]"
      style={{
        background: 'linear-gradient(135deg, #087F83 0%, #42B8AE 100%)',
      }}
      aria-hidden="true"
    >
      {/* Brain / Neural Prism Symbol */}
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 4.5C10.5 4.5 7.5 6.9 7.5 10.2C7.5 11.4 7.9 12.5 8.6 13.4C7.3 14.3 6.5 15.8 6.5 17.4C6.5 20.3 8.9 22.5 12 22.5H14V4.5Z"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M14 4.5C17.5 4.5 20.5 6.9 20.5 10.2C20.5 11.4 20.1 12.5 19.4 13.4C20.7 14.3 21.5 15.8 21.5 17.4C21.5 20.3 19.1 22.5 16 22.5H14V4.5Z"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="10.5" r="1.25" fill="#FFBE73" />
        <circle cx="17" cy="10.5" r="1.25" fill="#FFBE73" />
        <circle cx="11.2" cy="16.8" r="1.25" fill="#FFFFFF" />
        <circle cx="16.8" cy="16.8" r="1.25" fill="#FFFFFF" />
        <path
          d="M11 10.5L14 13.5L17 10.5M11.2 16.8L14 13.5L16.8 16.8"
          stroke="#FFFFFF"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    </div>
    {!collapsed && (
      <div className="min-w-0">
        <div className="text-[15px] font-bold tracking-tight text-[var(--text-main)] font-display whitespace-nowrap">
          STUDIQ AI
        </div>
        {showTagline && (
          <div className="text-[11px] text-[var(--text-muted)] truncate">
            Think Deeper. Learn Faster.
          </div>
        )}
      </div>
    )}
  </div>
);
