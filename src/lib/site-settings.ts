/**
 * 站点级品牌联系信息配置
 *
 * 从 site_settings 表读取管理员可配置的品牌联系信息（客服邮箱、文档链接等）。
 * 采用进程内缓存 + 失败回退默认值，确保数据库不可用时也不影响渲染。
 *
 * 回退优先级：数据库配置 ?? 环境变量 ?? 空字符串
 */

import { db } from "@/db";
import { siteSettings } from "@/db/schema";

export interface SiteBrandingSettings {
  /** 客服邮箱（FAQ、定价、法律页面、邮件等处展示） */
  supportEmail: string;
  /** 文档链接（导航、后台等处展示） */
  docsUrl: string;
}

/**
 * 默认值：在数据库未配置或不可用时使用。
 * 优先读取环境变量，未设置则为空字符串（不显示虚假信息）。
 */
export const DEFAULT_BRANDING_SETTINGS: SiteBrandingSettings = {
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "",
};

// ============================================
// 校验工具（导出供 API 路由和测试使用）
// ============================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_URL_LENGTH = 2048;
const ALLOWED_URL_PROTOCOLS = ["http:", "https:"];

/**
 * 校验客服邮箱格式。
 * 允许空字符串（表示清除配置），非空时必须符合邮箱格式。
 */
export function validateSupportEmail(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    throw new Error(`客服邮箱长度不能超过 ${MAX_EMAIL_LENGTH} 个字符`);
  }
  if (trimmed && !EMAIL_RE.test(trimmed)) {
    throw new Error("客服邮箱格式不正确");
  }
  return trimmed;
}

/**
 * 校验文档链接。
 * 允许空字符串（表示清除配置），非空时只允许 http/https 协议。
 * 拒绝 javascript:、data: 等危险协议。
 */
export function validateDocsUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(`文档链接长度不能超过 ${MAX_URL_LENGTH} 个字符`);
  }
  if (trimmed) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("文档链接格式不正确");
    }
    if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error("文档链接只支持 http:// 或 https:// 协议");
    }
  }
  return trimmed;
}

// ============================================
// 缓存
// ============================================

const CACHE_TTL_MS = 60_000; // 1 分钟

let cached: SiteBrandingSettings | null = null;
let cacheExpiresAt = 0;

/** 使进程内缓存失效（管理端更新后调用） */
export function invalidateSiteSettingsCache(): void {
  cached = null;
  cacheExpiresAt = 0;
}

/**
 * 读取站点品牌联系信息。
 * 带进程内缓存与容错回退：DB 异常时返回默认值，绝不抛出。
 */
export async function getSiteSettings(): Promise<SiteBrandingSettings> {
  if (cached && Date.now() < cacheExpiresAt) {
    return cached;
  }

  try {
    const rows = await db.select().from(siteSettings);
    const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));

    cached = {
      supportEmail: map.get("supportEmail") || DEFAULT_BRANDING_SETTINGS.supportEmail,
      docsUrl: map.get("docsUrl") || DEFAULT_BRANDING_SETTINGS.docsUrl,
    };
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cached;
  } catch {
    // 容错：数据库不可用或表不存在时回退默认值，绝不抛出
    return DEFAULT_BRANDING_SETTINGS;
  }
}

/**
 * 写入单个配置项（upsert），并使缓存失效。
 * 调用方应先通过 validateSupportEmail / validateDocsUrl 校验。
 */
export async function setSiteSetting(key: string, value: string): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });

  invalidateSiteSettingsCache();
}
