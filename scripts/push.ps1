<#
	提交 -> 推送，GitHub Actions 在 VPS runner 上自动构建发布。

	用法:
		.\scripts\push.ps1 "feat: 增加友链"
		.\scripts\push.ps1 "chore: 更新配置" -LocalDeploy

	为什么直接跑 .ps1 而不是包一层 "pnpm run push": commit message 常含中文，
	再走一遍 npm -> cmd.exe 那条链有被按 GBK 解析的风险。

	-LocalDeploy 仅作本机直传备用通道。默认不上传 dist，避免与 Actions 重复发布。
#>
[CmdletBinding()]
param(
	[Parameter(Mandatory = $true, Position = 0)]
	[string]$Message,

	[switch]$SkipDeploy,
	[switch]$LocalDeploy,
	[switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Message)) {
	throw "commit message 不能为空。"
}

$repoRoot = Split-Path -Parent $PSScriptRoot

# Check local deployment configuration before committing or pushing.
if ($LocalDeploy -and -not $SkipDeploy) {
	& (Join-Path $PSScriptRoot "deploy-local.ps1") -Check
}

# 1. 分支检查：发布流程只在 astro-source 上跑
$branch = (& git -C $repoRoot rev-parse --abbrev-ref HEAD | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw "无法读取当前分支。" }
if ($branch -ne "astro-source") {
	throw "当前分支是 $branch，不是 astro-source。发布流程只在 astro-source 上跑。"
}

# 2. 提交
& git -C $repoRoot add -A
if ($LASTEXITCODE -ne 0) { throw "git add 失败（退出码 $LASTEXITCODE）。" }

$staged = @(& git -C $repoRoot diff --cached --name-only)
if ($staged.Count -eq 0) {
	Write-Host "[1/3] 工作区没有改动，跳过 commit。"
} else {
	Write-Host "[1/3] 提交 $($staged.Count) 个文件："
	$staged | ForEach-Object { Write-Host "      $_" }
	& git -C $repoRoot commit -m $Message
	if ($LASTEXITCODE -ne 0) { throw "git commit 失败（退出码 $LASTEXITCODE）。" }
}

# 3. 推送
Write-Host "[2/3] 推送到 origin/$branch ..."
& git -C $repoRoot push origin $branch
if ($LASTEXITCODE -ne 0) { throw "git push 失败（退出码 $LASTEXITCODE）。远端未更新，已中止，未执行部署。" }

# 4. 部署
if (-not $LocalDeploy -or $SkipDeploy) {
	Write-Host "[3/3] 已推送，GitHub Actions 将在 VPS runner 上自动构建发布。"
	Write-Host "https://github.com/pasule/pasule.github.io/actions"
	return
}

Write-Host "[3/3] 部署到源站 ..."
try {
	& (Join-Path $PSScriptRoot "deploy-local.ps1") -SkipBuild:$SkipBuild
} catch {
	throw "Git push succeeded, but VPS deployment failed. Retry with 'pnpm run deploy'; no new commit is needed. $($_.Exception.Message)"
}

$commit = (& git -C $repoRoot rev-parse --short HEAD | Out-String).Trim()
Write-Host ""
Write-Host "完成：$commit 已推送到 origin/$branch 并发布到源站。"
