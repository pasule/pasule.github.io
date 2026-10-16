[CmdletBinding()]
param(
	[Parameter(Mandatory = $true)]
	[ValidatePattern("^[a-zA-Z0-9.-]+$")]
	[string]$ServerHost,

	[Parameter(Mandatory = $true)]
	[string]$IdentityFile,

	[ValidateRange(1, 65535)]
	[int]$ServerPort = 22,

	[ValidatePattern("^[a-zA-Z_][a-zA-Z0-9_-]*$")]
	[string]$RemoteUser = "root",

	[switch]$RequireKnownHost,

	[switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$identityPath = (Resolve-Path -LiteralPath $IdentityFile).Path
$distPath = Join-Path $projectRoot "dist"
$sshTarget = "${RemoteUser}@${ServerHost}"
$hostKeyPolicy = if ($RequireKnownHost) { "yes" } else { "accept-new" }
$commonConnectionOptions = @("-i", $identityPath, "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", "-o", "ConnectTimeout=10", "-o", "StrictHostKeyChecking=$hostKeyPolicy")
$sshOptions = @($commonConnectionOptions) + @("-p", $ServerPort)
$scpOptions = @($commonConnectionOptions) + @("-P", $ServerPort)
# PATH may expose the same application through multiple directories (e.g. /usr/bin and /bin).
# The call operator requires a single executable path, not an array of matches.
#
# On Windows, a PATH inherited from a Git Bash / MSYS terminal also exposes Git's usr\bin,
# whose tar reads "C:\..." as the "host:path" remote syntax and fails with
# "Cannot connect to C: resolve failed". Put the native tools first so that ssh, scp and
# tar all resolve to the Windows implementations. No-op on other platforms.
if ($env:OS -eq "Windows_NT" -and $env:SystemRoot) {
	$system32 = Join-Path $env:SystemRoot "System32"
	$nativeBinDirectories = @($system32, (Join-Path $system32 "OpenSSH")) | Where-Object { Test-Path -LiteralPath $_ -PathType Container }
	$env:PATH = (@($nativeBinDirectories) + @($env:PATH)) -join ";"
}
$sshCommand = (Get-Command ssh -CommandType Application | Select-Object -First 1).Source
$scpCommand = (Get-Command scp -CommandType Application | Select-Object -First 1).Source
$tarCommand = (Get-Command tar -CommandType Application | Select-Object -First 1).Source

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
umask 002
deploy_root=/www/wwwroot/pasule.com
[ "$(readlink -f "$deploy_root")" = "$deploy_root" ] || { printf 'Unexpected web root.\n' >&2; exit 1; }
mkdir -p "$deploy_root/releases" "$deploy_root/shared/_astro"
mktemp -d "$deploy_root/releases/.upload.XXXXXX"
'@
	$uploadDirectory = (& $sshCommand @sshOptions $sshTarget $prepareScript | Out-String).Trim()
	$prepareExitCode = $LASTEXITCODE
	if ($prepareExitCode -ne 0) {
		if ($uploadDirectory) {
			Write-Host "Remote preparation output:"
			Write-Host $uploadDirectory
		}
		throw "Remote preparation failed (SSH exit code $prepareExitCode). Check the SSH/server error above."
	}
	if ($uploadDirectory -notmatch "^/www/wwwroot/pasule\.com/releases/\.upload\.[a-zA-Z0-9]+$") {
		Write-Host "Unexpected remote preparation output:"
		Write-Host $uploadDirectory
		throw "SSH succeeded, but did not return a valid upload directory. Upload was not attempted."
	}
	& $scpCommand @scpOptions $archivePath "${sshTarget}:${uploadDirectory}/site.tar.gz"
	if ($LASTEXITCODE -ne 0) { throw "Uploading the site failed." }

	$activateScript = @'
set -eu
umask 002
deploy_root=/www/wwwroot/pasule.com
deploy_upload=__UPLOAD__
deploy_release="$deploy_root/releases/__RELEASE__"
deploy_expected=__HASH__
exec 9>"$deploy_root/.runner-deploy.lock"
flock -w 120 9
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
# Keep shared ownership/modes; new directories must remain writable by the runner group.
rsync -r --checksum --no-perms --no-owner --no-group --chmod=Dg+w,Dg+s "$deploy_release/_astro/" "$deploy_root/shared/_astro/"
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
