# opencode-utf8-shell

opencode のシェル系ツールから **PowerShell が呼ばれる際に UTF-8 出力エンコーディングを強制**し、
日本語など CJK 出力の文字化けを防ぐプラグインです（**Windows 専用**）。

## 背景

opencode は `powershell.exe` を `-NoLogo -NoProfile -NonInteractive -Command ...` で起動するため
`$PROFILE` が読み込まれず、Windows PowerShell 5.1 の `[Console]::OutputEncoding` は
shift_jis (CP932) のままになります。一方 opencode 側は子プロセスの stdout を UTF-8 固定で
デコードするため、CP932 バイト列が UTF-8 として解釈されて日本語が化けます。

本プラグインはシェルコマンド実行前に、コマンド文字列の先頭へ UTF-8 プロローグを
自動挿入します（冪等ガード付き）。Windows 以外では何もしません（no-op）。

```powershell
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $OutputEncoding=[System.Text.Encoding]::UTF8;
```

## 対応

| 項目 | 内容 |
| --- | --- |
| opencode | v1 (1.18.x) / v2 (2.0.x) 両対応（dual form プラグイン） |
| OS | Windows のみ（`process.platform === "win32"` で判定） |
| フック | v2: `ctx.shell.hook("create.before")` / v1: `"tool.execute.before"`（tool = `bash`） |

## インストール

```sh
opencode plugin add git+https://github.com/furutyX/opencode-utf8-shell.git
```

または `opencode.jsonc` の `plugins` に直接追加します。

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "git+https://github.com/furutyX/opencode-utf8-shell.git"
  ]
}
```

インストール後、**opencode を再起動**してください（プラグインは起動時に読み込まれます）。

## 免責

本プラグインは opencode とは無関係の**非公式なコミュニティプラグイン**です
（opencode / anomalyco による承認・提携・サポートはありません）。

## ライセンス

MIT
