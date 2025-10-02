# SupabaseCheckpointSaver デバッグ進捗

## 問題

テスト `should correctly save next nodes and pending tasks in checkpoints` が失敗している。

```
expect(afterNodeAState.next).toEqual(['nodeB'])
// actual: []
```

- `afterNodeAState.next` が `['nodeB']` ではなく空配列 `[]` になっている
- PostgresCheckpointSaver では同じテストがパスする

## 原因調査

### フェーズ1: next の計算方法を調査

1. LangGraph のコードを調査した結果:
   - `next` は `_prepareNextTasks` で計算される
   - `_prepareNextTasks` は `channels[TASKS]` (= `__pregel_tasks` channel) を読み取る
   - `__pregel_tasks` が `checkpoint.channel_values` に含まれている必要がある

### フェーズ2: __pregel_tasks が保存されない原因を調査

2. `SupabaseCheckpointSaver.getTuple` をデバッグ:
   - `checkpoint_writes` テーブルには正しくデータが保存されている
   - しかし `pendingWrites` は関係ない（`next` の計算には使われない）

3. `__pregel_tasks` が `channel_values` に含まれない原因を発見:
   - `__pregel_tasks` は blob として保存されていなかった
   - `_dumpBlobs` は `versions` (= `newVersions`) に含まれるチャネルのみ保存する
   - LangGraph は `__pregel_tasks` を `newVersions` に含めない（バージョン管理されないチャネル）

### フェーズ3: 修正の実装

4. 2つの修正を実装:

   **修正1: `_dumpBlobs` に特別処理を追加**
   ```typescript
   // Also save TASKS channel if it exists in values but not in versions
   if (values[TASKS] !== undefined && versions[TASKS] === undefined) {
     const value = values[TASKS]
     const [type, serialized] = await this.serde.dumpsTyped(value)
     blobs.push({
       thread_id: threadId,
       checkpoint_ns: checkpointNs,
       channel: TASKS,
       version: '1',
       type,
       blob: uint8ArrayToBase64(serialized),
       organization_id: this.organizationId,
     })
   }
   ```

   **修正2: `_dumpCheckpoint` に特別処理を追加**
   ```typescript
   // Add TASKS to channel_versions if it exists in channel_values
   if (checkpoint.channel_values[TASKS] !== undefined && channelVersions[TASKS] === undefined) {
     channelVersions[TASKS] = 1
   }
   ```

   **修正3: `_dumpBlobs` の早期リターン条件を修正**
   ```typescript
   // 変更前
   if (!values || Object.keys(versions).length === 0) {
     return []
   }

   // 変更後（versions が空でも TASKS を保存できるように）
   if (!values) {
     return []
   }
   ```

### フェーズ4: 修正後のデバッグ

5. デバッグログで確認した結果:
   - ✅ `__pregel_tasks` は blob として保存されている
   - ✅ `__pregel_tasks` は `channel_versions` に含まれている（version: 1）
   - ✅ `__pregel_tasks` は読み込まれて `channel_values` に含まれている
   - ❌ **しかし `__pregel_tasks` の値が `[[], []]` と空になっている**

### フェーズ5: 新たな問題の発見

6. 保存時のデバッグログを確認:
   ```
   [_dumpBlobs] Saving TASKS value: [[], []]
   ```
   - 保存時から値が空になっている
   - これは保存処理の問題ではなく、LangGraph が `checkpoint.channel_values[TASKS]` に空の値を設定している可能性

## 現在の状況

- **問題**: `__pregel_tasks` の値が空（`[[], []]`）で保存されている
- **疑問**: PostgresCheckpointSaver ではどうやって正しいタスクを取得しているのか？

## フェーズ6: PostgresCheckpointSaver との実装の違いを発見

7. PostgresCheckpointSaver の実装を確認:
   - **重要な発見**: PostgresSaver は `channel_values` を JOIN で動的に取得している！
   - `SELECT_SQL` (sql.ts:62-86) を見ると:
     ```sql
     select array_agg(array[bl.channel::bytea, bl.type::bytea, bl.blob])
     from jsonb_each_text(checkpoint -> 'channel_versions')
     inner join checkpoint_blobs bl
       on bl.channel = jsonb_each_text.key
       and bl.version = jsonb_each_text.value
     ```
   - つまり `checkpoint.channel_versions` に含まれるチャネルの blob を JOIN で取得
   - `_loadCheckpoint` には `value.channel_values` として既に読み込まれた blob が渡される

8. SupabaseCheckpointSaver の実装との違い:
   - **Supabase**: blob を別クエリで取得し、`_loadBlobs` で読み込む
   - **Postgres**: SQL の JOIN で blob を取得し、すでにデシリアライズ済みの配列として渡す
   - この違いが重要：PostgresSaver は `channel_versions` に含まれるチャネルのみ読み込む

9. 根本原因の理解:
   - `__pregel_tasks` は `checkpoint.channel_values` に**存在する**
   - しかし LangGraph は `put()` 時に `__pregel_tasks` を `newVersions` に含めない
   - PostgresSaver では、`channel_versions` に `__pregel_tasks` があれば JOIN で取得される
   - **我々の修正は正しい方向**: `channel_versions` に `TASKS: 1` を追加した

10. 新たな問題:
    - デバッグログで確認すると `__pregel_tasks` の値が保存時から `[[], []]` と空
    - これは保存処理の問題ではなく、LangGraph が空の値を設定している可能性
    - または `checkpoint_writes` からタスクを再構築する必要がある？

## フェーズ7: next の計算ロジックの発見

11. `_prepareStateSnapshot` の実装を確認（pregel/index.ts:740-840）:
    - `next` は `_prepareNextTasks` で計算される
    - **重要**: `_prepareNextTasks` は 2つの引数を受け取る:
      1. `saved.checkpoint`
      2. **`saved.pendingWrites`** ← これが重要！
    - つまり `next` は `checkpoint.channel_values[TASKS]` だけでなく、`pendingWrites` からも計算される

12. 新たな仮説:
    - PostgresSaver では `pendingWrites` が正しく返されている
    - SupabaseCheckpointSaver でも `pendingWrites` は返されているが、何か問題がある可能性
    - または `_prepareNextTasks` の内部実装を理解する必要がある

## フェーズ8: PULL タスクの作成ロジックの調査

13. `_prepareNextTasks` と `_prepareSingleTask` の実装を確認（algo.ts）:
    - **PUSH タスク**: `channels[TASKS]` から作成される（line 436-455）
    - **PULL タスク**: edges (`proc.triggers`) から作成される（line 457-474, 803-900）
    - PULL タスクの作成条件:
      1. `proc` が存在する
      2. まだ実行されていない（`pendingWrites` でチェック）
      3. **trigger が見つかる**: `checkpoint.channel_versions[chan] > seen[chan]`

14. `__pregel_tasks` が空 (`[[], []]`) なのは正常:
    - PostgresSaver でも同じ値が保存されている（確認済み）
    - PUSH タスクは `channels[TASKS]` から作成されるが、常に空
    - 重要なのは PULL タスク

15. **根本原因の発見**: `channel_versions` に edge チャネルが含まれていない
    - step=1（afterNodeA）のチェックポイントの `channel_versions`:
      ```json
      {
        "foo": 2,
        "__start__": 2,
        "__pregel_tasks": 1,
        "branch:to:nodeA": 2
      }
      ```
    - **`branch:to:nodeB` が含まれていない！**
    - PostgresSaver でも同じ（確認済み）

16. PULL タスク作成の trigger 判定ロジック:
    ```typescript
    const trigger = proc.triggers.find((chan) => {
      if (!channels[chan].isAvailable()) return false;
      return (
        (checkpoint.channel_versions[chan] ?? nullVersion) >
        (seen[chan] ?? nullVersion)
      );
    });
    ```
    - `branch:to:nodeB` が `channel_versions` に存在しない
    - `nullVersion` が使われる
    - `nullVersion > nullVersion` = false
    - trigger が見つからず、PULL タスクが作成されない
    - **`next` が空になる**

## 現在の状況

- **問題**: `channel_versions` に edge チャネル（`branch:to:nodeB`）が含まれていない
- **疑問**: PostgresSaver でも同じデータなのに、なぜテストがパスするのか？
- **仮説**:
  1. `emptyChannels` が `checkpoint` からチャネルを作成する際、何か違いがある？
  2. `channels[chan].isAvailable()` の判定が違う？
  3. または、テストの期待値が間違っている？

## 次のステップ

1. PostgresSaver の統合テストに同じデバッグログを追加して、実際のデータを比較する
2. `emptyChannels` の実装を確認し、`channels` の初期化ロジックを理解する
3. `channels[chan].isAvailable()` がどのように判定されるか確認する
4. または、LangGraph のバージョンや設定に違いがあるか確認する

## フェーズ8: `__pregel_tasks` と `null` 値の扱いを調査

1. Supabase 側の `checkpoint_blobs` を確認したところ、`__pregel_tasks` が一切保存されていなかった
2. `_dumpBlobs` が `value === null` の場合にも `type: 'empty'` としてスキップしていたため、`branch:to:*` チャネルの `null` 書き込みも無視されていた
3. Postgres 実装では `null` も serde でシリアライズされるため、`EphemeralValue` チャネルが復元され `isAvailable()` が `true` になる
4. `__pregel_tasks` は `newVersions` に含まれないため、Supabase 実装では blob が生成されず、`getStateHistory` がタスクを復元できていなかった

## フェーズ9: 修正内容

1. `_dumpCheckpoint`
   - `checkpoint.channel_values[TASKS]` が存在する場合、`channel_versions` に `TASKS` を追加（既存バージョンが無ければ `getNextVersion(undefined)` を使用）
2. `_dumpBlobs`
   - `null` を値として保存するように変更（`undefined` のみを `empty` 扱いにする）
   - `__pregel_tasks` が `versions` に含まれない場合でも、チェックポイント側のバージョンを使って保存するようにした
   - バージョン情報を参照するために `checkpoint_channel_versions` を引数として受け取り、`TASKS` 用のバージョンを解決
3. これにより `branch:to:*` チャネルの書き込みが復元され、`next` および `tasks` が正しく計算される

## フェーズ10: 検証結果

- `pnpm test:integration src/checkpoint/SupabaseCheckpointSaver.integration.test.ts` ✅
- `pnpm test:integration src/checkpoint/PostgresCheckpointSaver.integration.test.ts` ✅（回帰なし）
- `state history summary`（Supabase）で `step 1` に `next: ['nodeB']` / `tasks: ['nodeB']` を確認

## 現在の状況（更新）

- Supabase 実装でも LangGraph 準拠のタスク復元が行えるようになり、対象テストはパスしている
- `__pregel_tasks` と `branch:to:*` チャネルの blob が Supabase に保存されていることを psql で確認済み
- 追加の不具合は今のところ観測されていない

## 次のステップ（更新）

- 必要に応じて他の統合テストでも同様のケースがないか確認
- 変更内容を共有し、レビューを依頼
