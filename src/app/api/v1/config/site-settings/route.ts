/**
 * 公开接口：获取站点品牌联系信息（客服邮箱、文档链接）
 *
 * GET /api/v1/config/site-settings
 *
 * 供前端客户端组件读取管理员配置的品牌联系信息。
 * 只返回前台需要的字段，不泄露内部数据库字段或错误堆栈。
 */

import { getSiteSettings } from "@/lib/site-settings";

// 公开读取缓存 60 秒，允许 CDN 在 5 分钟内提供过期内容
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return Response.json(
      { success: true, data: settings },
      {
        status: 200,
        headers: { "Cache-Control": CACHE_CONTROL },
      }
    );
  } catch {
    // 数据库异常时返回默认空值，不泄露错误堆栈
    return Response.json(
      { success: true, data: { supportEmail: "", docsUrl: "" } },
      {
        status: 200,
        headers: { "Cache-Control": CACHE_CONTROL },
      }
    );
  }
}
