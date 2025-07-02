# ディレクトリリファクタリング（機能別グルーピング）- 技術ガイド

## 概要

フラットな構造のディレクトリを機能別にグルーピングして、コードベースの保守性と可読性を向上させる手法です。特に関連するファイル群（実装・テスト・設定など）を同一ディレクトリに配置することで、開発効率を向上させます。

## 適用パターン

### パターン1: 機能別グルーピング（今回実施）

**適用前（フラット構造）:**
```
src/
├── calculateAverages.ts
├── calculateAverages.test.ts
├── calculateTableMetrics.ts
├── calculateTableMetrics.test.ts
├── evaluateColumns.ts
├── evaluateColumns.test.ts
├── validatePrimaryKeys.ts
├── validateConstraints.ts
├── types.ts
└── index.ts
```

**適用後（機能別グルーピング）:**
```
src/
├── calculateAverages/
│   ├── calculateAverages.ts
│   └── calculateAverages.test.ts
├── calculateTableMetrics/
│   ├── calculateTableMetrics.ts
│   └── calculateTableMetrics.test.ts
├── evaluateColumns/
│   ├── evaluateColumns.ts
│   └── evaluateColumns.test.ts
├── validatePrimaryKeys/
│   └── validatePrimaryKeys.ts
├── validateConstraints/
│   └── validateConstraints.ts
├── types.ts
└── index.ts
```

### パターン2: レイヤー別グルーピング

**適用例（Web API）:**
```
src/
├── controllers/
│   ├── userController/
│   │   ├── userController.ts
│   │   └── userController.test.ts
│   └── orderController/
│       ├── orderController.ts
│       └── orderController.test.ts
├── services/
│   ├── userService/
│   │   ├── userService.ts
│   │   └── userService.test.ts
│   └── emailService/
│       ├── emailService.ts
│       └── emailService.test.ts
├── repositories/
│   ├── userRepository/
│   │   ├── userRepository.ts
│   │   └── userRepository.test.ts
│   └── orderRepository/
│       ├── orderRepository.ts
│       └── orderRepository.test.ts
└── types/
    ├── user.ts
    └── order.ts
```

### パターン3: ドメイン駆動設計（DDD）風グルーピング

**適用例（ECサイト）:**
```
src/
├── user/
│   ├── domain/
│   │   ├── user.ts
│   │   └── user.test.ts
│   ├── repository/
│   │   ├── userRepository.ts
│   │   └── userRepository.test.ts
│   └── service/
│       ├── userService.ts
│       └── userService.test.ts
├── order/
│   ├── domain/
│   │   ├── order.ts
│   │   └── order.test.ts
│   ├── repository/
│   │   ├── orderRepository.ts
│   │   └── orderRepository.test.ts
│   └── service/
│       ├── orderService.ts
│       └── orderService.test.ts
└── shared/
    ├── types.ts
    └── utils.ts
```

## 実装手順

### 1. 分析フェーズ
- 現在のファイル依存関係を調査
- 機能的なグルーピングを特定
- 共有されるファイル（types、utils等）を識別

### 2. 設計フェーズ
- 新しいディレクトリ構造を設計
- 命名規則を決定
- インポートパスの影響範囲を評価

### 3. 実装フェーズ
```bash
# 1. ディレクトリ作成
mkdir -p src/calculateAverages src/calculateTableMetrics

# 2. ファイル移動
mv src/calculateAverages.ts src/calculateAverages/
mv src/calculateAverages.test.ts src/calculateAverages/

# 3. インポートパス更新
# 相対パス: './types' → '../types'
# 相互参照: './calculateAverages' → '../calculateAverages/calculateAverages'
```

### 4. 検証フェーズ
```bash
# TypeScript型チェック
npx tsc --noEmit

# リンター実行
npm run lint

# テスト実行
npm run test
```

## 具体的な修正例

### インポートパス更新
```typescript
// 修正前
import { calculateAverages } from './calculateAverages'
import type { Mapping } from './types'

// 修正後
import { calculateAverages } from '../calculateAverages/calculateAverages'
import type { Mapping } from '../types'
```

### エクスポート更新
```typescript
// index.ts - 修正前
export * from './calculateAverages'
export * from './calculateTableMetrics'

// index.ts - 修正後
export * from './calculateAverages/calculateAverages'
export * from './calculateTableMetrics/calculateTableMetrics'
```

### テストファイルのモック更新
```typescript
// 修正前
vi.mock('./calculateAverages')

// 修正後
vi.mock('../calculateAverages/calculateAverages')
```

## 適用判断基準

### 適用推奨ケース
- ファイル数が15個以上のディレクトリ
- 機能的に関連するファイル群が明確に分類できる
- テストファイルと実装ファイルが1:1対応している
- チーム開発で特定機能の責任範囲を明確にしたい

### 注意が必要なケース
- 循環依存が存在する場合
- 外部ライブラリとの依存関係が複雑な場合
- ビルドツールの設定変更が必要な場合

## メリット・デメリット

### メリット
1. **可読性向上**: 機能ごとの責任範囲が明確
2. **保守性向上**: 関連ファイルの発見が容易
3. **開発効率**: テストファイルが実装と同じ場所にある
4. **スケーラビリティ**: 新機能追加時の一貫したパターン

### デメリット
1. **初期コスト**: リファクタリング作業が必要
2. **インポートパス**: 相対パスが複雑になる可能性
3. **ツール設定**: IDEやビルドツールの設定変更が必要な場合

## 類似手法との比較

| 手法 | 適用場面 | メリット | デメリット |
|------|----------|----------|------------|
| 機能別グルーピング | 中規模プロジェクト | 機能の独立性 | パス管理の複雑化 |
| レイヤー別グルーピング | 大規模アーキテクチャ | アーキテクチャの明確化 | 機能追加時の分散 |
| モノリポ分割 | 複数プロダクト | 完全な分離 | 設定の複雑化 |

この手法により、今回の schema-bench プロジェクトでは16ファイルを8つの機能別ディレクトリに整理し、コードベースの保守性を大幅に向上させることができました。
