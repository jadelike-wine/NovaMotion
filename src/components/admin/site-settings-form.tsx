"use client";

/**
 * 后台 - 站点品牌联系信息配置表单
 *
 * 管理员可在此配置客服邮箱与文档链接，前端各处会读取该配置展示。
 * 保存成功后自动刷新 React Query 缓存；失败时显示真实错误。
 */

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface SiteSettingsFormProps {
  initial: {
    supportEmail: string;
    docsUrl: string;
  };
}

export function SiteSettingsForm({ initial }: SiteSettingsFormProps) {
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [docsUrl, setDocsUrl] = useState(initial.docsUrl);
  const [saving, setSaving] = useState(false);
  const { invalidate } = useSiteSettings();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportEmail, docsUrl }),
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error?.message || "保存失败");
      }
      // PUT 已返回最新配置，直接写入 React Query 缓存使页面立即更新，
      // 同时 invalidateQueries 触发后台重新拉取以确保最终一致
      invalidate(data.data as { supportEmail: string; docsUrl: string });
      toast.success("品牌联系信息已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="support-email">客服邮箱</Label>
        <Input
          id="support-email"
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          placeholder="support@example.com"
        />
        <p className="text-xs text-muted-foreground">
          展示在 FAQ、定价页、服务条款、隐私政策与邮件等位置。留空则隐藏邮箱链接。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="docs-url">文档链接</Label>
        <Input
          id="docs-url"
          type="url"
          value={docsUrl}
          onChange={(e) => setDocsUrl(e.target.value)}
          placeholder="https://docs.example.com"
        />
        <p className="text-xs text-muted-foreground">
          展示在顶部导航与后台设置页的文档入口。留空则隐藏文档按钮。
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "保存配置"}
      </Button>
    </div>
  );
}
