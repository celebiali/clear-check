import { defineEventHandler } from 'h3'

const DATA_SOURCE_URL = 'https://raw.githubusercontent.com/TechForPalestine/boycott-israeli-consumer-goods-dataset/main/data/brands.json'

// Kritik Markalar (API Bozuksa veya Marka Eksikse Devreye Girer)
const fallbackBrands = [
  { name: 'Coca-Cola', status: 'boykot', reason: 'İsrail ekonomisine doğrudan destek.', alternatives: [{ name: 'Uludağ Gazoz', in: ['GENEL'] }, { name: 'Niğde Gazozu', in: ['GENEL'] }] },
  { name: 'Pepsi', status: 'boykot', reason: 'Boykot listesinde yer alıyor.', alternatives: [{ name: 'Uludağ Gazoz', in: ['GENEL'] }] },
  { name: 'Nestle', status: 'boykot', reason: 'İsrail yerleşim birimlerine destek.', alternatives: [{ name: 'Ülker', in: ['GENEL'] }, { name: 'Eti', in: ['GENEL'] }] },
  { name: 'Nescafe', status: 'boykot', reason: 'Nestle iştiraki.', alternatives: [{ name: 'Kahve Dünyası', in: ['GENEL'] }] },
  { name: 'Danone', status: 'boykot', reason: 'Siyasi ve ekonomik destek gerekçesi.', alternatives: [{ name: 'Sütaş', in: ['GENEL'] }] },
  { name: 'Starbucks', status: 'boykot', reason: 'Boykot çağrılarına konu olan politikalar.', alternatives: [{ name: 'Espressolab', in: ['GENEL'] }] },
  { name: 'Lays', status: 'boykot', reason: 'Pepsico iştiraki.', alternatives: [{ name: 'Patos', in: ['GENEL'] }] }
]

export default defineEventHandler(async (event) => {
  try {
    const response = await fetch(DATA_SOURCE_URL)
    let externalBrands = []
    
    if (response.ok) {
      externalBrands = await response.json()
    }

    // Gelen veriyi işle ve fallback ile birleştir
    const apiData = externalBrands.map((item: any) => ({
      name: item.name || item.brand,
      status: 'boykot',
      reason: item.description || 'Boykot listesinde yer alıyor.',
      alternatives: [{ name: 'Yerel Alternatifleri Kontrol Edin', in: ['GENEL'] }]
    }))

    // İsim bazlı tekilleştirme yapalım ki mükerrer kayıt olmasın
    const finalData = [...fallbackBrands]
    
    apiData.forEach((brand: any) => {
      if (!finalData.some(f => f.name.toLowerCase() === brand.name.toLowerCase())) {
        finalData.push(brand)
      }
    })

    return finalData
  } catch (error) {
    console.error('Fetch error:', error)
    return fallbackBrands // Hata durumunda sadece yedek listeyi dön
  }
})
