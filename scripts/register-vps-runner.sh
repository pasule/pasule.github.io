#!/usr/bin/env bash
# Run interactively as root on the VPS. The registration token is not saved.
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo 'Run as root.' >&2; exit 1; }
cd /opt/pasule-runner
export https_proxy=http://172.30.89.1:17897
export http_proxy=$https_proxy
export no_proxy=localhost,pasule.com
if [[ ! -f .runner ]]; then
	read -r -s -p 'GitHub runner registration token (input hidden): ' runner_token
	printf '\n'
	[[ -n "$runner_token" ]] || { echo 'Empty registration token.' >&2; exit 1; }
	runuser -u pasule-runner -- env \
		https_proxy="$https_proxy" http_proxy="$http_proxy" no_proxy="$no_proxy" \
		./config.sh --unattended --url https://github.com/pasule/pasule.github.io \
		--token "$runner_token" --name pasule-vps --labels pasule-vps --work _work
	unset runner_token
fi
if [[ ! -f .service ]]; then
	./svc.sh install pasule-runner
fi
./svc.sh start
./svc.sh status
