// ✅ CommonJS 방식 임포트 (맨 위에 위치해야 함)
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const localtunnel = require('localtunnel');
const { execSync, spawn } = require('child_process');

// 나머지 코드 ↓ 여기에 계속 작성
dotenv.config();

// 예: 환경변수 로드
const MYSQL_PASSWORD = process.env.MYSQL_ROOT_PASSWORD || 'root';
const TUNNEL_PORT = Number(process.env.TUNNEL_PORT) || 8000;
const SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || 'mycarering';

// 예: __dirname 사용 (Node.js에서 자동 제공)
const PYTHON_PATH = path.resolve(__dirname, '../venv/bin/python3');
let tunnel: any; // 타입 오류 방지

function waitForMysqlContainer() {
  console.log('⏳ Waiting for MySQL to be ready...');
  let ready = false;
  const maxRetries = 20;

  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(
        `docker exec carering-mysql mysqladmin ping -h127.0.0.1 -uroot -p${MYSQL_PASSWORD}`,
        { stdio: 'ignore' }
      );
      ready = true;
      console.log('✅ MySQL is ready!');
      break;
    } catch {
      console.log(`🔄 MySQL not ready yet... [${i + 1}/${maxRetries}]`);
      execSync('sleep 2');
    }
  }

  if (!ready) {
    throw new Error('❌ MySQL failed to become ready.');
  }
}

async function startTunnelWithRetry(retries = 5): Promise<any> {
  for (let i = 1; i <= retries; i++) {
    try {
      tunnel = await localtunnel({ port: TUNNEL_PORT, subdomain: SUBDOMAIN });
      console.log(`✅ Tunnel is running at: ${tunnel.url}`);
      return tunnel;
    } catch (err) {
      console.error(`❌ Tunnel connection failed [${i}/${retries}]`, err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('❌ Failed to establish tunnel after multiple attempts.');
}

async function startEverything() {
  try {
    console.log('🚀 Starting Docker MySQL container...');
    execSync('docker start carering-mysql', { stdio: 'inherit' });

    waitForMysqlContainer();

    const PYTHON_PATH = path.resolve(__dirname, '../venv/bin/python3');
    if (!fs.existsSync(PYTHON_PATH)) {
      throw new Error(`❌ Python 실행 파일을 찾을 수 없습니다: ${PYTHON_PATH}`);
    }

    console.log('⚙️ Starting FastAPI server...');
    const fastapi = spawn(
      PYTHON_PATH,
      ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', `${TUNNEL_PORT}`],
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      }
    );

    tunnel = await startTunnelWithRetry();

    tunnel.on('close', () => {
      console.log('❌ Tunnel closed');
    });

    tunnel.on('error', (err: any) => {
      console.error('❌ Tunnel error:', err);
    });

    fastapi.on('close', (code: number) => {
  console.log(`❌ FastAPI 종료됨. code: ${code}`);
  tunnel?.close?.();
});

  } catch (err) {
    console.error('❌ 전체 실행 중 오류 발생:', err);
  }
}

// 종료 시 터널 닫기
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Closing tunnel and exiting...');
  tunnel?.close?.();
  process.exit();
});

startEverything();