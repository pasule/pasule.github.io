const { spawn } = require('node:child_process');

const env = {
  ...process.env,
  GIT_CONFIG_COUNT: '3',
  GIT_CONFIG_KEY_0: 'http.proxy',
  GIT_CONFIG_VALUE_0: '',
  GIT_CONFIG_KEY_1: 'https.proxy',
  GIT_CONFIG_VALUE_1: '',
  GIT_CONFIG_KEY_2: 'http.version',
  GIT_CONFIG_VALUE_2: 'HTTP/1.1'
};

const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npx';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx hexo deploy'] : ['hexo', 'deploy'];

const child = spawn(command, args, {
  stdio: 'inherit',
  env,
  shell: false
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', error => {
  console.error('Failed to start Hexo deploy with fixed Git transport settings.');
  console.error(error);
  process.exit(1);
});
