import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8')

const removedFiles=[
  'src/githubSync.ts',
  'src/pages/SyncSettings.tsx',
  'src/components/SyncBadge.tsx'
]
for(const file of removedFiles)assert.equal(fs.existsSync(path.join(root,file)),false,`${file} must be removed`)

const storage=read('src/storage.ts')
for(const token of [
  'markSyncDirty','isSyncDirty','clearSyncDirtyIfUnchanged','getSyncDirtyRevision',
  'waseshibu-math-sync-dirty','waseshibu-math-sync-dirty-revision'
])assert.equal(storage.includes(token),false,`storage must not contain ${token}`)

for(const token of [
  "const DEVICE_KEY = 'waseshibu-math-device-id'",
  "const META_KEY = 'waseshibu-math-sync-meta'",
  'resetVersion:',
  'loadSyncMeta()',
  'saveSyncMeta('
])assert.equal(storage.includes(token),true,`compatibility structure missing: ${token}`)

const app=read('src/App.tsx')
assert.equal(app.includes('<Route path="/sync" element={<DataManager />} />'),true,'/sync compatibility route must resolve to DataManager')
assert.equal(app.includes('SyncSettings'),false,'SyncSettings must not be routed')
const layout=read('src/components/Layout.tsx')
assert.equal(layout.includes('SyncBadge'),false,'SyncBadge must not be rendered')
assert.equal(layout.includes('学習データはこの端末に保存されます。'),true,'local-only storage message must remain')
const migration=read('src/dataMigration.ts')
assert.equal(migration.includes('CURRENT_DATA_VERSION=7'),true,'data version must be 7')

const forbiddenProductTokens=[
  'https://api.github.com/',
  'api.github.com',
  'github_pat_',
  'GITHUB ONLY SYNC',
  'Private Repository',
  'fine-grained PAT',
  'waseshibu-github-sync-config',
  'waseshibu-github-token-session',
  'waseshibu-github-token-local'
]

function walk(dir){
  if(!fs.existsSync(dir))return []
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name)
    return entry.isDirectory()?walk(full):[full]
  })
}

for(const file of walk(path.join(root,'src'))){
  if(!/\.(?:ts|tsx|js|jsx|css|json|html)$/.test(file))continue
  const text=fs.readFileSync(file,'utf8')
  for(const token of forbiddenProductTokens)assert.equal(text.includes(token),false,`source contains removed GitHub sync token ${token}: ${path.relative(root,file)}`)
}

const dist=path.join(root,'dist')
assert.equal(fs.existsSync(dist),true,'dist must exist before bundle audit')
for(const file of walk(dist)){
  if(!/\.(?:js|css|html|json|txt|map)$/.test(file))continue
  const text=fs.readFileSync(file,'utf8')
  for(const token of forbiddenProductTokens)assert.equal(text.includes(token),false,`production build contains removed GitHub sync token ${token}: ${path.relative(root,file)}`)
}

const styles=read('src/styles.css')
assert.equal(styles.includes('.topbar{display:flex;align-items:center;justify-content:space-between;gap:14px}'),true,'shared topbar flex layout must survive sync CSS removal')
assert.equal(styles.includes('.local-badge'),true,'local data protection badge styling must remain')
for(const token of ['.sync-form','.sync-badge','.sync-auth','.sync-pending','.sync-off','.token-choice'])assert.equal(styles.includes(token),false,`stale GitHub sync CSS remains: ${token}`)
const packageJson=JSON.parse(read('package.json')),packageLock=JSON.parse(read('package-lock.json'))
assert.equal(packageJson.name,'waseshibu-math','package name must not describe the removed GitHub sync architecture')
assert.equal(packageLock.name,'waseshibu-math','package-lock name must match package name')
assert.equal(packageLock.packages?.['']?.name,'waseshibu-math','package-lock root package name must match package name')
const readme=read('README.md')
for(const token of ['GitHubだけで端末間同期','fine-grained PAT','`waseshibu-math-sync`','GitHub REST API：端末間同期'])assert.equal(readme.includes(token),false,`README still documents removed GitHub sync behavior: ${token}`)
assert.equal(readme.includes('GitHubアカウント、Private Repository、PAT、GitHub REST APIへの接続は学習機能に必要ありません。'),true,'README must state local-only learning architecture')
assert.equal(readme.includes('旧GitHub接続設定・PAT・dirty状態がブラウザに残っていても自動削除せず、通常利用では参照しません。'),true,'README must distinguish unused legacy GitHub connection state')
assert.equal(readme.includes('waseshibu-math-sync-meta')&&readme.includes('resetVersion 情報は既存学習データとの互換性維持のため端末内でのみ参照を残し、GitHubへの通信・同期には使用しません。'),true,'README must explain local-only sync-meta compatibility use')

console.log('GITHUB SYNC SEPARATION VERIFIED: localStorage-only learning flow, data v7 preserved, production bundle clean')
