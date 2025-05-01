# お願いしたいこと概要

AppBar.tsxに第3のドロップダウンメニュー、「そのブランチの現在過去未来のコミットを行き来できる新ドロップダウンメニュー」を作ってほしい。そのために新ルーティングも必要になるのでそれも作ってほしい

# URL・ルーティングのポイント 

以下、基本的に既存の

- ルーティングa. frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/page.tsx

について論じる。

ただし、新ルーティング

- ルーティングb. frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branch]/commit/[commit]/page.tsx

も必要になる。


# コンポーネントのポイント 

frontend/apps/app/components/CommonLayout/AppBar/AppBar.tsx には、見ての通り2つのドロップダウンメニューがある

- 1. ProjectsDropdownMenu
- 2. BranchDropdownMenu

BranchDropdownMenuの次に、「新ドロップダウンメニュー」を作ってほしい。

新ドロップダウンメニューは、以下のような要素でできる

- 基本スタイルは ProjectsDropdownMenu, BranchDropdownMenu を踏襲。
- ルーティングa. のページにおいては... 
   - デフォルト値は、 `latest` のような表記にしておき、コミットハッシュの先頭8桁を併記する。(latest(deadb55f))
   - そのブランチの headを指しているイメージ。
   - 選択肢は、そのブランチにおける過去のコミットの降順。コミットハッシュの先頭8桁を表示する。要素は10個まで。
      - 選択肢をクリックした場合、ルーティングb.に遷移する。
      - コミットの一覧はoktokitのAPIが使えれば使う。(調べてないのでできるかどうか考えてみて)
- ルーティングb.(新規に作る) のページにおいては... 
   - デフォルト値は、その `[commit]` の値。
   - 未来のコミットはそのデフォルト値のまえ(上部)に、過去のデフォルト値のあと(下部)に表示する。つまり全体としてコミット順に降順。要素は10個まで。
      - コミットの一覧はoktokitのAPIが使えれば使う。(調べてないのでできるかどうか考えてみて)
   - 選択肢をクリックした場合、そのコミットの該当ページ(ルーティングb.)に遷移する


