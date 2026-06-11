import { generateService } from '@umijs/openapi';

generateService({
  schemaPath: 'http://localhost:8123/api/v2/api-docs',
  serversPath: './src/services',
  requestLibPath: "import myAxios from '@/request'",
});
