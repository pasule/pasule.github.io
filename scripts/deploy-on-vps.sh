#!/usr/bin/env bash
# Publish a build on the same host, without SSH/SCP or artifact downloads.
set -euo pipefail
umask 002
source_commit=${1:?Usage: bash scripts/deploy-on-vps.sh COMMIT_SHA}
[[ "$source_commit" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid source commit.' >&2; exit 1; }
[[ $(git rev-parse HEAD) == "$source_commit" ]] || { echo 'Checkout does not match deployment commit.' >&2; exit 1; }
for file in index.html friends/index.html guestbook/index.html 404.html pagefind/pagefind.js deployment.json; do
	[[ -s "dist/$file" ]] || { echo "Missing build output: $file" >&2; exit 1; }
done
grep -Fxq "{\"commit\":\"$source_commit\"}" dist/deployment.json || { echo 'Build marker does not match checkout.' >&2; exit 1; }
[[ -d dist/_astro ]] || { echo 'Missing Astro assets.' >&2; exit 1; }
if [[ ${2:-} == --check ]]; then
	echo "Build is ready to publish: $source_commit"
	exit 0
fi
deploy_root=/www/wwwroot/pasule.com
[[ $(readlink -f "$deploy_root") == "$deploy_root" ]] || { echo 'Unexpected deployment root.' >&2; exit 1; }
[[ -L "$deploy_root/current" ]] || { echo 'Current release must be a symlink.' >&2; exit 1; }
exec 9>"$deploy_root/.runner-deploy.lock"
flock -w 120 9
while IFS= read -r -d '' directory; do
	shared_directory="$deploy_root/shared/_astro${directory#dist/_astro}"
	if [[ -d "$shared_directory" && ! -w "$shared_directory" ]]; then
		echo "Shared asset directory is not writable: $shared_directory" >&2
		exit 1
	fi
done < <(find dist/_astro -type d -print0)
previous_release=$(readlink "$deploy_root/current")
[[ "$previous_release" == "$deploy_root/releases/"* && -d "$previous_release" ]] || { echo 'Unexpected current release target.' >&2; exit 1; }
release=$(mktemp -d "$deploy_root/releases/$(date -u +%Y%m%dT%H%M%SZ)-${source_commit:0:12}.XXXXXX")
chmod 755 "$release"
rsync -r --no-perms --no-owner --no-group dist/ "$release/"
rsync -r --checksum --no-perms --no-owner --no-group --chmod=Dg+w,Dg+s "$release/_astro/" "$deploy_root/shared/_astro/"
switch_link="$deploy_root/.current-${release##*/}"
ln -s "$release" "$switch_link"
mv -Tf "$switch_link" "$deploy_root/current"
verified=false
rollback() {
	if [[ "$verified" != true && $(readlink "$deploy_root/current") == "$release" ]]; then
		ln -s "$previous_release" "$switch_link"
		mv -Tf "$switch_link" "$deploy_root/current"
		echo "Verification failed; restored $previous_release. New release retained: $release" >&2
	fi
}
trap rollback EXIT
expected="{\"commit\":\"$source_commit\"}"
for attempt in 1 2 3 4 5; do
	actual=$(curl --fail --silent --show-error --noproxy '*' --resolve pasule.com:443:127.0.0.1 \
		--connect-timeout 5 --max-time 15 \
		--header 'Cache-Control: no-cache' \
		"https://pasule.com/deployment.json?commit=$source_commit&attempt=$attempt") || actual=''
	if [[ "$actual" == "$expected" ]]; then
		verified=true
		printf 'Published commit=%s\nrelease=%s\nprevious_release=%s\n' "$source_commit" "$release" "$previous_release"
		exit 0
	fi
	sleep 2
done
echo 'Origin did not return this commit.' >&2
exit 1
