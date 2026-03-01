import type { Tool } from '../types.js';

const TIMEOUT_MS = 30_000;

export const shellExecTool: Tool = {
  definition: {
    name: 'shell_exec',
    description: 'Execute a shell command and return its output (stdout + stderr). Timeout is 30 seconds.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command (defaults to current working directory)',
        },
      },
      required: ['command'],
    },
  },
  permission: 'ask',
  async execute(args) {
    const command = args.command as string;
    const cwd = (args.cwd as string) || process.cwd();

    const proc = Bun.spawn(['sh', '-c', command], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const timer = setTimeout(() => {
      proc.kill();
    }, TIMEOUT_MS);

    try {
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      const exitCode = await proc.exited;
      clearTimeout(timer);

      const parts: string[] = [];
      if (stdout) parts.push(`stdout:\n${stdout}`);
      if (stderr) parts.push(`stderr:\n${stderr}`);
      parts.push(`exit code: ${exitCode}`);

      return parts.join('\n');
    } catch {
      clearTimeout(timer);
      throw new Error(`Command timed out after ${TIMEOUT_MS}ms`);
    }
  },
};
