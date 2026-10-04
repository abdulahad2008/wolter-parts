import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export const PinIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z" /></svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01" /></svg>
);
export const SendIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z M10 13l4-4" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}><path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4-4" /></svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14 M5 12h14" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12l4 4 10-10" /></svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14 M13 6l6 6-6 6" /></svg>
);
export const ShareIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 4v12 M7 9l5-5 5 5 M5 14v5h14v-5" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18z M12 7v5l3 2" /></svg>
);
export const PhoneIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>
);
export const XIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12 M18 6L6 18" /></svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16 M4 12h16 M4 17h16" /></svg>
);
export const ExternalIcon = (p: P) => (
  <svg {...base(p)}><path d="M7 17L17 7 M9 7h8v8" /></svg>
);
export const EditIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base(p)}><path d="M8 8h11v11H8z M5 16V5h11" /></svg>
);
export const ArchiveIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16v4H4z M6 10v9h12v-9 M10 14h4" /></svg>
);
export const BoxIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10" /></svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg>
);
export const BarsIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 19V11 M12 19V5 M19 19v-6" /></svg>
);
export const GearIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1" /></svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base(p)}><path d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" /></svg>
);
export const ArrowUp = (p: P) => (
  <svg {...base(p)}><path d="M12 19V5 M6 11l6-6 6 6" /></svg>
);
export const ArrowDown = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14 M6 13l6 6 6-6" /></svg>
);
export const GripIcon = ({ size = 16, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
    <circle cx="9" cy="5" r="1.6" /><circle cx="15" cy="5" r="1.6" />
    <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="19" r="1.6" /><circle cx="15" cy="19" r="1.6" />
  </svg>
);
export const ImageIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 5h16v14H4z M4 16l5-5 4 4 2-2 5 5 M15 9.5a1.5 1.5 0 1 0 0 .1z" /></svg>
);
