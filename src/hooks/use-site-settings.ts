"use client";

// ============================================
// 站点品牌联系信息 Hook
// ============================================

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  DEFAULT_BRANDING_SETTINGS,
  type SiteBrandingSettings,
} from "@/lib/site-settings";

/** 统一的 query key，避免各组件重复请求 */
export const SITE_SETTINGS_QUERY_KEY = ["site-settings"] as const;

async function fetchSiteSettings(): Promise<SiteBrandingSettings> {
  const res = await fetch("/api/v1/config/site-settings", {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!data?.success) {
    return DEFAULT_BRANDING_SETTINGS;
  }
  const payload = data.data as Partial<SiteBrandingSettings>;
  return {
    supportEmail: typeof payload.supportEmail === "string" ? payload.supportEmail : "",
    docsUrl: typeof payload.docsUrl === "string" ? payload.docsUrl : "",
  };
}

/**
 * 读取后台可配置的品牌联系信息（客服邮箱、文档链接）。
 * 未加载完成时回退默认值（空字符串），确保 UI 始终有可展示内容。
 * 所有组件共用同一 query key，避免重复请求。
 */
export function useSiteSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const settings: SiteBrandingSettings = {
    supportEmail: data?.supportEmail ?? DEFAULT_BRANDING_SETTINGS.supportEmail,
    docsUrl: data?.docsUrl ?? DEFAULT_BRANDING_SETTINGS.docsUrl,
  };

  /**
   * 保存成功后调用，立即更新本地缓存并触发后台重新拉取。
   * 传入 updated 时先用 setQueryData 写入（跳过 max-age=60 的 CDN 缓存延迟），
   * 再 invalidateQueries 确保最终与服务端一致。
   */
  function invalidate(updated?: SiteBrandingSettings) {
    if (updated) {
      queryClient.setQueryData(SITE_SETTINGS_QUERY_KEY, updated);
    }
    queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
  }

  return {
    settings,
    isLoading,
    supportEmail: settings.supportEmail,
    docsUrl: settings.docsUrl,
    invalidate,
  };
}
