import { defineEventHandler } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'

// ÇALIŞAN GÜNCEL VERİ KAYNAĞI
const EXTERNAL_URL = 'https://raw.githubusercontent.com/TechForPalestine/boycott-israeli-consumer-goods-dataset/main/data/brands.json'

export default defineEventHandler(async (event) => {
  let brands = []

  // 1. Önce Dış Kaynaktan Çekmeyi Dene
  try {
    const response = await fetch(EXTERNAL_URL)
    if (response.ok) {
      const externalData = await response.json()
      // Gelen veriyi bizim formatımıza uyarla
      brands = externalData.map((item: any) => ({
        name: item.name || item.brand,
        status: 'boykot',
        reason: item.description || 'Boykot listesinde yer alıyor.',
        alternatives: [{ name: 'Yerel Alternatifleri Kontrol Edin', in: ['GENEL'] }]
      }))
      console.log('✅ Veriler dış kaynaktan başarıyla çekildi.')
    }
  } catch (error) {
    console.warn('⚠️ Dış kaynağa ulaşılamadı, yerel veriye geçiliyor.')
  }

  // 2. Eğer Dış Kaynak Başarısızsa veya Boşsa Yerel Dosyayı Oku (Yedek)
  if (brands.length === 0) {
    try {
      const filePath = path.resolve('public/brands.json')
      const fileContent = await fs.readFile(filePath, 'utf-8')
      brands = JSON.parse(fileContent)
      console.log('📦 Yerel yedek liste yüklendi.')
    } catch (localError) {
      console.error('❌ Yerel veri okuma hatası:', localError)
    }
  }

  return brands
})
