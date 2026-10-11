import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';

function startProcess(command, args, extraEnv = {}) {
    return spawn(command, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, ...extraEnv },
    });
}

function isPortOpen(port) {
    return new Promise(resolve => {
        const socket = net.createConnection({ host: '127.0.0.1', port });
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => resolve(false));
    });
}

const vite = isWindows
    ? startProcess('cmd.exe', ['/d', '/s', '/c', 'npx vite --host 127.0.0.1 --port 5173'])
    : startProcess('npx', ['vite', '--host', '127.0.0.1', '--port', '5173']);

let server;
let pptService;

async function startBackendIfNeeded() {
    const running = await isPortOpen(3001);
    if (running) {
        console.log('API server already running on port 3001');
        return;
    }

    server = startProcess(process.execPath, ['server/index.js'], { API_PORT: '3001' });

    server.on('exit', code => {
        if (code && code !== 0) {
            console.error(`API server exited with code ${code}`);
        }
    });
}

async function startPptServiceIfNeeded() {
    const running = await isPortOpen(8001);
    if (running) {
        console.log('PPT service already running on port 8001');
        return;
    }

    const pptDir = path.join(projectRoot, 'ppt-service');
    const runScript = path.join(pptDir, 'run.py');
    pptService = spawn('python', [runScript], {
        cwd: pptDir,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env },
    });

    pptService.on('exit', code => {
        if (code && code !== 0) {
            console.error(`PPT service exited with code ${code}`);
        }
    });
}

startBackendIfNeeded();
startPptServiceIfNeeded();

vite.on('exit', code => {
    if (code && code !== 0) {
        if (server) server.kill('SIGTERM');
        if (pptService) pptService.kill('SIGTERM');
        process.exit(code);
    }
});
