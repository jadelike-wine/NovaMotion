# NovaMotion 管理页 (Dashboard) 完整设计方案 V2

> 版本: V2.0 | 最后更新: 2026-01-20 | 基于 V1.0 用户反馈修订

---

## 一、项目概述

### 1.1 当前状态

**已完成:**
- ✅ Dashboard 布局 `(dashboard)/layout.tsx` - 左侧导航 + 内容区
- ✅ 简化顶部导航 `HeaderSimple` - Logo + 积分 + 用户菜单
- ✅ 左侧导航 `Sidebar` - VIDEO/用户/账户分组
- ✅ API 基础 - `/api/v1/video/list`, `/api/v1/credit/balance`, `/api/v1/credit/history`
- ✅ 积分状态管理 `credits-store.ts`
- ✅ 多语言配置 `i18n`

**待实现:**
- ❌ My Creations 页面 - 视频历史列表 + 详情弹窗
- ❌ Credits 页面 - 余额显示 + 历史记录 + 跳转购买
- ❌ Settings 页面 - 简化版账单页面

### 1.2 设计原则

1. **使用主题色** - 直接引用 Tailwind 主题变量 (primary, secondary, muted, destructive 等)
2. **响应式优先** - 桌面三栏 / 平板两栏 / 手机单栏
3. **组件复用** - 基于 shadcn/ui + Magic UI 组件库
4. **多语言支持** - 所有文本使用 i18n 翻译
5. **简化设计** - 移除非核心功能，聚焦用户体验

---

## 二、页面架构总览

### 2.1 文件结构

```
src/
├── app/[locale]/(dashboard)/
│   ├── layout.tsx                  # ✅ 已有 (左侧导航布局)
│   │
│   ├── my-creations/
│   │   └── page.tsx                # ❌ 待实现
│   │
│   ├── credits/
│   │   └── page.tsx                # ❌ 待实现
│   │
│   └── settings/
│       └── page.tsx                # ❌ 待实现 (仅账单)
│
├── components/
│   ├── creation/                   # ❌ 新增目录
│   │   ├── creation-grid.tsx       # 视频网格布局
│   │   ├── creation-card.tsx       # 视频卡片 (带下载/删除)
│   │   ├── creation-filter.tsx     # 筛选下拉
│   │   ├── creation-empty.tsx      # 空状态
│   │   ├── creation-skeleton.tsx   # 加载骨架
│   │   └── video-detail-dialog.tsx # 视频详情弹窗
│   │
│   ├── credits/                    # ❌ 新增目录
│   │   ├── balance-card.tsx        # 余额卡片
│   │   ├── credit-history.tsx      # 积分历史表格
│   │   └── buy-credits-button.tsx  # 跳转购买按钮
│   │
│   ├── billing/                    # ❌ 新增目录
│   │   ├── billing-list.tsx        # 账单列表
│   │   └── invoice-card.tsx        # 账单卡片
│   │
│   └── user/                       # ✅ 更新头像组件
│       └── avatar-fallback.tsx     # 英文字母头像
│
├── lib/
│   ├── api/
│   │   └── client.ts               # API 客户端封装
│   │
├── stores/
│   └── videos-store.ts             # ❌ 新增视频状态管理
│
├── hooks/
│   ├── use-videos.ts               # ❌ 新增视频列表 Hook
│   ├── use-credit-history.ts       # ❌ 新增积分历史 Hook
│   └── use-delete-video.ts         # ❌ 新增删除视频 Hook
│
└── i18n/
    └── locales/
        ├── en.json                 # ✅ 添加 dashboard 翻译
        ├── zh.json
        └── ...
```

---

## 三、My Creations 页面设计

### 3.1 页面布局

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  顶部栏 (简化版) - Logo | ──────────────── | 💎 739 | [👤 ▼]                  │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│  左侧导航   │  My Creations                                    [All ▼] ⋯     │
│  (固定)     │  ───────────────────────────────────────────────────────────── │
│            │                                                                 │
│            │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│            │  │          │  │          │  │          │  │          │       │
│            │  │ Thumbnail│  │ Thumbnail│  │ Thumbnail│  │ Thumbnail│       │
│            │  │    ▶     │  │    ▶     │  │  ⏳      │  │    ❌    │       │
│            │  │  00:10   │  │  00:05   │  │Processing│  │ Failed   │       │
│            │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│            │  Wan 2.6       Veo 3.1       Seedance      Processing           │
│            │  Jan 15        Jan 15        Jan 14        Jan 14              │
│            │  [⋯]          [⋯]          ─             [⋯]                  │
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

**列表页操作说明:**
- 点击卡片任何位置 → 打开详情弹窗
- 右上角 `[⋯]` 操作按钮 → 展开下拉菜单（下载/删除）
- 生成中状态无操作按钮
- 失败状态显示重试和删除操作

### 3.2 组件设计

#### CreationCard (视频卡片)

```tsx
interface CreationCardProps {
  video: {
    uuid: string;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    status: 'completed' | 'processing' | 'failed';
    model: string;
    duration: number;
    aspectRatio: string;
    createdAt: Date;
    prompt: string;
    errorMessage?: string;  // 失败原因
  };
  onClick: (uuid: string) => void;          // 点击卡片打开详情
  onDownload?: (uuid: string) => void;      // 下载（从菜单）
  onDelete?: (uuid: string) => void;        // 删除（从菜单）
  onRetry?: (uuid: string) => void;         // 重试（失败视频）
}
```

**卡片状态设计:**

1. **已完成 (Completed)**
```
┌──────────────────────┐
│  ┌─────────────────┐  │  ← 缩略图
│  │  Thumbnail      │  │
│  │      ▶         │  │  ← 播放图标
│  │             00:10│  │  ← 时长
│  └─────────────────┘  │
│  Wan 2.6 | 16:9       │  ← 模型 | 比例
│  Jan 15, 2025         │  ← 日期
│                  [⋯]  │  ← 操作菜单（右上角）
└──────────────────────┘
```
- 点击卡片任何位置 → 打开详情弹窗
- 右上角 `[⋯]` 操作菜单 → 展开后显示：下载、删除

**操作菜单:**
```
┌─────────────────┐
│  ⬇️ Download    │
│  🗑️ Delete      │
└─────────────────┘
```

2. **生成中 (Processing)** - 无百分比
```
┌──────────────────────┐
│  ┌─────────────────┐  │
│  │  Thumbnail      │  │
│  │  ⏳             │  │  ← 处理中图标
│  │  Processing...  │  │
│  └─────────────────┘  │
│  Wan 2.6 | 16:9       │
│  Jan 15, 2025         │
│                      │
└──────────────────────┘
```
- 无操作按钮
- 显示 "Processing..." 文字

3. **失败 (Failed)** - 显示失败原因
```
┌──────────────────────┐
│  ┌─────────────────┐  │
│  │  ❌             │  │  ← 失败图标
│  │  Failed         │  │
│  └─────────────────┘  │
│  Wan 2.6 | 16:9       │
│  Jan 15, 2025         │
│  "Generation failed:  │  ← 失败原因（从 API 获取）
│   Invalid prompt"     │
│  [🔄 Retry] [🗑️]    │  ← 重试 | 删除按钮（直接显示）
└──────────────────────┘
```
- 失败状态显示重试和删除按钮（不是菜单）

#### VideoDetailDialog (视频详情弹窗 - 两栏布局)

```tsx
interface VideoDetailDialogProps {
  video: Video;
  open: boolean;
  onClose: () => void;
  onDownload?: (uuid: string) => void;
  onDelete?: (uuid: string) => void;
}
```

**弹窗设计（两栏布局）:**

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐ │  │
│  │  │                             │  │  Model: Wan 2.6                         │ │  │
│  │  │                             │  │  Duration: 10s | Aspect Ratio: 16:9     │ │  │
│  │  │                             │  │  ─────────────────────────────────────  │ │  │
│  │  │                             │  │                                         │ │  │
│  │  │     [Video Player]          │  │  Prompt:                               │ │  │
│  │  │        ▶  ▌▌                 │  │  "A girl walking on the beach at        │ │  │
│  │  │                             │  │   sunset, cinematic lighting, slow      │ │  │
│  │  │                             │  │   motion..."                            │ │  │
│  │  │                             │  │                                         │ │  │
│  │  │                             │  │  ─────────────────────────────────────  │ │  │
│  │  │                             │  │                                         │ │  │
│  │  │                             │  │  Created: Jan 15, 2025 at 14:30         │ │  │
│  │  │                             │  │  Credits Used: 24                       │ │  │
│  │  │                             │  │                                         │ │  │
│  │  │                             │  │  [⬇️ Download]  [🗑️ Delete]             │ │  │
│  │  │                             │  │                                         │ │  │
│  │  └─────────────────────────────┘  └─────────────────────────────────────────┘ │  │
│  │                                                                              │  │
│  │                                                        [✕ Close]           │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**布局说明:**
- **左栏** (~60%): 视频播放器（默认自动播放）
- **右栏** (~40%): 视频信息
  - 模型名称
  - 时长、比例
  - Prompt 提示词（可折叠，显示完整内容）
  - 生成时间
  - 消耗积分
  - 操作按钮：下载、删除

**响应式设计:**
- 桌面 (> 768px): 两栏横向布局
- 移动 (< 768px): 单栏纵向布局（视频在上，信息在下）

#### CreationFilter (筛选器)

```tsx
interface FilterOptions {
  status: 'all' | 'completed' | 'processing' | 'failed';
  model: 'all' | 'sora-2' | 'veo-3-1' | 'seedance-1-5' | 'wan-2-6';
  sortBy: 'newest' | 'oldest';
}
```

**UI 设计:**
```
[All Status ▼]  [All Models ▼]  [Newest ▼]
```

### 3.3 API 交互

```typescript
// GET /api/v1/video/list?limit=20&cursor=xxx&status=completed
interface ListVideosResponse {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
}

// GET /api/v1/video/[uuid]
interface VideoResponse {
  uuid: string;
  videoUrl: string;
  thumbnailUrl: string;
  status: VideoStatus;
  errorMessage?: string;  // 失败原因
  // ... 其他字段
}

// DELETE /api/v1/video/[uuid]
interface DeleteVideoResponse {
  success: boolean;
}

// POST /api/v1/video/[uuid]/retry (重试失败视频)
interface RetryVideoResponse {
  success: boolean;
  newVideoUuid: string;
}
```

### 3.4 用户交互流程

**播放视频（详情弹窗）:**
1. 点击卡片任何位置 → 打开详情弹窗
2. 弹窗内视频默认自动播放
3. 支持全屏播放、暂停、音量控制
4. 显示完整视频信息（模型、Prompt、生成时间、消耗积分）

**下载视频:**
- 方式1: 列表页右上角 `[⋯]` 菜单 → 点击 Download
- 方式2: 详情弹窗右栏 → 点击 Download 按钮

**删除视频:**
- 方式1: 列表页右上角 `[⋯]` 菜单 → 点击 Delete
- 方式2: 详情弹窗右栏 → 点击 Delete 按钮
- 需要二次确认（弹窗确认）

**重试失败视频:**
- 点击失败卡片的 `[🔄 Retry]` 按钮
- 调用 retry API 创建新的生成任务

**重试失败视频:**
- 点击失败卡片的重试按钮
- 调用 retry API
- 创建新的生成任务

### 3.5 响应式设计

| 断点 | 列数 | 卡片宽度 |
|------|------|----------|
| Mobile (< 640px) | 1列 | 100% |
| Tablet (640-1024px) | 2列 | calc(50% - 8px) |
| Desktop (> 1024px) | 3-4列 | calc(25% - 12px) |

---

## 四、Credits 页面设计 (简化版)

### 4.1 页面布局

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  顶部栏 (简化版)                                                              │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│  左侧导航   │  💎 Credits                                                     │
│            │  ───────────────────────────────────────────────────────────── │
│            │                                                                 │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │                                                          │   │
│            │  │       739                                               │   │
│            │  │       Available Credits                                 │   │
│            │  │                                                          │   │
│            │  │  🧊 214 frozen  |  💀 125 used                           │   │
│            │  │                                                          │   │
│            │  │                   ┌─────────────────────────────────┐   │   │
│            │  │                   │   💎 Buy Credits                │   │   │
│            │  │                   └─────────────────────────────────┘   │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                 │
│            │  📜 Credit History                                              │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │ Date        Type           Amount      Balance          │   │
│            │  │ ─────────────────────────────────────────────────────── │   │
│            │  │ Jan 15      Video Gen      -24         739              │   │
│            │  │             Wan 2.6                                      │   │
│            │  │ Jan 14      Purchase       +500        763              │   │
│            │  │             500 Credits Package                         │   │
│            │  │ Jan 13      Video Refund   +12         263              │   │
│            │  │             Failed: Invalid prompt                      │   │
│            │  │ Jan 12      Video Gen      -18         251              │   │
│            │  │             Veo 3.1                                      │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                 │
│            │                                           [Load More]         │
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

### 4.2 组件设计

#### BalanceCard (余额卡片)

```tsx
interface BalanceCardProps {
  balance: {
    availableCredits: number;
    frozenCredits: number;
    usedCredits: number;
  };
  onBuyCredits: () => void;  // 跳转到价格页
}
```

**设计要点:**
- 大号数字显示可用积分
- 下方显示冻结积分和已用积分
- "Buy Credits" 按钮跳转到 `/pricing` 页面
- 使用主题色强调

#### CreditHistory (积分历史)

```tsx
interface Transaction {
  id: string;
  date: Date;
  type: 'order_pay' | 'video_generate' | 'video_refund' | 'subscription' | 'admin_adjust';
  amount: number;
  balanceAfter: number;
  videoUuid?: string;
  remark?: string;  // 失败原因或其他备注
}

interface CreditHistoryProps {
  transactions: Transaction[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

**表格设计:**
- 日期 (左对齐)
- 类型 + 描述 (带图标)
- 金额 (绿色正数 / 红色负数)
- 操作后余额

**类型图标:**
- Video Gen: ▶️ (红色负数)
- Purchase: 💳 (绿色正数)
- Refund: 🔄 (绿色正数)
- Subscription: 📦 (绿色正数)
- Admin Adjust: ⚙️ (灰色)

### 4.3 API 交互

```typescript
// GET /api/v1/credit/balance
interface BalanceResponse {
  availableCredits: number;
  frozenCredits: number;
  usedCredits: number;
}

// GET /api/v1/credit/history?limit=20&cursor=xxx
interface HistoryResponse {
  transactions: Transaction[];
  nextCursor: string | null;
}
```

### 4.4 跳转购买流程

```
用户点击 "Buy Credits" 按钮
    ↓
跳转到 /pricing 页面
    ↓
用户选择套餐并支付
    ↓
支付成功后跳转回 /credits
```

---

## 五、Settings 页面设计 (简化版 - 仅账单)

### 5.1 页面布局

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  顶部栏 (简化版)                                                              │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│  左侧导航   │  💳 Billing                                                     │
│            │  ───────────────────────────────────────────────────────────── │
│            │                                                                 │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │  📧 Account                                              │   │
│            │  │                                                          │   │
│            │  │  ┌────────────────┐                                    │   │
│            │  │  │      JD        │  ← 英文字母头像                      │   │
│            │  │  └────────────────┘                                    │   │
│            │  │                                                          │   │
│            │  │  Email:     john.doe@example.com                        │   │
│            │  │  User ID:   user_123456789                              │   │
│            │  │  Joined:    Jan 10, 2025                                │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                 │
│            │  ┌─────────────────────────────────────────────────────────┐   │
│            │  │  💳 Billing History                                     │   │
│            │  │                                                          │   │
│            │  │  ┌────────────────────────────────────────────────┐     │   │
│            │  │  │ Date        Amount     Items          Status    │     │   │
│            │  │  │ ───────────────────────────────────────────── │     │   │
│            │  │  │ Jan 15      $39.99     500 Credits    Paid     │     │   │
│            │  │  │                         [📄 Invoice]           │     │   │
│            │  │  │ Dec 20      $9.99      100 Credits    Paid     │     │   │
│            │  │  │                         [📄 Invoice]           │     │   │
│            │  │  │ Dec 15      $0.00      Free Plan      Active   │     │   │
│            │  │  │                                                 │     │   │
│            │  │  └────────────────────────────────────────────────┘     │   │
│            │  │                                                          │   │
│            │  │                                           [Load More]  │   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

### 5.2 组件设计

#### AvatarFallback (英文字母头像)

```tsx
interface AvatarFallbackProps {
  name?: string | null;
  email?: string;
  className?: string;
}

// 实现: 从 name 或 email 提取首字母
// 示例: "John Doe" → "J", "john@example.com" → "j"
```

**样式:**
- 圆形背景
- 使用主题色 (primary/secondary)
- 白色文字
- 字体大小根据容器自适应

#### BillingList (账单列表)

```tsx
interface Invoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  items: InvoiceItem[];
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

interface InvoiceItem {
  type: 'credits' | 'subscription';
  description: string;
  quantity: number;
}

interface BillingListProps {
  invoices: Invoice[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

**状态样式:**
- Paid: 绿色标签
- Pending: 黄色标签
- Failed: 红色标签

### 5.3 API 交互

```typescript
// GET /api/v1/user/billing
interface BillingResponse {
  user: {
    email: string;
    id: string;
    createdAt: Date;
  };
  invoices: Invoice[];
  nextCursor: string | null;
}

// GET /api/v1/invoice/[id] (下载发票)
interface InvoiceResponse {
  url: string;  // PDF 下载链接
}
```

### 5.4 简化说明

**移除的功能:**
- ❌ 头像上传 (使用英文字母头像)
- ❌ 昵称编辑
- ❌ 语言设置
- ❌ 时区设置
- ❌ 修改密码
- ❌ 双因素认证
- ❌ 支付方式管理
- ❌ 账户删除

**保留的功能:**
- ✅ 显示账户基本信息 (Email, User ID, Joined Date)
- ✅ 账单历史列表
- ✅ 发票下载

---

## 六、共享组件与 Hooks

### 6.1 AvatarFallback 组件

```tsx
// components/user/avatar-fallback.tsx
export function AvatarFallback({ name, email, className }: AvatarFallbackProps) {
  // 优先使用 name，其次使用 email
  const initial = name
    ? name.charAt(0).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : '?';

  // 生成背景色 (基于用户名哈希)
  const bgIndex = (name || email || '?').charCodeAt(0) % colors.length;
  const bgColor = colors[bgIndex];

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full text-white font-semibold",
      className
    )} style={{ backgroundColor: bgColor }}>
      {initial}
    </div>
  );
}

// 预定义主题色数组
const colors = [
  'hsl(var(--primary))',
  'hsl(280, 65%, 60%)',  // 紫色
  'hsl(200, 65%, 55%)',  // 蓝色
  'hsl(150, 65%, 45%)',  // 绿色
  'hsl(30, 85%, 55%)',   // 橙色
];
```

### 6.2 API 客户端

```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl = '/api/v1';

  // Videos
  async getVideos(params: ListParams): Promise<ListVideosResponse> { ... }
  async getVideo(uuid: string): Promise<VideoResponse> { ... }
  async deleteVideo(uuid: string): Promise<DeleteVideoResponse> { ... }
  async retryVideo(uuid: string): Promise<RetryVideoResponse> { ... }

  // Credits
  async getBalance(): Promise<BalanceResponse> { ... }
  async getCreditHistory(params: ListParams): Promise<HistoryResponse> { ... }

  // Billing
  async getBilling(params: ListParams): Promise<BillingResponse> { ... }
  async getInvoice(invoiceId: string): Promise<InvoiceResponse> { ... }
}

export const apiClient = new ApiClient();
```

### 6.3 自定义 Hooks

```typescript
// hooks/use-videos.ts
export function useVideos(filter?: FilterOptions) {
  const { data, error, isLoading, fetchMore, hasMore, refetch } = useInfiniteQuery(...);
  const deleteMutation = useMutation(...);
  const retryMutation = useMutation(...);
  return { videos, isLoading, fetchMore, deleteVideo, retryVideo, refetch };
}

// hooks/use-credit-balance.ts
export function useCreditBalance() {
  const { data, refetch } = useQuery(['credit-balance'], () => apiClient.getBalance());
  return { balance: data, refetch };
}

// hooks/use-credit-history.ts
export function useCreditHistory() {
  const { data, isLoading, fetchMore, hasMore } = useInfiniteQuery(...);
  return { transactions, isLoading, fetchMore, hasMore };
}

// hooks/use-billing.ts
export function useBilling() {
  const { data, isLoading, fetchMore, hasMore } = useInfiniteQuery(...);
  const getInvoice = useMutation(...);
  return { user, invoices, isLoading, fetchMore, hasMore, getInvoice };
}
```

### 6.4 状态管理

```typescript
// stores/videos-store.ts (使用 Zustand)
interface VideosStore {
  // State
  videos: Video[];
  filter: FilterOptions;
  hasMore: boolean;
  loading: boolean;

  // Actions
  setVideos: (videos: Video[]) => void;
  addVideos: (videos: Video[]) => void;
  removeVideo: (uuid: string) => void;
  updateVideo: (uuid: string, updates: Partial<Video>) => void;
  setFilter: (filter: Partial<FilterOptions>) => void;
}
```

---

## 七、多语言支持

### 7.1 翻译文件结构

```json
// i18n/locales/en.json
{
  "dashboard": {
    "myCreations": {
      "title": "My Creations",
      "filter": {
        "allStatus": "All Status",
        "completed": "Completed",
        "processing": "Processing",
        "failed": "Failed",
        "allModels": "All Models",
        "newest": "Newest",
        "oldest": "Oldest"
      },
      "status": {
        "completed": "Completed",
        "processing": "Processing...",
        "failed": "Failed"
      },
      "actions": {
        "play": "Play",
        "download": "Download",
        "delete": "Delete",
        "retry": "Retry",
        "viewDetails": "View Details"
      },
      "empty": {
        "title": "No creations yet",
        "description": "Your generated videos will appear here"
      },
      "deleteConfirm": {
        "title": "Delete video?",
        "message": "This action cannot be undone.",
        "confirm": "Delete",
        "cancel": "Cancel"
      }
    },
    "credits": {
      "title": "Credits",
      "available": "Available Credits",
      "frozen": "frozen",
      "used": "used",
      "buyCredits": "Buy Credits",
      "history": "Credit History",
      "loadMore": "Load More",
      "types": {
        "videoGenerate": "Video Gen",
        "purchase": "Purchase",
        "refund": "Refund",
        "subscription": "Subscription",
        "adminAdjust": "Admin Adjust"
      }
    },
    "settings": {
      "title": "Billing",
      "account": "Account",
      "email": "Email",
      "userId": "User ID",
      "joined": "Joined",
      "billingHistory": "Billing History",
      "invoice": "Invoice",
      "status": {
        "paid": "Paid",
        "pending": "Pending",
        "failed": "Failed"
      }
    }
  }
}
```

```json
// i18n/locales/zh.json
{
  "dashboard": {
    "myCreations": {
      "title": "我的创作",
      "filter": {
        "allStatus": "全部状态",
        "completed": "已完成",
        "processing": "生成中",
        "failed": "失败",
        "allModels": "全部模型",
        "newest": "最新",
        "oldest": "最旧"
      },
      "status": {
        "completed": "已完成",
        "processing": "生成中...",
        "failed": "失败"
      },
      "actions": {
        "play": "播放",
        "download": "下载",
        "delete": "删除",
        "retry": "重试",
        "viewDetails": "查看详情"
      },
      "empty": {
        "title": "暂无创作",
        "description": "您生成的视频将显示在这里"
      },
      "deleteConfirm": {
        "title": "删除视频?",
        "message": "此操作无法撤销。",
        "confirm": "删除",
        "cancel": "取消"
      }
    },
    "credits": {
      "title": "积分",
      "available": "可用积分",
      "frozen": "冻结",
      "used": "已用",
      "buyCredits": "购买积分",
      "history": "积分历史",
      "loadMore": "加载更多",
      "types": {
        "videoGenerate": "视频生成",
        "purchase": "购买",
        "refund": "退款",
        "subscription": "订阅",
        "adminAdjust": "管理员调整"
      }
    },
    "settings": {
      "title": "账单",
      "account": "账户",
      "email": "邮箱",
      "userId": "用户ID",
      "joined": "加入时间",
      "billingHistory": "账单历史",
      "invoice": "发票",
      "status": {
        "paid": "已支付",
        "pending": "待支付",
        "failed": "失败"
      }
    }
  }
}
```

### 7.2 使用方式

```tsx
// 在组件中使用
import { useTranslations } from 'next-intl';

function MyCreationsPage() {
  const t = useTranslations('dashboard.myCreations');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('actions.download')}</button>
    </div>
  );
}
```

---

## 八、样式规范

### 8.1 颜色使用

```tsx
// ✅ 正确 - 使用主题变量
<div className="bg-background text-foreground border-border">
<div className="bg-muted text-muted-foreground">
<div className="bg-primary text-primary-foreground hover:bg-primary/90">
<div className="text-destructive">

// 辅助色
<div className="bg-emerald-500 text-white">      // 成功/正数
<div className="bg-rose-500 text-white">         // 失败/负数
<div className="bg-amber-500 text-white">        // 警告
```

### 8.2 间距规范

```tsx
// 页面容器
<div className="p-4 sm:p-6 lg:p-8">             // 响应式

// 卡片间距
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// 组件内部
<div className="space-y-4">                      // 垂直 16px
<div className="flex gap-2">                     // 水平 8px
<div className="flex gap-4">                     // 水平 16px
```

### 8.3 圆角规范

```tsx
<Card className="rounded-lg">                    // 8px (标准卡片)
<Button className="rounded-md">                  // 6px (按钮)
<Badge className="rounded-full">                 // 完全圆形 (标签)
<Avatar className="rounded-full">                // 完全圆形 (头像)
```

### 8.4 阴影规范

```tsx
<div className="shadow-sm">                      // 轻微阴影
<div className="shadow">                         // 标准阴影
<div className="shadow-lg">                      // 强阴影 (弹窗)
```

### 8.5 字体规范

```tsx
<h1 className="text-2xl font-semibold">          // 页面标题
<h2 className="text-xl font-semibold">           // 区块标题
<h3 className="text-lg font-medium">             // 子标题
<p className="text-sm text-muted-foreground">    // 正文
<span className="text-xs text-muted-foreground"> // 辅助文字
```

---

## 九、实施计划

### Phase 1: 基础设施 (1 天)

- [ ] 创建 API 客户端封装 `lib/api/client.ts`
- [ ] 创建视频状态管理 `stores/videos-store.ts`
- [ ] 创建通用 Hooks
  - [ ] `hooks/use-videos.ts`
  - [ ] `hooks/use-credit-balance.ts`
  - [ ] `hooks/use-credit-history.ts`
  - [ ] `hooks/use-billing.ts`
- [ ] 设置 React Query 配置
- [ ] 创建 AvatarFallback 组件

### Phase 2: My Creations 页面 (2-3 天)

- [ ] 创建 `components/creation/` 目录和组件
  - [ ] `creation-card.tsx` - 视频卡片 (含下载/删除按钮)
  - [ ] `creation-grid.tsx` - 网格布局
  - [ ] `creation-filter.tsx` - 筛选器
  - [ ] `creation-empty.tsx` - 空状态
  - [ ] `creation-skeleton.tsx` - 骨架屏
  - [ ] `video-detail-dialog.tsx` - 视频详情弹窗
- [ ] 实现 `my-creations/page.tsx`
- [ ] 连接 API 和状态管理
- [ ] 实现删除/下载/重试功能
- [ ] 响应式适配
- [ ] 多语言支持

### Phase 3: Credits 页面 (1-2 天)

- [ ] 创建 `components/credits/` 目录和组件
  - [ ] `balance-card.tsx` - 余额卡片
  - [ ] `credit-history.tsx` - 积分历史
  - [ ] `buy-credits-button.tsx` - 跳转购买按钮
- [ ] 实现 `credits/page.tsx`
- [ ] 连接 API 和状态管理
- [ ] 响应式适配
- [ ] 多语言支持

### Phase 4: Settings 页面 (1 天)

- [ ] 创建 `components/billing/` 目录和组件
  - [ ] `billing-list.tsx` - 账单列表
  - [ ] `invoice-card.tsx` - 账单卡片
- [ ] 实现 `settings/page.tsx` (简化版)
- [ ] 连接 API 和状态管理
- [ ] 响应式适配
- [ ] 多语言支持

### Phase 5: 测试与优化 (1 天)

- [ ] 功能测试
- [ ] 响应式测试 (移动端/平板/桌面)
- [ ] 性能优化 (图片懒加载)
- [ ] 错误处理优化
- [ ] Loading 状态优化
- [ ] 空状态优化
- [ ] 多语言测试

---

## 十、技术栈总结

| 领域 | 技术 |
|------|------|
| 布局 | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand |
| 数据获取 | React Query |
| 表单 | React Hook Form + Zod (如需要) |
| 日期处理 | date-fns |
| 图标 | Lucide React |
| 动画 | Framer Motion (Magic UI) |
| 提示 | Sonner (Toast) |
| 视频 | HTML5 Video |
| 多语言 | next-intl |

---

## 十一、关键变化总结 (V1 → V2)

| 功能 | V1 | V2 |
|------|-----|-----|
| **视频卡片进度** | 显示百分比 | 不显示百分比 |
| **失败状态** | 只显示图标 | 显示失败原因 |
| **视频播放** | - | 点击卡片打开详情弹窗 |
| **列表操作** | - | 可直接下载/删除 |
| **积分购买** | 内置购买功能 | 跳转到 /pricing |
| **Settings** | 完整设置页面 | 仅账单页面 |
| **头像** | 可上传 | 英文字母+背景 |
| **个人信息** | 可编辑 | 只读显示 |
| **支付集成** | 有 | 无 |
| **双因素认证** | 有 | 无 |
| **多语言** | - | 完整支持 |

---

**文档版本: V2.0**
**创建日期: 2026-01-20**
**状态: 待 Review (已根据用户反馈修订)**
