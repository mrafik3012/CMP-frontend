// MODIFIED: 2026-03-03 - Added PageTitle component to manage document.title

import { useEffect } from "react";
import { brand } from "../../config/brand";

interface PageTitleProps {
  title?: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${brand.name}`;
    } else {
      document.title = brand.name;
    }
  }, [title]);

  return null;
}

