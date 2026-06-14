import { generateService } from '@umijs/openapi';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SWAGGER_URL = 'http://localhost:8123/api/v2/api-docs';
const TEMP_SCHEMA_PATH = join(__dirname, '.temp-swagger.json');

async function fetchAndPatchSchema() {
  const res = await fetch(SWAGGER_URL);
  const schema = await res.json();

  // 递归修复所有缺少 type 的 parameter（补默认值 string）
  function patchParameters(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && typeof item === 'object' && 'in' in item && !item.type) {
          item.type = 'string';
        }
        patchParameters(item);
      }
    } else {
      for (const key of Object.keys(obj)) {
        patchParameters(obj[key]);
      }
    }
  }

  patchParameters(schema.paths);

  // 写到临时文件
  writeFileSync(TEMP_SCHEMA_PATH, JSON.stringify(schema, null, 2), 'utf-8');
  return TEMP_SCHEMA_PATH;
}

const schemaPath = await fetchAndPatchSchema();

generateService({
  schemaPath,
  serversPath: './src/services',
  requestLibPath: "import request from '@/request'",
});

// 清理临时文件
setTimeout(() => {
  try { unlinkSync(TEMP_SCHEMA_PATH); } catch {}
}, 2000);
