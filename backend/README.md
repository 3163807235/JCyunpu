# jcyunpu-server（家传云谱后端）

文档驱动开仓骨架。**权威约定**见仓库根目录：

- [`docs/backend/README.md`](../docs/backend/README.md)
- [技术选型与架构](../docs/backend/家传云谱·后端技术选型与架构_v0.1.md)（Java17 / Boot3 / MyBatis-Plus / MySQL / Redis / RabbitMQ / Maven）
- [OpenAPI P0 目录](../docs/backend/家传云谱·OpenAPI接口目录草案_v0.1.md)
- [数据库大纲](../docs/backend/家传云谱·数据库设计大纲_v0.1.md)
- [开仓约定与沙箱](../docs/backend/家传云谱·开仓约定与沙箱策略_v0.1.md)

统一响应 `{ code, msg, data }` · 分页 `current/size/records/total` · 见根目录《必读文档》。

## 当前进度

| 项 | 状态 |
|----|------|
| Maven 骨架 / Compose / `.env.example` | ✅ |
| Flyway `V1__init_schema.sql`（MVP 表，不含 renewal_item） | ✅ |
| common（ApiResponse / 异常 / UserContext） | ✅ |
| `GET /api/meta/ping` | ✅ |
| JWT + P0 `auth`（短信 Mock / 注册登录刷新登出重置 / user/info） | ✅ |
| P0 `genealogy` + `member` | ⏳ 下一迭代 |

### Auth 冒烟（依赖 MySQL + Redis）

```bash
# 发码（Mock 固定 123456，见日志）
curl -X POST http://localhost:8080/api/auth/sms/send -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"scene\":\"register\"}"

# 注册
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"smsCode\":\"123456\",\"password\":\"pass1234\"}"

# 登录
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"phone\":\"13800138000\",\"password\":\"pass1234\",\"loginType\":\"password\"}"
```

## 本地启动

```bash
# 1. 依赖（本机已有 MySQL80 时不要起 mysql，避免 3306 冲突）
cd backend
docker compose up -d redis rabbitmq
# 可选：docker compose up -d minio
# 全容器 MySQL：先停本机 MySQL，再 docker compose --profile full up -d

# 2. 环境
cp .env.example .env   # 已有 .env 可跳过；指向本机库 jcyunpu

# 3. 运行（JDK 17+ / Maven；需把 .env 导出到环境变量或 IDE 注入）
mvn spring-boot:run
```

- 探活：`GET http://localhost:8080/api/meta/ping`
- Actuator：`GET http://localhost:8080/actuator/health`
- Swagger：`http://localhost:8080/swagger-ui.html`
- RabbitMQ 管理台：`http://localhost:15672`（guest/guest）
- MinIO 控制台：`http://localhost:9001`（minioadmin/minioadmin）

Flyway 在应用启动时自动执行 `src/main/resources/db/migration`。

## 实现顺序（文档 §4）

1. ~~骨架~~  
2. ~~JWT 鉴权 + `auth`~~  
3. `genealogy` + `member`  
4. `person` / `relationship`  
5. `subscription`（支付 Mock）  
6. 前端联调关 Mock  

## 分支建议

`main` 可发布；特性用 `feature/*`。
