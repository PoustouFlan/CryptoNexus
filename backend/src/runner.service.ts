import { Injectable, Logger } from '@nestjs/common';
import { Exercise, ExerciseTest } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execFileAsync = promisify(execFile);

@Injectable()
export class RunnerService {
  private logger = new Logger('RunnerService');
  private wheelCacheDir = path.resolve('/tmp/python_wheels');

  constructor() {
    fs.mkdir(this.wheelCacheDir, { recursive: true }).catch(() => {});
  }

  async runPythonSubmission({ exercise, tests, code }: { exercise: Exercise, tests: ExerciseTest[], code: string }) {
    const tmp = path.join(os.tmpdir(), `cryptonexus-run-${uuidv4()}`);
    await fs.mkdir(tmp, { recursive: true });

    const userFile = path.join(tmp, 'user_solution.py');
    await fs.writeFile(userFile, code, { encoding: 'utf8' });

    const harness = this.makeHarness(tests, exercise.timeoutSec || 3);
    const harnessFile = path.join(tmp, 'runner.py');
    await fs.writeFile(harnessFile, harness, { encoding: 'utf8' });

    const allowedLibs = exercise.allowedLibs || [];
    const wheelDirs: string[] = [];

    for (const lib of allowedLibs) {
      const libDir = path.join(this.wheelCacheDir, lib);
      wheelDirs.push(libDir);
      if (!(await this.exists(libDir))) {
        this.logger.log(`Building wheel for ${lib}`);
        await fs.mkdir(libDir, { recursive: true });
        try {
          await execFileAsync('docker', [
            'run', '--rm', '-v', `${libDir}:/wheels`, 'python:3.11-slim',
            'bash', '-lc', `pip wheel ${lib} --wheel-dir=/wheels`
          ]);
        } catch (err) {
          this.logger.error(`Failed to build wheel for ${lib}`, err);
        }
      }
    }

    const wheelMounts = wheelDirs.flatMap(d => ['-v', `${d}:/wheels/${path.basename(d)}`]);
    const dockerArgs = [
      'run', '--rm',
      '-v', `${tmp}:/work`,
      ...wheelMounts,
      '-w', '/work',
      '--network', 'none',
      '--memory', '256m',
      '--cpus', '0.5',
      'python:3.11-slim',
      'sh', '-c',
      [
        allowedLibs.map(lib => `pip install --no-index --find-links=/wheels/${lib} ${lib} > /dev/null 2>&1`).join(' && '),
        `timeout ${Math.max(5, (exercise.timeoutSec || 3) * tests.length + 2)}s python3 runner.py`
      ].join(' && ')
    ];


    try {
      this.logger.log(`running docker ${dockerArgs}...`);
      const { stdout } = await execFileAsync('docker', dockerArgs, { timeout: 60_000 });
      const parsed = JSON.parse(stdout || '{}');
      return { status: 'OK', results: parsed.results };
    } catch (err: any) {
      console.log(err);
      return { status: 'ERR', error: err?.message || String(err) };
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  }

  private async exists(p: string) {
    try { await fs.access(p); return true; } catch { return false; }
  }

  makeHarness(tests: ExerciseTest[], perTestTimeout: number) {
    const inputs = JSON.stringify(tests.map(t => ({ input: t.input })));
    return `import json, subprocess, sys
TESTS = ${inputs}
results = []
for i, t in enumerate(TESTS):
  try:
    proc = subprocess.run([sys.executable, 'user_solution.py'], input=t['input'].encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=${perTestTimeout}, check=False)
    results.append({ 'idx': i, 'stdout': proc.stdout.decode(), 'stderr': proc.stderr.decode() })
  except subprocess.TimeoutExpired:
    results.append({ 'idx': i, 'stdout': '', 'stderr': 'timeout' })
print(json.dumps({ 'results': results }))`;
  }
}
