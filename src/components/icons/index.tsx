// MODIFIED: 2026-03-03 - Added reusable inline SVG icon components

import type React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

function createIcon(path: React.ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {path}
      </svg>
    );
  };
}

export const IconBell = createIcon(
  <>
    <path d="M14.25 18.75a2.25 2.25 0 1 1-4.5 0" />
    <path d="M4.5 9.75A7.5 7.5 0 0 1 12 2.25a7.5 7.5 0 0 1 7.5 7.5c0 3.5 1.286 4.786 1.5 5.25H3c.214-.464 1.5-1.75 1.5-5.25Z" />
  </>
);

export const IconUser = createIcon(
  <>
    <path d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
  </>
);

export const IconLogout = createIcon(
  <>
    <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
    <path d="M18 12H9.75" />
    <path d="m15 9 3 3-3 3" />
  </>
);

export const IconEdit = createIcon(
  <>
    <path d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.28 18.01 4.5 19.5 5.99 15.72Z" />
  </>
);

export const IconTrash = createIcon(
  <>
    <path d="M9.75 4.5h4.5" />
    <path d="M4.5 6.75h15" />
    <path d="M18 6.75v11.25A2.25 2.25 0 0 1 15.75 20.25H8.25A2.25 2.25 0 0 1 6 18V6.75" />
  </>
);

export const IconPlus = createIcon(
  <>
    <path d="M12 4.5v15" />
    <path d="M4.5 12h15" />
  </>
);

export const IconSearch = createIcon(
  <>
    <path d="m21 21-4.35-4.35" />
    <circle cx="11" cy="11" r="6" />
  </>
);

export const IconFilter = createIcon(
  <>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </>
);

export const IconMail = createIcon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 6 8 7 8-7" />
  </>
);

export const IconLock = createIcon(
  <>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </>
);

export const IconEye = createIcon(
  <>
    <path d="M2.25 12s2.25-6 9.75-6 9.75 6 9.75 6-2.25 6-9.75 6-9.75-6-9.75-6Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const IconEyeOff = createIcon(
  <>
    <path d="M3 3l18 18" />
    <path d="M10.477 10.477A3 3 0 0 0 12 15a3 3 0 0 0 2.523-4.523" />
    <path d="M9.88 4.257A9.72 9.72 0 0 1 12 4.5c7.5 0 9.75 6 9.75 6a15.51 15.51 0 0 1-1.677 2.927" />
    <path d="M6.228 6.228C3.32 7.676 2.25 10.5 2.25 10.5s2.25 6 9.75 6c1.086 0 2.086-.123 3-.353" />
  </>
);

export const IconCheck = createIcon(
  <>
    <path d="m4.5 12.75 6 6 9-13.5" />
  </>
);

export const IconX = createIcon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>
);

export const IconChevronDown = createIcon(
  <>
    <path d="m6 9 6 6 6-6" />
  </>
);

export const IconBuilding = createIcon(
  <>
    <rect x="4" y="3" width="8" height="18" rx="1" />
    <rect x="12" y="7" width="8" height="14" rx="1" />
    <path d="M8 7h0" />
    <path d="M8 11h0" />
    <path d="M8 15h0" />
    <path d="M16 11h0" />
    <path d="M16 15h0" />
    <path d="M16 19h0" />
  </>
);

export const IconCalendar = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <path d="M3 10h18" />
  </>
);

export const IconDollar = createIcon(
  <>
    <path d="M12 2v20" />
    <path d="M17 7.5C17 5.567 15.657 4 13.5 4h-3A2.5 2.5 0 0 0 8 6.5C8 8.433 9.343 10 11.5 10h1A2.5 2.5 0 0 1 15 12.5 2.5 2.5 0 0 1 12.5 15h-3A2.5 2.5 0 0 0 7 17.5" />
  </>
);

export const IconAlertTriangle = createIcon(
  <>
    <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>
);

export const IconMapPin = createIcon(
  <>
    <path d="M12 21s-6-4.686-6-10a6 6 0 1 1 12 0c0 5.314-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.5" />
  </>
);

export const IconKey = createIcon(
  <>
    <circle cx="8.5" cy="8.5" r="3.5" />
    <path d="m11.5 11.5 5 5" />
    <path d="m17 17 2 2" />
    <path d="m14 14 2 2" />
  </>
);

export const IconSlash = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M5 19 19 5" />
  </>
);

export const IconCheckCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </>
);

export const IconDownload = createIcon(
  <>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 19h14" />
  </>
);

export const IconMenu = createIcon(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>
);

export const IconSun = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5" />
    <path d="M12 19.5V22" />
    <path d="M4.22 4.22 5.9 5.9" />
    <path d="M18.1 18.1 19.78 19.78" />
    <path d="M2 12h2.5" />
    <path d="M19.5 12H22" />
    <path d="M4.22 19.78 5.9 18.1" />
    <path d="M18.1 5.9 19.78 4.22" />
  </>
);

export const IconMoon = createIcon(
  <>
    <path d="M21 12.79A9 9 0 0 1 11.21 3 6.5 6.5 0 1 0 21 12.79Z" />
  </>
);

export const IconHome = createIcon(
  <>
    <path d="m3 10 9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </>
);

export const IconUsers = createIcon(
  <>
    <path d="M16 14a4 4 0 1 0-8 0" />
    <path d="M6 18a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4" />
    <path d="M9 7a3 3 0 1 1 6 0" />
  </>
);

export const IconBarChart = createIcon(
  <>
    <path d="M4 21h16" />
    <rect x="5" y="10" width="3" height="8" rx="1" />
    <rect x="10.5" y="6" width="3" height="12" rx="1" />
    <rect x="16" y="12" width="3" height="6" rx="1" />
  </>
);

