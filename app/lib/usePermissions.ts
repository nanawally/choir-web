"use client";

import { useState, useEffect } from "react";
import { getMyPermissions, type MyPermissions } from "./api/permissions";

let cache: MyPermissions | null = null;

export function usePermissions() {
  const [data, setData] = useState<MyPermissions | null>(cache);

  useEffect(() => {
    if (cache) {
      setData(cache);
      return;
    }
    getMyPermissions().then((d) => {
      if (d) cache = d;
      setData(d);
    });
  }, []);

  const isSuperUser = data?.isSuperUser ?? false;

  function canView(feature: string): boolean {
    if (isSuperUser) return true;
    return data?.permissions[feature]?.canView ?? false;
  }
  function canEdit(feature: string): boolean {
    if (isSuperUser) return true;
    return data?.permissions[feature]?.canEdit ?? false;
  }
  function canDelete(feature: string): boolean {
    if (isSuperUser) return true;
    return data?.permissions[feature]?.canDelete ?? false;
  }

  return { canView, canEdit, canDelete, isSuperUser, loaded: data !== null };
}
