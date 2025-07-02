---
description: app-uiブランチから新しいgit worktreeを作成
---

## Task
app-uiブランチから新しいgit worktreeを作成してください：

1. ブランチ名を決定（引数またはタスク内容から推測）
2. worktreeを作成：
   ```bash
   git worktree add ../[ディレクトリ名] app-ui -b feat/[ブランチ名]
   ```
3. 作成したworktreeの情報を表示
4. 移動コマンドをクリップボードにコピー：
   ```bash
   echo "cd ../[ディレクトリ名]" | pbcopy
   ```

### Arguments
$ARGUMENTS