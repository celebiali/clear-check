import { defineEventHandler } from 'h3'

// TechForPalestine veya benzeri açık kaynaklı boykot listeleri
const DATA_SOURCE_URL = 'https://raw.githubusercontent.com/TechForPalestine/boycott-israeli-consumer-goods-dataset/main/data/brands.json'

// Yerel market alternatifleri eşleştirme tablosu (Türkiyeye özel)
// Bu tabloyu dışarıdan gelen veriyi zenginleştirmek için kullanacağız.
const marketEnrichment = {
  'Coca-Cola': { alternatives: [{ name: 'Uludağ Gazoz', in: ['MIGROS', 'BIM', 'A101'] }, { name: 'Niğde Gazozu', in: ['BIM'] }] },
  'Pepsi': { alternatives: [{ name: 'Uludağ Gazoz', in: ['MIGROS', 'BIM', 'A101'] }] },
  'Doritos': { alternatives: [{ name: 'Patos', in: ['MIGROS', 'A101'] }, { name: 'Chips Master', in: ['BIM'] }] },
  'Lays': { alternatives: [{ name: 'Patos', in: ['MIGROS', 'A101'] }, { name: 'Chips Master', in: ['BIM'] }] },
  'Nescafe': { alternatives: [{ name: 'Kurukahveci Mehmet Efendi', in: ['MIGROS', 'BIM', 'A101'] }, { name: 'Kahve Dünyası', in: ['MIGROS'] }] },
  'Algida': { alternatives: [{ name: 'Golf Dondurma', in: ['MIGROS', 'A101'] }, { name: 'Dost Dondurma', in: ['BIM'] }] },
  'Ariel': { alternatives: [{ name: 'ABC', in: ['MIGROS', 'BIM', 'A101'] }, { name: 'Bingo', in: ['MIGROS'] }] }
}

export default defineEventHandler(async (event) => {
  try {
    // 1. Canlı veriyi GitHub'dan çek
    const response = await fetch(DATA_SOURCE_URL)
    if (!response.ok) throw new Error('Dış veri kaynağına ulaşılamadı.')
    
    const externalBrands = await response.json()
    
    // 2. Gelen veriyi bizim formatımıza ve market yapımıza uyarla
    // TechForPalestine verisi genelde { name, description, category } yapısındadır.
    const enrichedData = externalBrands.map((item: any) => {
      const name = item.name || item.brand
      const enrichment = marketEnrichment[name as keyof typeof marketEnrichment]
      
      return {
        name: name,
        status: 'boykot',
        reason: item.description || item.reason || 'Boykot listesinde yer alıyor.',
        alternatives: enrichment ? enrichment.alternatives : [
          { name: 'Yerel Alternatifleri Kontrol Edin', in: ['GENEL'] }
        ]
      }
    })

    return enrichedData
  } catch (error) {
    console.error('Fetch error:', error)
    // Hata durumunda boş dönmek yerine bir fallback mekanizması veya hata mesajı dönebiliriz.
    return []
  }
})
