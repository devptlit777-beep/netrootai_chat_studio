// import { spawn } from 'node:child_process';
// import net from 'node:net';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const projectRoot = path.resolve(__dirname, '..');

// const isWindows = process.platform === 'win32';

// function startProcess(command, args, extraEnv = {}) {
//     return spawn(command, args, {
//         cwd: projectRoot,
//         stdio: 'inherit',
//         shell: false,
//         env: { ...process.env, ...extraEnv },
//     });
// }

// function isPortOpen(port) {
//     return new Promise(resolve => {
//         const socket = net.createConnection({ host: '127.0.0.1', port });
//         socket.once('connect', () => {
//             socket.destroy();
//             resolve(true);
//         });
//         socket.once('error', () => resolve(false));
//     });
// }

// const vite = isWindows
//     ? startProcess('cmd.exe', ['/d', '/s', '/c', 'npx vite --host 127.0.0.1 --port 5173'])
//     : startProcess('npx', ['vite', '--host', '127.0.0.1', '--port', '5173']);

// let server;

// async function startBackendIfNeeded() {
//     const running = await isPortOpen(3001);
//     if (running) {
//         console.log('API server already running on port 3001');
//         return;
//     }

//     server = startProcess(process.execPath, ['server/index.js'], { API_PORT: '3001' });

//     server.on('exit', code => {
//         if (code && code !== 0) {
//             console.error(`API server exited with code ${code}`);
//         }
//     });
// }

// startBackendIfNeeded();

// vite.on('exit', code => {
//     if (code && code !== 0) {
//         if (server) server.kill('SIGTERM');
//         process.exit(code);
//     }
// });


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

startBackendIfNeeded();

vite.on('exit', code => {
    if (code && code !== 0) {
        if (server) server.kill('SIGTERM');
        process.exit(code);
    }
});
