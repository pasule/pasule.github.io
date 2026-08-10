---
title: CPA网络防护
published: 2026-08-07
updated: 2026-08-07
lang: zh-CN
image: api
tags:
  - 网络
  - Linux
comment: true
description: 防止cpa盗刷的网络防护措施
category: 分类名
date: 2026-08-07
---
8月6日，早上起来如常蹬ds4 flash，显示429错误。打开opencode go套餐一看，周限额100%，月限额跑了40%。使用记录还停留在半夜一点。
![image.png](https://tu.pasule.com/file/blog/astro/1786069427322_image.png)

打开我的cpa一看，日志里密密麻麻的请求，下载完给ai审查一看。
![7759c03bcc73c647ee54448c9d19b47d.png](https://tu.pasule.com/file/blog/astro/1786070464594_7759c03bcc73c647ee54448c9d19b47d.png)
**？？？**

因为我这个站点主要是给自己和几个朋友用，所以没有做过多防护，套了一层cf和域名。但有两个大问题

- Docker端口暴露在公网上
- 密码过弱

我估计是弱密码被攻破，导致我的网站直接被入侵，连auth文件都被一并拿走了，幸好我里面已经没有可用的号了（笑）

# 处理方案

CPA自身的防护是比较弱的，只有一层密码防护。如果一开始选型的话，可以换`Sub2Api`或者套一层`newapi`。只使用cpa自身的话一定要设置强密码，使用cf的zerotrust。另外，貌似cpa自己的默认key是可以被破解的，最好删除

被盗刷以后，先关停服务，然后
*全部轮换*：
- CPA 管理密钥
- 当前的CPA API Key
- Codex、Claude、Vertex、OpenAI Compatibility 等上游凭据
- 曾出现在 Nginx URL 日志中的 Key


# 防护措施

#### 私网部署
```
你的电脑/手机
  ↓ Tailscale 加密网络
Tailscale Serve（HTTPS）
  ↓
Nginx：127.0.0.1:18080
  ↓
CPA Docker：127.0.0.1:8317
```

*具体策略*：
- 服务器和使用 CPA 的设备都安装、登录 Tailscale。
- Docker 只映射 `127.0.0.1:8317:8317`。
- Nginx 只监听 `127.0.0.1:18080`。
- 使用 Tailscale Serve 提供私网 HTTPS，例如：  
    `https://cpa-server.<tailnet>.ts.net`
- 公网关闭 80、443、8317、宝塔面板端口。
- SSH 也改为仅通过 Tailscale 访问，公网 22 最终关闭。
- 使用 Tailscale Grants/ACL，只允许你的账户或指定设备连接 CPA 端口。
- CPA 管理接口依旧禁用；需要修改配置时通过 SSH 操作。
- 如果确实需要管理页面，单独建立仅 Tailscale 可访问的入口，不和模型 API 共用公网入口。

#### 公网Cloudflare Tunnel
```
任何互联网客户端
  ↓
Cloudflare（WAF + 限速）
  ↓ Cloudflare Tunnel
Nginx：127.0.0.1:18080
  ↓
CPA Docker：127.0.0.1:8317
```

*具体策略*：

- Cloudflare Access 不开启，因此不需要额外请求头。
- 服务器不开放公网 80、443、8317，由 `cloudflared` 主动连接 Cloudflare。
- Nginx只允许 `/v1/*`、`/v1beta/*` 等必要接口。
- 管理接口和管理页面全部返回 404。
- Cloudflare WAF、IP 限速、国家/地区规则可以减轻扫描和滥用。
- CPA API Key 仍然是核心认证手段；一旦 Key 泄露，攻击者仍可能盗刷。

Cloudflare Tunnel 使用只出站连接，不需要暴露源站地址和入站端口；公开 hostname 仍可应用 WAF 等规则。

# 现在来详细讲讲后者

Cloudflare Tunnel 的作用，是让服务器上的 `cloudflared` 主动连接 Cloudflare。外部请求不再直接访问 CPA 端口，而是经过：

```
用户
→ Cloudflare
→ Cloudflare Tunnel
→ 本机 Nginx
→ CPA Docker
```

### 结构设计如下

| 用途     | 公网域名                | Tunnel 本地服务              |
| ------ | ------------------- | ------------------------ |
| 模型 API | `cpa.xxx.com`       | `http://127.0.0.1:18080` |
| 管理页面   | `cpa-admin.xxx.com` | `http://127.0.0.1:18081` |

## 第一步：创建 Tunnel

打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)，选择对应账户，然后进入：

```
Zero Trust
→ Networking / 网络
→ Tunnels
```

部分界面可能显示为：

```
Zero Trust
→ Networks
→ Connectors
→ Cloudflare Tunnels
```

点击：

```
Create Tunnel / 创建隧道
```

Connector 类型选择：

```
Cloudflared
```

填写Tunnel 名称

点击保存并继续
![image.png](https://tu.pasule.com/file/blog/astro/1786167623049_image.png)
## 第二步：安装 Connector

Cloudflare 会显示系统选择页面：

```
Operating system: Debian
Architecture: 64-bit
```

服务器先安装 `cloudflared`：
```
sudo mkdir -p /usr/share/keyrings

curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  -o /usr/share/keyrings/cloudflare-main.gpg

echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt update
sudo apt install -y cloudflared
```

Cloudflare 页面会提供一条包含 Tunnel Token 的安装命令

官方最简单的安装方式是：

```
sudo cloudflared service install <TUNNEL_TOKEN>
```

## 第三步：添加公开 API 路由

进入：

```
Zero Trust
→ Networking
→ Tunnels
→ 你的隧道
→ Routes
→ Add route
→ Published application
```

在 Hostname 中填写：

```
子域：cpa
域：xxx.com
路径：留空
```


Service 填写：

```
类型：HTTP
URL：127.0.0.1:18080
```

确认后点击：

```
Add route / 保存路由
```

Cloudflare 添加 Published application route 时，会自动创建指向 Tunnel 的 DNS 记录。

## 第四步：处理旧 DNS 记录

如果之前存在：

```
A    cpa    <服务器公网IP>
```

需要删除这个旧 A 记录。

不要继续让 CPA 域名直接解析到服务器公网 IP，否则客户端可能绕过 Tunnel。

## 第五步：不要立即发布管理域名

为了避免管理页面出现短暂的无保护窗口，建议采用这个顺序：

1. 先创建公开 API 路由。
2. 创建 Cloudflare Access 邮箱策略。
3. 创建管理域名的 Access 应用。
4. 最后添加 管理页面的 Tunnel 路由。

也就是：先把门禁装好，再把管理域名接到互联网上

# 二、配置 Cloudflare Access 邮箱验证码

Cloudflare Access 是管理域名外面的身份验证层。

最终登录流程为：

```
访问管理域名
→ Cloudflare Access 邮箱验证码
→ Cloudflare 身份验证通过
→ CPA 管理页面
→ 再输入 CPA_MANAGEMENT_KEY
```

因此管理页面拥有两层认证：

1. Cloudflare 邮箱身份验证。
2. CPA 自身的管理密钥。

首先进入[cf面板](https://dash.cloudflare.com/)，点击进入zerotrust
![image.png](https://tu.pasule.com/file/blog/astro/1786168408634_image.png)

可以先创建一个策略

![image.png](https://tu.pasule.com/file/blog/astro/1786168435191_image.png)

策略规则选择电子邮件，策略名称随意填写，如果需要经常访问cpa面板，策略会话持续时间可以适当设置得长一点

![image.png](https://tu.pasule.com/file/blog/astro/1786168537655_image.png)

然后把自己常用的邮箱填写进去,可添加多个邮箱

![image.png](https://tu.pasule.com/file/blog/astro/1786168576747_image.png)

填写完成后下拉页面点击保存

![保存策略](https://tu.pasule.com/file/blog/astro/1786168599544_image.png)

然后进入访问控制下面的应用程序，点击添加应用程序

![添加应用程序](https://tu.pasule.com/file/blog/astro/1786168621161_image.png)

选择继续使用自托管和私有

![继续使用自托管和私有](https://tu.pasule.com/file/blog/astro/1786168648965_image.png)

随后填写子域和路径，子域填写为cpa设置的子域名，当然如果你是直接拿根域名解析的cpa，可以不用填写子域，路径必须留空。

填写完成后下拉选择 **Access 策略**，选择刚才创建的策略名称
![image.png](https://tu.pasule.com/file/blog/astro/1786168800583_image.png)

确认无误后下拉到最底端点击创建

至此，cpa的管理面板就纳入cf大善人的保护下了，免费版每个应用最多支持5个子域的保护，如果有别的管理面板需要防护，也可以一起填进去  
登陆时需要首先填写邮箱验证码，如果觉得邮箱验证码不够优雅，zerotrust还提供了包括但不限于SMS、MFA、PIN、虹膜、指纹、语音识别、面部识别等各种验证方法，这方面就自行研究了

## 最后发布管理域名

回到：

```
Zero Trust
→ Networking
→ Tunnels
→ cpa-pasule
→ Routes
→ Add route
→ Published application
```

填写：

```
子域：cpa-admin
域：xxx.com
路径：留空
```

Service：

```
类型：HTTP
URL：127.0.0.1:18081
```

或者完整写法：

```
http://127.0.0.1:18081
```

点击：

```
Add route
```

Cloudflare 会自动创建管理域名的 Tunnel DNS 记录。

至此，管理入口才正式上线。

## 最终效果

公开 API：

```
https://cpa.xxx.com/v1
```

认证方式：

```
CPA_API_KEY
```

管理页面：

```
https://cpa-admin.xxx.com/management.html
```

认证方式：

```
Cloudflare 邮箱验证码
+
CPA_MANAGEMENT_KEY
```

因此管理页面属于：

> 公网可达，但并未公开开放。未经允许的用户只能到达 Cloudflare Access 登录页面，无法接触 CPA 管理页面和管理 API。
# 参考文章

- [DigitalOcean nginx反代教程](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-on-ubuntu-22-04#step-1-installing-nginx)
- [使用cloudflare的zerotrust防止cpa被盗刷](https://linux.do/t/topic/2713667)
