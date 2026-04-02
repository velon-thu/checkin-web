# 打卡系统风险审查

审查时间：2026-04-02

审查范围：
- 首页打卡主流程
- 日历页统计逻辑
- `Habit` / `Checkin` 数据模型
- `/api/habits` 与 `/api/checkins/toggle` 接口

说明：
- 本文档只记录问题与风险，不涉及代码修改方案。
- 风险级别按 `高 / 中 / 中低` 标注，优先级从高到低排列。

## 1. 高风险：系统没有用户隔离或鉴权，任何访问者都能修改全局数据

现状：
- 数据模型中没有 `userId` 或任何归属字段。
- 新增习惯、删除习惯、切换打卡接口都没有登录态或权限校验。

影响：
- 只要有人能访问系统，就可以对所有习惯和打卡记录进行新增、删除、补打卡、取消打卡。
- 如果后续部署到公网，这会直接变成数据安全和数据污染问题。

涉及位置：
- `prisma/schema.prisma:15`
- `prisma/schema.prisma:22`
- `app/api/habits/route.ts:4`
- `app/api/checkins/toggle/route.ts:6`

## 2. 高风险：打卡切换与删除存在并发竞态，重复点击或多端同时操作可能触发 500

现状：
- 打卡切换接口先查是否存在，再决定删除或创建，不是原子操作。
- 删除习惯接口先查存在，再执行删除，也存在同类窗口期。
- 并发请求下，两个请求可能读到同一份旧状态，随后其中一个操作会因为数据已变化而失败。

影响：
- 双击打卡、网络抖动重试、多端同时点同一习惯时，可能出现：
  - 创建时撞唯一索引
  - 删除时找不到记录
  - 接口直接返回 500
- 这类问题会进一步导致前端显示状态和数据库真实状态不一致。

涉及位置：
- `app/api/checkins/toggle/route.ts:28`
- `app/api/checkins/toggle/route.ts:50`
- `app/api/checkins/toggle/route.ts:66`
- `app/api/habits/route.ts:49`
- `app/api/habits/route.ts:59`

## 3. 高风险：前端没有请求中的互斥控制，快速重复点击会放大状态错乱问题

现状：
- 打卡按钮和删除按钮在请求进行时仍可继续点击。
- `handleToggleCheckIn` 没有 pending 状态、按钮禁用、请求序号校验或响应顺序保护。

影响：
- 用户连续点击同一个习惯时，请求响应顺序可能和点击顺序不同。
- 后返回的旧响应可能覆盖先返回的新状态，造成页面显示错误。
- 在与第 2 条叠加时，更容易出现“页面显示已打卡，但数据库实际未打卡”之类的问题。

涉及位置：
- `components/habit-card.tsx:41`
- `components/habit-tracker-client.tsx:157`
- `components/habit-tracker-client.tsx:170`
- `components/habit-tracker-client.tsx:176`

## 4. 高风险：首页和日历页对“今天”的判定来源不一致，跨时区和跨午夜时容易出错

现状：
- 首页客户端用浏览器本地时间计算 `today`。
- 日历页服务端用服务器时间计算日期范围。
- 页面打开后如果跨过午夜，客户端的 `today` 不会自动刷新，仍然沿用首次渲染时的日期。

影响：
- 用户与服务器不在同一时区时，首页和日历页对“今天”的理解可能不同。
- 页面开着过夜不刷新时，用户第二天点击打卡，仍可能写入前一天日期。
- streak、今日已打卡数量、日历统计边界都可能出现偏差。

涉及位置：
- `components/habit-tracker-client.tsx:90`
- `components/habit-tracker-client.tsx:146`
- `components/habit-tracker-client.tsx:170`
- `app/calendar/page.tsx:39`
- `app/calendar/page.tsx:45`

## 5. 中风险：日期校验只校验格式，不校验真实合法性，也不限制未来/异常日期

现状：
- 接口只用正则校验 `YYYY-MM-DD` 格式。
- 没有校验该日期是否真实存在，也没有限制只能打今天或可允许的补签范围。

影响：
- 像 `2026-02-31`、`2026-13-99` 这样的字符串也会被接受。
- 任意未来日期或异常日期都可能写进数据库。
- 会污染历史记录，并影响 streak 与日历统计结果。

涉及位置：
- `app/api/checkins/toggle/route.ts:4`
- `app/api/checkins/toggle/route.ts:21`
- `components/habit-tracker-client.tsx:99`

## 6. 中风险：习惯名称的去重规则前后端不一致

现状：
- 前端使用不区分大小写的方式判断重复名称。
- 数据库唯一约束和后端 `upsert` 按原始字符串精确匹配。

影响：
- `Run` 和 `run` 这类名称可能在数据库中同时存在。
- 前端又可能在某些场景把它们视为重复，导致界面行为和数据库真实状态不一致。
- 长期看会造成数据命名不规范、接口行为不可预测。

涉及位置：
- `components/habit-tracker-client.tsx:221`
- `components/habit-tracker-client.tsx:237`
- `app/api/habits/route.ts:15`
- `prisma/schema.prisma:17`

## 7. 中风险：首页每次都会全量读取所有打卡记录，数据增长后性能会下降

现状：
- 首页为了计算 streak，直接读取整张 `Checkin` 表所有记录。
- 然后在服务端内存里组装 `initialCheckinDatesByHabit`。

影响：
- 随着打卡历史增长，请求耗时、数据库读取量、内存占用都会线性上涨。
- 如果后续习惯和打卡记录明显增多，首页会成为最先变慢的页面。

涉及位置：
- `app/page.tsx:13`
- `app/page.tsx:41`
- `app/page.tsx:61`

## 8. 中低风险：接口失败时前端静默处理，用户没有错误反馈

现状：
- 新增、删除、打卡接口只要返回失败，前端就直接 `return`。
- 页面没有错误提示、没有重试提示、没有状态回滚提示。

影响：
- 用户不知道失败原因，容易重复点击。
- 会放大第 2 条和第 3 条中的并发问题。
- 对用户来说表现为“按钮点了没反应”或“有时能点上有时不行”。

涉及位置：
- `components/habit-tracker-client.tsx:172`
- `components/habit-tracker-client.tsx:232`
- `components/habit-tracker-client.tsx:274`

## 补充结论

本次检查中：
- `npm run lint` 通过
- `npm run build` 通过

结论：
- 当前项目的主要风险不在语法、类型或构建流程。
- 更核心的问题集中在数据正确性、并发处理、日期边界和权限控制。
