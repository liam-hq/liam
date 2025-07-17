.PHONY: run clean list help

# デフォルトのターゲット
help:
	@echo "使用可能なコマンド:"
	@echo "  make run        - スキーマ生成を実行"
	@echo "  make clean      - 出力ファイルをクリーン"
	@echo "  make list       - 入力ファイル一覧を表示"
	@echo "  make blog       - ブログシステムのサンプルを実行"
	@echo "  make ecommerce  - ECサイトのサンプルを実行"
	@echo "  make sns        - SNSアプリのサンプルを実行"

# スキーマ生成を実行
run:
	LIAM_OFFLINE_MODE=true pnpm executeLiamDB

# 出力ファイルをクリーン
clean:
	rm -f benchmark-workspace/execution/output/*.json

# 入力ファイル一覧を表示
list:
	@echo "入力ファイル:"
	@ls -la benchmark-workspace/execution/input/
	@echo "\n出力ファイル:"
	@ls -la benchmark-workspace/execution/output/

# ブログシステムのサンプル
blog:
	@echo '{"input": "ブログシステムのデータベーススキーマを作成してください。記事、ユーザー、コメント、カテゴリ、タグ機能が必要です。"}' > benchmark-workspace/execution/input/blog.json
	@LIAM_OFFLINE_MODE=true pnpm executeLiamDB
	@echo "\n=== 生成されたスキーマ ==="
	@cat benchmark-workspace/execution/output/blog.json | jq '.tables | keys'

# ECサイトのサンプル
ecommerce:
	@echo '{"input": "ECサイトのデータベーススキーマを作成してください。商品、ユーザー、注文、カート、支払い、配送先の管理が必要です。"}' > benchmark-workspace/execution/input/ecommerce.json
	@LIAM_OFFLINE_MODE=true pnpm executeLiamDB
	@echo "\n=== 生成されたスキーマ ==="
	@cat benchmark-workspace/execution/output/ecommerce.json | jq '.tables | keys'

# SNSアプリのサンプル
sns:
	@echo '{"input": "SNSアプリのデータベーススキーマを作成してください。ユーザー、投稿、いいね、コメント、フォロー、通知機能が必要です。"}' > benchmark-workspace/execution/input/sns.json
	@LIAM_OFFLINE_MODE=true pnpm executeLiamDB
	@echo "\n=== 生成されたスキーマ ==="
	@cat benchmark-workspace/execution/output/sns.json | jq '.tables | keys'