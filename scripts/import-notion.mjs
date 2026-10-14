import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const sourcePath = process.argv[2]
const apply = process.argv.includes('--apply')
if (!sourcePath) {
  console.error('Uso: node scripts/import-notion.mjs export-normalizado.json [--apply]')
  process.exit(1)
}
const source = JSON.parse(await readFile(sourcePath,'utf8'))
if (!Array.isArray(source.categories) || !Array.isArray(source.articles))
  throw new Error('O JSON precisa conter arrays categories e articles.')
for (const category of source.categories) {
  if (!category.slug || !category.title) throw new Error('Categoria sem slug ou título.')
}
for (const article of source.articles) {
  if (!article.slug || !article.title || !article.category_slug || !Array.isArray(article.blocks))
    throw new Error('Artigo sem slug, título, category_slug ou blocks.')
}
console.log(`Categorias: ${source.categories.length}; artigos: ${source.articles.length}`)
if (!apply) { console.log('Prévia concluída. Nenhum dado foi escrito.'); process.exit(0) }
const url = process.env.SUPABASE_URL
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !secret) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY somente no ambiente do processo.')
const client = createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}})
const categories = source.categories.map((item,index) => ({
  slug:item.slug, title:item.title, description:item.description || null,
  sort_order:item.sort_order ?? index, status:'draft',
}))
const categoryResult = await client.from('knowledge_categories').upsert(categories,{onConflict:'slug'}).select('id,slug')
if (categoryResult.error) throw categoryResult.error
const categoryIds = new Map(categoryResult.data.map(item => [item.slug,item.id]))
for (const [index,item] of source.articles.entries()) {
  const categoryId = categoryIds.get(item.category_slug)
  if (!categoryId) throw new Error(`Categoria ausente para ${item.slug}: ${item.category_slug}`)
  const result = await client.from('knowledge_articles').upsert({
    category_id:categoryId, slug:item.slug, title:item.title, summary:item.summary || null,
    blocks:item.blocks, tags:item.tags || [], links:item.links || [],
    sort_order:item.sort_order ?? index, status:'draft',
  },{onConflict:'slug'})
  if (result.error) throw result.error
}
console.log('Importação concluída como rascunho. Revise antes de publicar.')
