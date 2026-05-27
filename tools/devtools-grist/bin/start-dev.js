import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..', '..');
const platform = os.platform();

console.log(`🚀  Launching environment from root: ${rootDir}`);
console.log(`💻  Detected OS: ${platform}`);

// Vos commandes de dev
const cmd1 = 'pnpm dev:devtools';
const cmd2 = 'pnpm test:devtools';
const suggestedCommands = [
    'pnpm run:devtools:react',
    'pnpm run:devtools:react-ts',
    'pnpm run:devtools:vanilla',
    'pnpm run:devtools:vanilla-ts'
];

const supportedPlatforms = ['win32', 'darwin', 'linux'];
if (!supportedPlatforms.includes(platform)) {
    console.error(`❌ Error during startup: Unsupported operating system: ${platform}`);
    process.exit(1);
}

try {
    if (platform === 'win32') {
        const tab1 = `cmd /k "${cmd1}"`;
        const tab2 = `cmd /k "${cmd2}"`;

        const suggestedCommandsEchoes = suggestedCommands.map(line => `echo   ➝ ${line}`).join(' && ');
        const tab3 = `cmd /k "echo 👉 Suggested devtools commands: && echo. && ${suggestedCommandsEchoes} && echo."`;

        const wtCommand = `wt -d "${rootDir}" ${tab1} ; nt -d "${rootDir}" ${tab2} ; nt -d "${rootDir}" ${tab3}`;
        await execa(wtCommand, { shell: true });
        console.log('👑  Windows terminal tabs opened successfully!');

    } else if (platform === 'darwin') {
        const suggestedCommandsEchoesUnix = suggestedCommands.map(line => `echo "  ➝ ${line}"`).join(' && ');
        const echoCmd = `echo "👉 Suggested devtools commands:" && echo "" && ${suggestedCommandsEchoesUnix} && echo ""`;
        const appleScript = `
            tell application "Terminal"
                activate
                do script "cd \\"${rootDir}\\" && ${cmd1}"
                do script "cd \\"${rootDir}\\" && ${cmd2}"
                do script "cd \\"${rootDir}\\" && ${echoCmd}"
            end tell
        `;

        await execa('osascript', ['-e', appleScript]);
        console.log('🍎  MacOS terminal windows opened successfully!');

    } else if (platform === 'linux') {
        const suggestedCommandsEchoesUnix = suggestedCommands.map(line => `echo "  ➝ ${line}"`).join(' && ');
        const echoCmd = `echo "👉 Suggested devtools commands:" && echo "" && ${suggestedCommandsEchoesUnix} && echo ""`;

        const terminals = [
            process.env.TERMINAL,      // Priority user env
            'x-terminal-emulator',     // Standard Debian/Ubuntu/Mint
            'gnome-terminal',          // GNOME (Ubuntu par défaut)
            'konsole',                 // KDE
            'xfce4-terminal',          // XFCE
            'alacritty',
            'kitty',
            'xterm'                    // Fallback
        ].filter(Boolean);

        let activeTerminal = null;
        for (const t of terminals) {
            try {
                await execa('command', ['-v', t], { shell: true });
                activeTerminal = t;
                break;
            } catch (e) {
                // Ignore errors, tests another terminal
            }
        }

        if (!activeTerminal) {
            console.error('❌ Error during startup: 🐧 No supported terminal emulator was found on this Linux system.');
            process.exit(1);
        }

        console.log(`🐧  Linux terminal detected: ${activeTerminal}`);

        const commandsToRun = [
            `${cmd1}; exec bash`,
            `${cmd2}; exec bash`,
            `${echoCmd}; exec bash`
        ];

        if (activeTerminal) {
            for (const cmd of commandsToRun) {
                let execArg = '-e';
                if (activeTerminal === 'gnome-terminal' || activeTerminal === 'alacritty' || activeTerminal === 'kitty') {
                    execArg = '--';
                }
                execa(activeTerminal, [execArg, 'bash', '-c', cmd], {
                    cwd: rootDir,
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }
        }

        console.log('🐧  Linux terminal opened successfully!');
    }
} catch (error) {
    console.error('❌ Error during startup:', error.message);
}