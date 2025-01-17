import internalsCJS from '@prisma/internals';

// 全てのエクスポートを再エクスポート
export default internalsCJS;

// 必要に応じて個別の関数をnamed exportとして再エクスポート
export const {
  getDMMF,
  getConfig,
  getGenerator,
  formatSchema,
  getPackageVersion
} = internalsCJS;
