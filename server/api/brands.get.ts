import { defineEventHandler } from 'h3'
import yaml from 'js-yaml'

const REPO_BASE = 'https://api.github.com/repos/TechForPalestine/boycott-israeli-consumer-goods-dataset/contents/data'

// TÜRKÇELEŞTİRME SÖZLÜĞÜ (Heuristic Translation)
const translationMap: Record<string, string> = {
  'Direct support': 'İsrail ekonomisine doğrudan destek.',
  'Parent company': 'Ana şirket boykot kapsamında.',
  'Investments in Israel': 'İsrail yerleşim birimlerine yatırım.',
  'Military support': 'İsrail ordusuna teknolojik/lojistik destek.',
  'Operating in settlements': 'İşgal altındaki topraklarda faaliyet.',
  'Boycott recommended': 'Boykot edilmesi öneriliyor.',
  'International support': 'Uluslararası boykot listelerinde yer alıyor.'
}

const translateReason = (engReason: string) => {
  if (!engReason) return 'Boykot listesinde yer alıyor.'
  
  // Sözlükte varsa çevir
  for (const [key, value] of Object.entries(translationMap)) {
    if (engReason.toLowerCase().includes(key.toLowerCase())) return value
  }

  // Genel çeviriler
  return engReason
    .replace(/israeli/gi, 'İsrail')
    .replace(/support/gi, 'destek')
    .replace(/company/gi, 'şirket')
    .replace(/brand/gi, 'marka')
    .replace(/invested/gi, 'yatırım yapmış')
}

export default defineEventHandler(async (event) => {
  try {
    // 1. Klasörleri Listele (Brands ve Companies)
    const [brandsRes, companiesRes] = await Promise.all([
      fetch(`${REPO_BASE}/brands`),
      fetch(`${REPO_BASE}/companies`)
    ])

    const brandFiles = brandsRes.ok ? await brandsRes.json() : []
    const companyFiles = companiesRes.ok ? await companiesRes.json() : []

    const allFiles = [...brandFiles, ...companyFiles]
      .filter((f: any) => f.name.endsWith('.yaml'))
      .slice(0, 150) // Performans ve Rate Limit için sınır

    // 2. Dosyaları Çek ve Türkçeleştir
    const dataPromises = allFiles.map(async (file: any) => {
      try {
        const fileRes = await fetch(file.download_url)
        const content = await fileRes.text()
        const data: any = yaml.load(content)
        
        return {
          name: data.name || data.brand || data.company,
          status: 'boykot',
          reason: translateReason(data.description || data.reason),
          alternatives: [{ name: 'Yerel Alternatifleri Kontrol Edin', in: ['GENEL'] }]
        }
      } catch (e) {
        return null
      }
    })

    const finalData = (await Promise.all(dataPromises)).filter(b => b !== null)
    return finalData
    
  } catch (error) {
    console.error('Veri İşleme Hatası:', error)
    return []
  }
})
