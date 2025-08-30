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

  async runPythonSubmission({ exercise, tests, code } : { exercise: Exercise, tests: ExerciseTest[], code: string }) {
    // Prepare temp dir
    const tmp = path.join(os.tmpdir(), `cryptonexus-run-${uuidv4()}`);
    await fs.mkdir(tmp, { recursive: true });

    // Write user code
    const userFile = path.join(tmp, 'user_solution.py');
    await fs.writeFile(userFile, code, { encoding: 'utf8' });

    // Write runner.py harness
    const harness = this.makeHarness(tests, exercise.timeoutSec || 3);
    const harnessFile = path.join(tmp, 'runner.py');
    await fs.writeFile(harnessFile, harness, { encoding: 'utf8' });

    // Command to run harness inside an ephemeral Python container with no network.
    // IMPORTANT: this requires docker socket access from the container running this code (development only)
    const dockerCmd = 'docker';
    const dockerArgs = [
      'run', '--rm',
      '-v', `${tmp}:/work:ro`,
      '-w', '/work',
      '--network', 'none',
      '--memory', '256m',
      '--cpus', '0.5',
      'python:3.11-slim',
      'bash', '-lc', `timeout ${Math.max(5, (exercise.timeoutSec || 3) * tests.length + 2)}s python3 runner.py`
    ];

    try {
      const { stdout, stderr } = await execFileAsync(dockerCmd, dockerArgs, { timeout: 30_000 });
      // harness prints JSON to stdout
      const parsed = JSON.parse(stdout || '{}');
      return { status: parsed.status || 'error', details: parsed };
    } catch (err: any) {
      this.logger.error('Runner error', err?.message || err);
      return { status: 'error', error: err?.message || String(err) };
    } finally {
      // best-effort cleanup (do not throw)
      try { await fs.rm(tmp, { recursive: true, force: true }); } catch(e) {}
    }
  }

  makeHarness(tests: ExerciseTest[], perTestTimeout: number) {
    // harness will run user_solution.py with each input and compare stdout to expected string
    // produce a JSON with per-test results
    const testsLiteral = JSON.stringify(tests.map(t => ({ input: t.input, expected: t.expected })));
    return `import json\nimport subprocess\nimport sys\n\nTESTS = ${testsLiteral}\n\nresults = []\nall_ok = True\nfor i, t in enumerate(TESTS):\n    try:\n        proc = subprocess.run([sys.executable, 'user_solution.py'], input=t['input'].encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=${perTestTimeout}, check=False)\n        out = proc.stdout.decode('utf-8').strip()\n        err = proc.stderr.decode('utf-8')\n        ok = out.strip() == t['expected'].strip()\n        if not ok: all_ok = False\n        results.append({ 'idx': i, 'ok': ok, 'stdout': out, 'stderr': err, 'expected': t['expected'] })\n    except subprocess.TimeoutExpired as e:\n        all_ok = False\n        results.append({ 'idx': i, 'ok': False, 'stdout': '', 'stderr': 'timeout' })\n    except Exception as e:\n        all_ok = False\n        results.append({ 'idx': i, 'ok': False, 'stdout': '', 'stderr': 'error: ' + str(e) })\n\nprint(json.dumps({ 'status': 'ok' if all_ok else 'failed', 'results': results }))\n`;
  }
}