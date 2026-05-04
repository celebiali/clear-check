import { defineEventHandler } from 'h3'
import yaml from 'js-yaml'

// GitHub API üzerinden klasör içeriğini listeleme
const BRANDS_DIR_URL = 'https://api.github.com/repos/TechForPalestine/boycott-israeli-consumer-goods-dataset/contents/data/brands'

export default defineEventHandler(async (event) => {
  try {
    // 1. Marka klasöründeki dosya listesini al
    const dirResponse = await fetch(BRANDS_DIR_URL)
    if (!dirResponse.ok) throw new Error('GitHub dizinine ulaşılamadı.')
    
    const files = await dirResponse.json()
    const yamlFiles = files.filter((f: any) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'))

    // 2. Her dosyayı çek ve YAML olarak parse et
    // Not: Hız için şimdilik ilk 50 tanesini çekelim (Rate limit koruması)
    const brandPromises = yamlFiles.slice(0, 100).map(async (file: any) => {
      try {
        const fileRes = await fetch(file.download_url)
        const content = await fileRes.text()
        const data: any = yaml.load(content)
        
        return {
          name: data.name || data.brand,
          status: 'boykot',
          reason: data.description || data.reason || 'Boykot listesinde yer alıyor.',
          alternatives: data.alternatives?.map((a: any) => ({ name: a, in: ['GENEL'] })) || [{ name: 'Yerel Alternatifler', in: ['GENEL'] }]
        }
      } catch (e) {
        return null
      }
    })

    const brands = (await Promise.all(brandPromises)).filter(b => b !== null)
    
    return brands
  } catch (error) {
    console.error('YAML Derleme Hatası:', error)
    // Hata durumunda boş dönmek yerine yerel yedeği kullanabiliriz
    return []
  }
})
