import { ref, onMounted } from 'vue'

export const useMarketContext = () => {
  const detectedMarketId = ref('GENEL') // Varsayılan genel
  const userCoords = ref({ lat: 0, lng: 0 })

  // Türkiye'deki büyük market zincirlerinin koordinat simülasyonu (V0.5'te API'ye bağlanabilir)
  // Şimdilik sadece mantığı kuruyoruz.
  const detectMarket = async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        // ÖRNEK MANTIK: Belirli koordinat bölgelerine göre market tespiti
        // Gerçekte burada bir API'ye sorgu atılır: "En yakın market ne?"
        // Simülasyon amaçlı rastgele bir market atayalım veya koordinata göre süzgeç kuralım.
        
        // Örn: Eğer koordinatlar Migros'un yoğun olduğu bir bölgedeyse...
        // Şimdilik sessizce arka planda bir market set edelim.
        updateMarketBasedOnLocation(userCoords.value)
      },
      (error) => {
        console.warn('Konum erişimi reddedildi, genel modda devam ediliyor.')
      }
    )
  }

  const updateMarketBasedOnLocation = (coords: { lat: number, lng: number }) => {
    // Burada basit bir "Yakınlık" hesabı yapılabilir.
    // Şimdilik test amaçlı her zaman 'MIGROS' veya 'BIM' döndüren bir mantık kuralım
    // (Geliştirici modunda test için kolaylık sağlar)
    
    // Not: Kullanıcıya bu bilgi gösterilmeyecek.
    detectedMarketId.value = 'MIGROS' // Test için varsayılan Migros
  }

  onMounted(() => {
    detectMarket()
  })

  return {
    detectedMarketId,
    userCoords
  }
}
