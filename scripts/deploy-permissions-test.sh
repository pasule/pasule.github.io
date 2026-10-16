#!/usr/bin/env bash
# Run as root on Linux: exercise the actual shared-asset rsync flags as root and the runner.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run this integration test as root.' >&2; exit 1; }
runner=${1:-pasule-runner}
runner_group=$(id -gn "$runner")
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
fixture=$(mktemp -d /tmp/pasule-deploy-permissions.XXXXXX)
cleanup() {
	# Delete only this test's resolved temporary directory, never a deployment directory.
	if [[ "$fixture" == /tmp/pasule-deploy-permissions.* && $(readlink -f "$fixture") == "$fixture" ]]; then
		rm -rf -- "$fixture"
	fi
}
trap cleanup EXIT
chmod 755 "$fixture"

assert_directory() {
	local directory=$1 mode
	mode=$(stat -c '%a' "$directory")
	[[ $(stat -c '%G' "$directory") == "$runner_group" ]] || { echo "Wrong group: $directory" >&2; exit 1; }
	(( (8#$mode & 02020) == 02020 )) || { echo "Missing group-write/setgid permission: $directory ($mode)" >&2; exit 1; }
	(( (8#$mode & 00002) == 0 )) || { echo "World-writable directory: $directory" >&2; exit 1; }
	runuser -u "$runner" -- test -w "$directory"
}

for deployment_script in deploy-origin.ps1 deploy-on-vps.sh; do
	# Extract only the executable/flags, not shell variable expressions; no eval is used.
	sync_prefix=$(awk '/^[[:space:]]*rsync .*shared\/_astro/ { sub(/^[[:space:]]*/, ""); sub(/ "\$.*/, ""); print; exit }' "$script_dir/$deployment_script")
	read -r -a sync_command <<< "$sync_prefix"
	[[ ${sync_command[0]:-} == rsync && ${#sync_command[@]} -gt 1 ]] || { echo "Shared sync command not found: $deployment_script" >&2; exit 1; }
	source_dir="$fixture/$deployment_script/source"
	target_dir="$fixture/$deployment_script/shared"
	mkdir -p "$source_dir/fonts/new"
	chmod 755 "$fixture/$deployment_script" "$source_dir" "$source_dir/fonts" "$source_dir/fonts/new"
	install -d -m 2775 -g "$runner_group" "$target_dir" "$target_dir/fonts"
	printf 'original\n' > "$source_dir/app.js"
	printf 'font\n' > "$source_dir/fonts/new/font.woff2"
	chmod 644 "$source_dir/app.js" "$source_dir/fonts/new/font.woff2"

	# A privileged manual deploy must preserve existing modes and create writable subdirectories.
	(umask 002; "${sync_command[@]}" "$source_dir/" "$target_dir/")
	for directory in "$target_dir" "$target_dir/fonts" "$target_dir/fonts/new"; do
		assert_directory "$directory"
	done

	# The runner must be able to replace a root-owned asset, not merely create a fresh one.
	printf 'runner update\n' > "$source_dir/app.js"
	runuser -u "$runner" -- bash -c 'umask 002; "$@"' bash "${sync_command[@]}" "$source_dir/" "$target_dir/"
	cmp "$source_dir/app.js" "$target_dir/app.js"

	# Another manual deploy must neither change ownership nor remove the runner's access.
	printf 'manual update after runner\n' > "$source_dir/app.js"
	(umask 002; "${sync_command[@]}" "$source_dir/" "$target_dir/")
	[[ $(stat -c '%U' "$target_dir") == root ]]
	assert_directory "$target_dir"
	assert_directory "$target_dir/fonts/new"
	printf 'runner final update\n' > "$source_dir/app.js"
	runuser -u "$runner" -- bash -c 'umask 002; "$@"' bash "${sync_command[@]}" "$source_dir/" "$target_dir/"
	cmp "$source_dir/app.js" "$target_dir/app.js"
	grep -q 'umask 002' "$script_dir/$deployment_script"
	printf 'PASS: %s preserves shared permissions across root/runner deployments.\n' "$deployment_script"
done
