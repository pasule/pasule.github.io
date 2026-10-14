[CmdletBinding()]
param(
	[Parameter(Mandatory = $true)]
	[ValidatePattern("^[a-zA-Z0-9.-]+$")]
	[string]$ServerHost,

	[Parameter(Mandatory = $true)]
	[string]$IdentityFile,

	[ValidatePattern("^[a-zA-Z_][a-zA-Z0-9_-]*$")]
	[string]$RemoteUser = "root",

	[switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$identityPath = (Resolve-Path -LiteralPath $IdentityFile).Path
$distPath = Join-Path $projectRoot "dist"
$sshTarget = "${RemoteUser}@${ServerHost}"
$sshOptions = @("-i", $identityPath, "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", "-o", "ConnectTimeout=10", "-o", "StrictHostKeyChecking=accept-new")
$sshCommand = (Get-Command ssh -CommandType Application).Source
$scpCommand = (Get-Command scp -CommandType Application).Source
$tarCommand = (Get-Command tar -CommandType Application).Source

Push-Location $projectRoot
try {
	if (-not $SkipBuild) {
		& pnpm build
		if ($LASTEXITCODE -ne 0) { throw "Site build failed." }
	}
	foreach ($requiredFile in @("index.html", "friends/index.html", "guestbook/index.html", "404.html", "pagefind/pagefind.js")) {
		if (-not (Test-Path -LiteralPath (Join-Path $distPath $requiredFile) -PathType Leaf)) {
			throw "Missing build output: $requiredFile"
		}
	}
	$commit = (& git rev-parse --short HEAD).Trim()
	if ($LASTEXITCODE -ne 0 -or $commit -notmatch "^[a-f0-9]+$") { throw "Cannot identify the source commit." }
	$releaseId = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ") + "-" + $commit + "-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
	$archiveDirectory = Join-Path ([IO.Path]::GetTempPath()) ("codex-pasule-origin-" + $releaseId)
	New-Item -ItemType Directory -Path $archiveDirectory | Out-Null
	$archivePath = Join-Path $archiveDirectory "site.tar.gz"
	& $tarCommand -czf $archivePath -C $distPath .
	if ($LASTEXITCODE -ne 0) { throw "Cannot package the build output." }
	$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()

	$prepareScript = @'
set -eu
deploy_root=/www/wwwroot/pasule.com
[ "$(readlink -f "$deploy_root")" = "$deploy_root" ] || { printf 'Unexpected web root.\n' >&2; exit 1; }
mkdir -p "$deploy_root/releases" "$deploy_root/shared/_astro"
mktemp -d "$deploy_root/releases/.upload.XXXXXX"
'@
	$uploadDirectory = (& $sshCommand @sshOptions $sshTarget $prepareScript | Out-String).Trim()
	if ($LASTEXITCODE -ne 0 -or $uploadDirectory -notmatch "^/www/wwwroot/pasule\.com/releases/\.upload\.[a-zA-Z0-9]+$") {
		throw "Cannot create the remote upload directory."
	}
	& $scpCommand @sshOptions $archivePath "${sshTarget}:${uploadDirectory}/site.tar.gz"
	if ($LASTEXITCODE -ne 0) { throw "Uploading the site failed." }

	$activateScript = @'
set -eu
deploy_root=/www/wwwroot/pasule.com
deploy_upload=__UPLOAD__
deploy_release="$deploy_root/releases/__RELEASE__"
deploy_expected=__HASH__
deploy_actual=$(sha256sum "$deploy_upload/site.tar.gz" | awk '{print $1}')
[ "$deploy_actual" = "$deploy_expected" ] || { printf 'Archive checksum mismatch.\n' >&2; exit 1; }
if tar -tzf "$deploy_upload/site.tar.gz" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    printf 'Unsafe archive member.\n' >&2
    exit 1
fi
[ ! -e "$deploy_release" ] || { printf 'Release already exists.\n' >&2; exit 1; }
mkdir "$deploy_release"
tar --no-same-owner --no-same-permissions -xzf "$deploy_upload/site.tar.gz" -C "$deploy_release"
for deploy_file in index.html friends/index.html guestbook/index.html 404.html pagefind/pagefind.js; do
    [ -s "$deploy_release/$deploy_file" ] || { printf 'Incomplete release.\n' >&2; exit 1; }
done
[ -d "$deploy_release/_astro" ] || { printf 'Missing Astro assets.\n' >&2; exit 1; }
rsync -a "$deploy_release/_astro/" "$deploy_root/shared/_astro/"
if [ -e "$deploy_root/current" ] && [ ! -L "$deploy_root/current" ]; then
    printf 'Current release is not a symlink.\n' >&2
    exit 1
fi
deploy_previous=$(readlink "$deploy_root/current" 2>/dev/null || true)
ln -s "$deploy_release" "$deploy_root/.current-__RELEASE__"
mv -Tf "$deploy_root/.current-__RELEASE__" "$deploy_root/current"
rm -f -- "$deploy_upload/site.tar.gz"
rmdir "$deploy_upload"
printf 'release=%s\nprevious_release=%s\n' "$deploy_release" "$deploy_previous"
'@
	$activateScript = $activateScript.Replace("__UPLOAD__", $uploadDirectory).Replace("__RELEASE__", $releaseId).Replace("__HASH__", $archiveHash)
	& $sshCommand @sshOptions $sshTarget $activateScript
	if ($LASTEXITCODE -ne 0) { throw "Release activation failed; inspect the retained release before retrying." }
	Write-Output "Published source commit $commit to $ServerHost."
}
finally {
	Pop-Location
	if ($archivePath -and (Test-Path -LiteralPath $archivePath)) { Remove-Item -LiteralPath $archivePath }
	if ($archiveDirectory -and (Test-Path -LiteralPath $archiveDirectory)) { Remove-Item -LiteralPath $archiveDirectory }
}
