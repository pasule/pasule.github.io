#!/usr/bin/env bash
# Run as root on Ubuntu 22.04; registration is a separate interactive step.
set -euo pipefail
[[ $(id -u) == 0 && $(uname -m) == x86_64 ]] || { echo 'Requires root and x86_64.' >&2; exit 1; }
export https_proxy=http://172.30.89.1:17897
export http_proxy=$https_proxy
export no_proxy=localhost,pasule.com
runner_user=pasule-runner
runner_dir=/opt/pasule-runner
tools_dir=/opt/pasule-tools
deploy_root=/www/wwwroot/pasule.com
node_version=22.23.3
node_sha=df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de
runner_version=2.338.0
runner_sha=af4b794c1bc41d73d40535e3fe092a39f9679cd8d965954c2aca25a05ca41d32
[[ $(readlink -f "$deploy_root") == "$deploy_root" ]] || { echo 'Unexpected deployment root.' >&2; exit 1; }
if ! id "$runner_user" >/dev/null 2>&1; then
	useradd --create-home --home-dir /home/pasule-runner --shell /bin/bash "$runner_user"
fi
install -d -m 755 "$tools_dir"
install -d -m 755 -o "$runner_user" -g "$runner_user" "$runner_dir"
download_dir=$(mktemp -d /opt/pasule-tools/download.XXXXXX)
trap 'rmdir "$download_dir" 2>/dev/null || true' EXIT
download() {
	curl --fail --location --retry 3 --connect-timeout 10 --max-time 600 --output "$2" "$1"
}
echo 'Installing checksum-verified Node.js...'
node_archive="node-v${node_version}-linux-x64.tar.xz"
if [[ ! -x "$tools_dir/node-v${node_version}-linux-x64/bin/node" ]]; then
	download "https://nodejs.org/dist/v${node_version}/$node_archive" "$download_dir/$node_archive"
	printf '%s  %s\n' "$node_sha" "$download_dir/$node_archive" | sha256sum --check --status
	tar -xJf "$download_dir/$node_archive" -C "$tools_dir"
	rm -f -- "$download_dir/$node_archive"
fi
for tool in node npm npx; do
	destination="/usr/local/bin/$tool"
	target="$tools_dir/node-v${node_version}-linux-x64/bin/$tool"
	if [[ -e "$destination" || -L "$destination" ]]; then
		[[ $(readlink "$destination") == "$target" ]] || { echo "Existing $destination: refusing to overwrite." >&2; exit 1; }
	else
		ln -s "$target" "$destination"
	fi
done
export PATH=/usr/local/bin:$PATH
if [[ ! -x "$tools_dir/pnpm/bin/pnpm" ]]; then
	npm install --global --prefix "$tools_dir/pnpm" pnpm@9.14.4 --registry=https://registry.npmjs.org
fi
if [[ ! -e /usr/local/bin/pnpm && ! -L /usr/local/bin/pnpm ]]; then
	ln -s "$tools_dir/pnpm/bin/pnpm" /usr/local/bin/pnpm
fi
[[ $(pnpm --version) == 9.14.4 ]] || { echo 'Unexpected pnpm version.' >&2; exit 1; }
echo 'Installing checksum-verified GitHub Actions runner...'
if [[ ! -x "$runner_dir/bin/Runner.Listener" ]]; then
	runner_archive="actions-runner-linux-x64-${runner_version}.tar.gz"
	download "https://github.com/actions/runner/releases/download/v${runner_version}/$runner_archive" "$download_dir/$runner_archive"
	printf '%s  %s\n' "$runner_sha" "$download_dir/$runner_archive" | sha256sum --check --status
	tar -xzf "$download_dir/$runner_archive" -C "$runner_dir"
	rm -f -- "$download_dir/$runner_archive"
	chown -R "$runner_user:$runner_user" "$runner_dir"
fi
# Avoid unnecessary apt changes when the .NET runner already starts correctly.
if ! runuser -u "$runner_user" -- "$runner_dir/bin/Runner.Listener" --version; then
	no_proxy="$no_proxy,mirrors.jdcloudcs.com" "$runner_dir/bin/installdependencies.sh"
fi
if [[ ! -e "$runner_dir/.env" ]]; then
	printf '%s\n' 'https_proxy=http://172.30.89.1:17897' 'http_proxy=http://172.30.89.1:17897' \
		'no_proxy=localhost,pasule.com' 'NODE_OPTIONS=--max-old-space-size=1536' > "$runner_dir/.env"
	chown "$runner_user:$runner_user" "$runner_dir/.env"
	chmod 600 "$runner_dir/.env"
fi
# Grant access only to this site's release directories, without sudo privileges.
for directory in "$deploy_root" "$deploy_root/releases" "$deploy_root/shared" "$deploy_root/shared/_astro"; do
	chgrp "$runner_user" "$directory"
	chmod g+rws "$directory"
done
# Existing root-owned fonts/assets directories also need group write access.
find "$deploy_root/shared/_astro" -type d -exec chgrp "$runner_user" {} + -exec chmod g+rws {} +
runuser -u "$runner_user" -- git config --global http.proxy "$https_proxy"
runuser -u "$runner_user" -- bash -c 'cd /home/pasule-runner && pnpm config set registry https://registry.npmjs.org --global'
echo "Installed: node $(node --version), pnpm $(pnpm --version)."
echo "Runner directory: $runner_dir; user: $runner_user. Registration is still required."
