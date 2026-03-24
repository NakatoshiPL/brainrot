const { spawn } = require('child_process');
const cron = require('node-cron');

let pipelineRunning = false;

/** Run a package.json script from repo root (so axios/cheerio in root node_modules resolve). */
function runNpmScript(repoRoot, scriptName) {
  return new Promise((resolve, reject) => {
    const win = process.platform === 'win32';
    const cmd = win ? 'npm.cmd' : 'npm';
    const child = spawn(cmd, ['run', scriptName], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
      shell: win,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run ${scriptName} exited ${code}`));
    });
  });
}

async function runValuesPipeline(repoRoot) {
  await runNpmScript(repoRoot, 'update-values');
  await runNpmScript(repoRoot, 'sync-data');
}

async function runDetectPipeline(repoRoot) {
  await runNpmScript(repoRoot, 'detect-new');
  await runNpmScript(repoRoot, 'sync-data');
}

function scheduleJob(name, expression, task, options) {
  if (!cron.validate(expression)) {
    console.warn(`[auto-update] Invalid cron "${expression}" for ${name}, skipping.`);
    return;
  }
  cron.schedule(expression, task, options);
}

/**
 * Periodic jobs: scrape income (shigjeta) + wiki new brainrots (OpenAI for new entries).
 * Set AUTO_UPDATE_ENABLED=1 in backend/.env. Requires repo root (parent of backend/).
 */
function startAutoUpdate(repoRoot) {
  const enabled = /^(1|true|yes|on)$/i.test(String(process.env.AUTO_UPDATE_ENABLED || '').trim());
  if (!enabled) return;

  const tz = process.env.AUTO_UPDATE_TIMEZONE || 'UTC';
  const valuesCron = process.env.AUTO_UPDATE_VALUES_CRON || '0 5 * * *';
  const detectCron = process.env.AUTO_UPDATE_DETECT_CRON || '0 6 * * 0';
  const opt = { timezone: tz };

  const wrap = (label, pipeline) => async () => {
    if (pipelineRunning) {
      console.log(`[auto-update] ${label} skipped (previous job still running)`);
      return;
    }
    pipelineRunning = true;
    try {
      console.log(`[auto-update] ${label} start`);
      await pipeline(repoRoot);
      console.log(`[auto-update] ${label} done`);
    } catch (e) {
      console.error(`[auto-update] ${label} failed:`, e.message);
    } finally {
      pipelineRunning = false;
    }
  };

  scheduleJob('values', valuesCron, wrap('values', runValuesPipeline), opt);
  scheduleJob('detect-new', detectCron, wrap('detect-new', runDetectPipeline), opt);

  console.log(`[auto-update] enabled — values: "${valuesCron}", detect-new: "${detectCron}", tz: ${tz}`);

  if (/^(1|true|yes|on)$/i.test(String(process.env.AUTO_UPDATE_ON_START || '').trim())) {
    void wrap('values (on-start)', runValuesPipeline)();
  }
}

module.exports = { startAutoUpdate };
