const { execSync } = require('child_process');

try {
  console.log('🔍 localtunnel 관련 프로세스 검색 중...');

  // localtunnel 또는 npx localtunnel 명령으로 실행된 node 프로세스 검색
  const output = execSync(`ps aux | grep localtunnel | grep -v grep`).toString();

  const lines = output.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    console.log('✅ 종료할 localtunnel 프로세스가 없습니다.');
    process.exit(0);
  }

  lines.forEach((line) => {
    const columns = line.trim().split(/\s+/);
    const pid = columns[1];
    try {
      process.kill(pid, 'SIGKILL');
      console.log(`🛑 localtunnel 프로세스 종료 완료 (PID: ${pid})`);
    } catch (err) {
      console.error(`❌ 프로세스 종료 실패 (PID: ${pid}):`, err.message);
    }
  });
} catch (err) {
  console.log('✅ 실행 중인 localtunnel 프로세스가 없습니다.');
}