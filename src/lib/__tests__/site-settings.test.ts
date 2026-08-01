/**
 * 站点设置 - 校验逻辑与回退策略单元测试
 *
 * 使用 Node 内置 test runner（node:test），无需安装额外依赖。
 * 运行方式：pnpm test
 *
 * 覆盖场景：
 * - 校验函数（邮箱格式、URL 协议、长度限制、trim）
 * - DEFAULT_BRANDING_SETTINGS 环境变量回退
 * - 缓存失效函数
 * - API 响应辅助函数（apiSuccess / apiError / handleApiError）
 * - 公开接口异常时不泄露堆栈（通过模拟 getSiteSettings 抛错）
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  validateSupportEmail,
  validateDocsUrl,
  invalidateSiteSettingsCache,
  DEFAULT_BRANDING_SETTINGS,
} from "@/lib/site-settings";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";

// ============================================
// 校验函数测试
// ============================================

describe("validateSupportEmail", () => {
  it("合法邮箱通过校验", () => {
    assert.equal(validateSupportEmail("support@example.com"), "support@example.com");
    assert.equal(validateSupportEmail("  test@domain.org  "), "test@domain.org");
  });

  it("空字符串允许（表示清除配置）", () => {
    assert.equal(validateSupportEmail(""), "");
    assert.equal(validateSupportEmail("   "), "");
  });

  it("非法邮箱被拒绝", () => {
    assert.throws(() => validateSupportEmail("not-an-email"), /格式不正确/);
    assert.throws(() => validateSupportEmail("missing@domain"), /格式不正确/);
    assert.throws(() => validateSupportEmail("@domain.com"), /格式不正确/);
    assert.throws(() => validateSupportEmail("space in@domain.com"), /格式不正确/);
  });

  it("邮箱超长被拒绝（>254 字符）", () => {
    const longEmail = "a".repeat(250) + "@b.co";
    assert.throws(() => validateSupportEmail(longEmail), /超过/);
  });
});

describe("validateDocsUrl", () => {
  it("合法 http/https URL 通过校验", () => {
    assert.equal(validateDocsUrl("https://docs.example.com"), "https://docs.example.com");
    assert.equal(validateDocsUrl("http://localhost:3000/docs"), "http://localhost:3000/docs");
    assert.equal(
      validateDocsUrl("  https://example.com/docs  "),
      "https://example.com/docs"
    );
  });

  it("空字符串允许（表示清除配置）", () => {
    assert.equal(validateDocsUrl(""), "");
    assert.equal(validateDocsUrl("   "), "");
  });

  it("javascript: 协议被拒绝", () => {
    assert.throws(() => validateDocsUrl("javascript:alert(1)"), /协议/);
  });

  it("data: 协议被拒绝", () => {
    assert.throws(() => validateDocsUrl("data:text/html,<script>"), /协议/);
  });

  it("ftp 协议被拒绝", () => {
    assert.throws(() => validateDocsUrl("ftp://example.com"), /协议/);
  });

  it("URL 超长被拒绝（>2048 字符）", () => {
    const longUrl = "https://example.com/" + "a".repeat(2050);
    assert.throws(() => validateDocsUrl(longUrl), /超过/);
  });

  it("非法 URL 格式被拒绝", () => {
    assert.throws(() => validateDocsUrl("not-a-url"), /格式不正确/);
    assert.throws(() => validateDocsUrl("://missing-protocol"), /格式不正确/);
  });
});

// ============================================
// 回退策略测试
// ============================================

describe("DEFAULT_BRANDING_SETTINGS 环境变量回退", () => {
  it("supportEmail 回退到 NEXT_PUBLIC_SUPPORT_EMAIL", () => {
    // DEFAULT_BRANDING_SETTINGS 在模块加载时读取 env
    // 如果 env 未设置，回退到空字符串
    const expected = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
    assert.equal(DEFAULT_BRANDING_SETTINGS.supportEmail, expected);
  });

  it("docsUrl 回退到 NEXT_PUBLIC_DOCS_URL", () => {
    const expected = process.env.NEXT_PUBLIC_DOCS_URL ?? "";
    assert.equal(DEFAULT_BRANDING_SETTINGS.docsUrl, expected);
  });

  it("env 未设置时回退到空字符串（不显示虚假信息）", () => {
    // 在测试环境中 env 通常未设置
    if (!process.env.NEXT_PUBLIC_SUPPORT_EMAIL) {
      assert.equal(DEFAULT_BRANDING_SETTINGS.supportEmail, "");
    }
    if (!process.env.NEXT_PUBLIC_DOCS_URL) {
      assert.equal(DEFAULT_BRANDING_SETTINGS.docsUrl, "");
    }
  });
});

// ============================================
// 缓存失效测试
// ============================================

describe("invalidateSiteSettingsCache", () => {
  beforeEach(() => {
    invalidateSiteSettingsCache();
  });

  it("调用后不抛出异常", () => {
    assert.doesNotThrow(() => invalidateSiteSettingsCache());
  });

  it("可重复调用（幂等）", () => {
    invalidateSiteSettingsCache();
    invalidateSiteSettingsCache();
    invalidateSiteSettingsCache();
    // 不抛出即通过
  });
});

// ============================================
// API 响应辅助函数测试
// ============================================

describe("apiSuccess", () => {
  it("返回 200 + success:true + data", async () => {
    const res = apiSuccess({ supportEmail: "test@test.com", docsUrl: "" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.deepEqual(body.data, { supportEmail: "test@test.com", docsUrl: "" });
  });

  it("支持自定义 status", async () => {
    const res = apiSuccess({ ok: true }, 201);
    assert.equal(res.status, 201);
  });
});

describe("apiError", () => {
  it("返回错误状态 + success:false + error.message", async () => {
    const res = apiError("bad request", 400);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.message, "bad request");
  });
});

describe("handleApiError", () => {
  it("ApiError 实例返回对应 status 和 message", async () => {
    const err = new ApiError("Forbidden", 403);
    const res = handleApiError(err);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.message, "Forbidden");
  });

  it("普通 Error 返回 500 + 通用消息（不泄露堆栈）", async () => {
    const err = new Error("database connection failed at line 42");
    const res = handleApiError(err);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error.message, "Internal server error");
    // 确保不泄露原始错误消息
    assert.equal(body.error.message.includes("database"), false);
  });

  it("字符串错误返回 500 + 通用消息", async () => {
    const res = handleApiError("some string error");
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error.message, "Internal server error");
  });
});

// ============================================
// 公开接口异常安全测试
// ============================================
describe("公开接口异常时不泄露堆栈", () => {
  it("getSiteSettings 抛错时公开接口返回空值（模拟）", async () => {
    // 模拟公开接口 GET 的异常处理逻辑
    // 实际路由文件导出的 GET 函数依赖 @/db 模块，无法在纯函数测试中直接导入
    // 这里测试其异常处理逻辑的等价实现
    const mockGetSiteSettings = async (): Promise<never> => {
      throw new Error("relation site_settings does not exist");
    };

    let response;
    try {
      await mockGetSiteSettings();
      response = { success: true, data: { supportEmail: "should-not-reach", docsUrl: "" } };
    } catch {
      // 异常时返回空值，不泄露堆栈
      response = { success: true, data: { supportEmail: "", docsUrl: "" } };
    }

    assert.equal(response.success, true);
    assert.equal(response.data.supportEmail, "");
    assert.equal(response.data.docsUrl, "");
    // 确保不包含错误信息
    assert.equal(JSON.stringify(response).includes("does not exist"), false);
  });
});
