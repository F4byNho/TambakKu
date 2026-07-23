"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HPPPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/pembukuan?tab=hpp");
  }, [router]);

  return null;
}
