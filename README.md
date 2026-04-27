# Manga Streamer (Web)

Google Drive 上の漫画 ZIP/CBZ ファイルを **ダウンロードせずにストリーミングで** 読むためのブラウザアプリ。HTTP Range request で ZIP の Central Directory と必要なページのみを取得し、`DecompressionStream` で展開する。

`index.html` 一枚で完結。GitHub Pages にそのまま置ける。

---

## 仕様

- **対応形式**: ZIP / CBZ（DEFLATE / Stored）、ZIP64、Shift_JIS / UTF-8 ファイル名
- **画像形式**: JPEG / PNG / WebP / AVIF / GIF / BMP
- **読書方向**: 右開き（manga RTL）。タップ左 = 次ページ、タップ右 = 前ページ
- **キャッシュ**: 画像 12 ページ分の LRU、Drive ファイル ID ごとに最終ページ位置を localStorage に保存
- **対応ブラウザ**: Chrome / Edge / Safari / Firefox いずれも最新版（`DecompressionStream('deflate-raw')` 対応必須）

> RAR / 7z / 暗号化 ZIP は **非対応**（Android 版とは異なる）

---

## セットアップ

### 1. Google Cloud Console で OAuth クライアント ID を作成

1. <https://console.cloud.google.com/> にアクセス、適当なプロジェクトを作成（既存のものでも可）
2. **APIs & Services → Library** から `Google Drive API` を検索して **Enable**
3. **APIs & Services → OAuth consent screen** で
   - User Type: `External`
   - App name など最低限を入力
   - **Scopes** で `.../auth/drive.readonly` を追加
   - **Test users** に自分の Google アカウントを追加
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins** にこのページの origin を追加（例: `https://yourname.github.io`、ローカル動作確認用に `http://localhost:8000` も）
   - 作成すると `xxxxxx.apps.googleusercontent.com` の形式の Client ID が発行される

### 2. ホスティング

#### GitHub Pages の場合

```bash
# 適当なリポジトリにコミット
git init
git add index.html README.md
git commit -m "Initial"
git remote add origin git@github.com:yourname/manga-streamer-web.git
git push -u origin main
```

リポジトリの **Settings → Pages** で `main` ブランチをソースに設定。`https://yourname.github.io/manga-streamer-web/` で公開される。**この URL の origin（`https://yourname.github.io`）を上記 OAuth の Authorized JavaScript origins に必ず追加すること。**

#### ローカル動作確認

```bash
cd manga-streamer-web
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

`http://localhost:8000` を Authorized JavaScript origins に追加しておく。

### 3. 初回サインイン

公開した URL を開く → Client ID を貼り付け → **Sign in with Google** → Drive 読み取り権限を許可。Client ID は localStorage に保存されるので次回以降は不要。

---

## 使い方

| 操作 | アクション |
|---|---|
| ファイルブラウザ | フォルダをタップで階層移動。ZIP/CBZ をタップでリーダー起動 |
| リーダー: 画面左タップ | 次ページ |
| リーダー: 画面右タップ | 前ページ |
| リーダー: 画面中央タップ | 上部オーバーレイの表示切替 |
| リーダー: スワイプ右 | 次ページ（RTL の自然な方向） |
| キーボード ←  | 次ページ |
| キーボード → | 前ページ |
| キーボード Esc | リーダーを閉じる |

最後に開いていたページは Drive ファイル ID 単位で記憶され、次回同じファイルを開くと続きから表示される。

---

## アーキテクチャ

```
[GIS OAuth] ─ access_token ─┐
                            │
                            ▼
              fetch(Drive API, Range: bytes=...)
                            │
                            ▼
      ┌───────── ZipReader ─────────┐
      │  open():   末尾 64KB → EOCD  │
      │            → Central Directory パース
      │  readEntry(): Local Header → 圧縮データ
      │            → DecompressionStream('deflate-raw')
      └─────────────────────────────┘
                            │
                            ▼
              Blob → object URL → <img>
                            │
                            ▼
        flex row-reverse + scroll-snap で RTL ページング
```

Android 版の `ZipStreamReader` + `HttpRangeSource` をブラウザ API に置き換えたもの。EOCD 探索、ZIP64 対応、Shift_JIS デコード、選択的 entry 読み出しのロジックは同じ思想。

---

## トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| `redirect_uri_mismatch` / `idpiframe_initialization_failed` | Authorized JavaScript origins に現在の URL の origin が登録されていない |
| サインイン後に何も起こらない | OAuth consent screen で `drive.readonly` スコープを追加していない |
| `403 forbidden` | アプリが Test mode のまま、自分のアカウントが Test users に登録されていない |
| 「EOCD not found」 | ZIP 形式ではないファイル（自己解凍 EXE、RAR、暗号化アーカイブなど） |
| 「Encrypted ZIP entries are not supported」 | パスワード付き ZIP は非対応 |
| 「Unsupported compression method: N」 | DEFLATE / Stored 以外の方式（BZIP2 など）は未対応 |
| 巨大ファイルで読み込みが遅い | Range request 1 回ごとに往復が発生する。Drive 側のレイテンシ次第（通常 100-300ms / page） |
| トークンが切れる | 1 時間でアクセストークンが期限切れ。コード内で自動的にサイレント再取得を試みるが、失敗したら再度サインイン |

---

## ライセンス

MIT
