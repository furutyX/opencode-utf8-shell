// opencode-utf8-shell
//
// opencode v1 / v2 両対応ローカルプラグイン（Windows only）
//
// 目的:
//   opencode のシェル系ツール（v1: "bash" / v2: "opencode.tool.shell"）から
//   PowerShell が呼ばれる際に UTF-8 出力エンコーディングを強制し、
//   日本語等の CJK 出力の文字化けを防ぐ。
//
// 背景:
//   opencode は powershell.exe を
//     `-NoLogo -NoProfile -NonInteractive -Command ...`
//   で起動するため $PROFILE が読み込まれず、Windows PowerShell 5.1 の
//   [Console]::OutputEncoding は shift_jis (CP932) のままになる。
//   一方 opencode 側は子プロセスの stdout を UTF-8 固定でデコードするため、
//   CP932 バイト列が UTF-8 として解釈されて日本語が化ける。
//   (PowerShell 7 / pwsh は既定で UTF-8 だが、App Execution Alias のため
//    Node の fs.statSync から見えず、Windows では PS 5.1 が使われ続ける。)
//
// 動作:
//   bash / shell ツールの「実行前」に、PowerShell のコマンド文字列の先頭に
//   UTF-8 プロローグを自動で挿入する（冪等ガード付き）。Windows 以外では no-op。
//
// 形式:
//   opencode v1.18.29+ と v2.0.x の両方で動く「dual form」を採用している。
//   - v1 は default レコードの `server()` を見る (tool.execute.before)
//   - v2 は default レコードの `setup()` を見る (ctx.shell.hook("create.before"))
//
// 反映には opencode の再起動（または設定リロード）が必要。

const id = "utf8-shell"

const PROLOGUE =
  "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; " +
  "$OutputEncoding=[System.Text.Encoding]::UTF8; "
const ALREADY_PREFIXED = /^\s*\[Console\]::OutputEncoding\s*=/i

function rewrite(command) {
  if (process.platform !== "win32") return undefined
  if (typeof command !== "string" || command.length === 0) return undefined
  if (ALREADY_PREFIXED.test(command)) return undefined
  return PROLOGUE + command
}

// ---- v1: server() が hooks object を返す ----
async function server() {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const next = rewrite(output?.args?.command)
      if (next !== undefined) output.args.command = next
    },
  }
}

// ---- v2: setup(ctx) でドメインに hook 登録する ----
async function setup(ctx) {
  await ctx.shell.hook("create.before", (event) => {
    const next = rewrite(event.command)
    if (next !== undefined) event.command = next
  })
}

// single value export: 1 つの default オブジェクトに id/server/setup を同居。
// v1 は { id, server } を読み、v2 は { id, setup } を読む。
export default { id, server, setup }
