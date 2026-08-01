/**
 * 管理接口：读取与更新站点品牌联系信息
 *
 * GET  /api/v1/admin/site-settings   读取当前配置
 * PUT  /api/v1/admin/site-settings   更新配置
 *   body: { supportEmail?: string, docsUrl?: string }
 *
 * 需要管理员权限。所有字段均经过校验。
 */

import { requireAdmin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import {
  getSiteSettings,
  setSiteSetting,
  validateDocsUrl,
  validateSupportEmail,
} from "@/lib/site-settings";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const settings = await getSiteSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { supportEmail, docsUrl } = body as {
      supportEmail?: string;
      docsUrl?: string;
    };

    // 校验输入：trim、格式检查、长度限制、协议白名单
    if (typeof supportEmail !== "undefined" && supportEmail !== null) {
      if (typeof supportEmail !== "string") {
        throw new ApiError("supportEmail 必须是字符串", 400);
      }
      const validated = validateSupportEmail(supportEmail);
      await setSiteSetting("supportEmail", validated);
    }

    if (typeof docsUrl !== "undefined" && docsUrl !== null) {
      if (typeof docsUrl !== "string") {
        throw new ApiError("docsUrl 必须是字符串", 400);
      }
      const validated = validateDocsUrl(docsUrl);
      await setSiteSetting("docsUrl", validated);
    }

    const settings = await getSiteSettings();
    return apiSuccess(settings);
  } catch (error) {
    // 数据库表不存在时返回明确错误，而非静默成功
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("relation") && msg.includes("does not exist")) {
        return handleApiError(
          new ApiError(
            "站点设置表尚未创建，请先执行 pnpm db:push",
            500
          )
        );
      }
    }
    return handleApiError(error);
  }
}
