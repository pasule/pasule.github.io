<#
	本机一键发布到源站 pasule.com。

	用法:
		pnpm run deploy            先构建，再发布（默认，安全）
		pnpm run deploy:fast       跳过构建，直传现有 dist（使用前确认构建产物已更新）
		pnpm run deploy -Check     只校验参数解析，不执行部署

	注意要用 "pnpm run deploy" 而不是 "pnpm deploy"：后者是 pnpm 的内置命令
	（Deploy a package from a workspace），会把同名的 script 抢走。

	可用环境变量覆盖默认值:
		PASULE_VPS_HOST   目标服务器地址
		PASULE_SSH_KEY    私钥路径
		PASULE_VPS_USER   登录用户（默认 root）
		PASULE_VPS_PORT   SSH 端口（默认 22）
#>
[CmdletBinding()]
param(
	[switch]$SkipBuild,
	[switch]$Check
)

$ErrorActionPreference = "Stop"

$serverHost = if ($env:PASULE_VPS_HOST) { $env:PASULE_VPS_HOST } else { "111.228.14.115" }
$identityFile = if ($env:PASULE_SSH_KEY) { $env:PASULE_SSH_KEY } else { Join-Path ([Environment]::GetFolderPath("UserProfile")) ".ssh/id_ed25519" }
$remoteUser = if ($env:PASULE_VPS_USER) { $env:PASULE_VPS_USER } else { "root" }
$serverPort = if ($env:PASULE_VPS_PORT) { [int]$env:PASULE_VPS_PORT } else { 22 }

if ($serverHost -notmatch "^[a-zA-Z0-9.-]+$" -or $remoteUser -notmatch "^[a-zA-Z_][a-zA-Z0-9_-]*$" -or $serverPort -lt 1 -or $serverPort -gt 65535) {
	throw "Invalid VPS host, user, or port."
}

if (-not (Test-Path -LiteralPath $identityFile -PathType Leaf)) {
	throw "找不到私钥：$identityFile`n可用环境变量 PASULE_SSH_KEY 指定其它路径。"
}

if ($Check) {
	Write-Host "serverHost   = $serverHost"
	Write-Host "identityFile = $identityFile"
	Write-Host "remoteUser   = $remoteUser"
	Write-Host "serverPort   = $serverPort"
	Write-Host "skipBuild    = $([bool]$SkipBuild)"
	Write-Host "参数解析正常，未执行部署。"
	return
}

& (Join-Path $PSScriptRoot "deploy-origin.ps1") `
	-ServerHost $serverHost `
	-IdentityFile $identityFile `
	-RemoteUser $remoteUser `
	-ServerPort $serverPort `
	-SkipBuild:$SkipBuild
