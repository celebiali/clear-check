<template>
  <div class="fixed inset-0 bg-black overflow-hidden font-sans">
    <!-- Camera Background -->
    <video
      ref="videoElement"
      class="absolute top-0 left-0 w-full h-full object-cover z-0"
      autoplay
      playsinline
      muted
    ></video>

    <!-- Background Loading Status (Non-blocking) -->
    <div v-if="!isScannerReady" class="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-amber-400" />
      <span class="text-[10px] font-black text-white uppercase tracking-widest">Sistem Hazırlanıyor...</span>
    </div>
    
    <!-- Scanner Overlay (Target Frame) -->
    <div class="z-10 pointer-events-none relative w-full h-full flex flex-col items-center justify-center p-4">
      
    <!-- Top Action Bar -->
    <div class="absolute top-8 left-0 w-full z-20 px-6 flex justify-between items-center pointer-events-none">
      <div class="bg-white/10 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/20 text-white text-[10px] font-black tracking-widest uppercase pointer-events-auto shadow-xl">
        ClearCheck <span class="text-green-400 ml-1">Pro</span>
      </div>
      
      <button 
        @click="isSearchOpen = true" 
        class="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white flex items-center justify-center pointer-events-auto hover:bg-white/20 transition-all shadow-xl"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
      </button>
    </div>

    <!-- Search Overlay -->
    <Transition name="fade">
      <div v-if="isSearchOpen" class="fixed inset-0 z-[60] bg-gray-950/95 backdrop-blur-3xl p-6">
        <div class="max-w-md mx-auto h-full flex flex-col pt-12">
          <div class="flex items-center gap-4 mb-8">
            <UInput
              v-model="searchQuery"
              placeholder="Marka ismi yazın..."
              size="xl"
              class="flex-1"
              variant="none"
              autocomplete="off"
              :ui="{ base: 'bg-white/10 text-white text-lg font-bold placeholder-white/30 h-16 px-6 rounded-3xl border border-white/10 focus:border-green-400/50 transition-all' }"
            />
            <UButton color="white" variant="ghost" size="xl" class="rounded-2xl" @click="isSearchOpen = false">Kapat</UButton>
          </div>

          <div v-if="searchResults.length > 0" class="space-y-4">
            <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Önerilen Markalar</h4>
            <div 
              v-for="brand in searchResults" 
              :key="brand.name"
              @click="selectFromSearch(brand)"
              class="bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="brand.status === 'boykot' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'">
                  <UIcon :name="brand.status === 'boykot' ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'" class="w-6 h-6" />
                </div>
                <span class="text-white text-xl font-bold">{{ brand.name }}</span>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="text-white/20" />
            </div>
          </div>
          
          <div v-else-if="searchQuery" class="text-center py-12">
            <p class="text-white/40">Sonuç bulunamadı.</p>
          </div>
        </div>
      </div>
    </Transition>
      
      <!-- Frame -->
      <div class="w-80 h-80 border-2 border-white/20 rounded-[3rem] relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-white/5 backdrop-blur-[2px]">
        <!-- Scanning animation line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-100 scan-line shadow-[0_0_20px_#4ade80]"></div>
        
        <!-- Center Crosshair -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/30 rounded-full"></div>
        
        <!-- Corner decorations -->
        <div class="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-2xl"></div>
        <div class="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-2xl"></div>
        <div class="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-2xl"></div>
        <div class="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-2xl"></div>
      </div>
      
      <!-- Bottom Status -->
      <div class="absolute bottom-28 flex flex-col items-center gap-3">
        <div v-if="isProcessing" class="flex items-center gap-3 text-white bg-green-500/20 px-6 py-2 rounded-full border border-green-500/30 backdrop-blur-md text-xs font-bold uppercase tracking-widest animate-pulse">
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
          Görüntü İşleniyor
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="errorMsg" class="absolute inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-2xl p-4">
      <div class="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 text-center border border-red-50/50">
        <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <UIcon name="i-heroicons-video-camera-slash" class="w-12 h-12 text-red-500" />
        </div>
        <h3 class="font-black text-3xl text-gray-900 mb-6 tracking-tight">Kamera İzni</h3>
        <p class="text-gray-500 text-lg leading-relaxed mb-8">Ürünleri analiz edebilmem için kamera erişimine ihtiyacım var.</p>
        <UButton color="black" variant="solid" size="xl" class="font-black rounded-2xl w-full justify-center py-4 text-lg shadow-xl" @click="initCamera">
          İzin Ver
        </UButton>
      </div>
    </div>

    <!-- Result Card -->
    <Transition name="slide-up">
      <div v-if="detectedBrand" class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-[92%] max-w-md bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 transition-all border border-white/20 overflow-hidden">
        
        <!-- Brand Header Section -->
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3" :class="detectedBrand.status === 'boykot' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'">
                <UIcon :name="detectedBrand.status === 'boykot' ? 'i-heroicons-exclamation-circle' : 'i-heroicons-check-badge'" class="w-8 h-8" />
              </div>
              <div>
                <h2 class="text-3xl font-black text-gray-900 leading-none tracking-tighter">{{ detectedBrand.name }}</h2>
                <span class="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">Analiz Sonucu</span>
              </div>
            </div>
          </div>
          <UButton color="gray" variant="soft" icon="i-heroicons-x-mark" class="rounded-full w-10 h-10 flex items-center justify-center shadow-sm" @click="clearResult" />
        </div>

        <!-- Status Pill -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-sm border" :class="detectedBrand.status === 'boykot' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'">
          <div class="w-2 h-2 rounded-full animate-pulse" :class="detectedBrand.status === 'boykot' ? 'bg-red-500' : 'bg-green-500'"></div>
          {{ detectedBrand.status === 'boykot' ? 'Boykot Kapsamında' : 'Güvenilir Marka' }}
        </div>

        <p v-if="detectedBrand.reason" class="text-sm text-gray-500 leading-relaxed font-medium mb-8 italic">
          "{{ detectedBrand.reason }}"
        </p>

        <!-- Premium Alternative Selection -->
        <div v-if="detectedBrand.status === 'boykot' && detectedBrand.displayAlternatives?.length" class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Size Özel Alternatifler</h4>
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-amber-400" />
          </div>
          
          <div class="grid grid-cols-1 gap-3">
            <div v-for="alt in detectedBrand.displayAlternatives" :key="alt.name" class="group flex items-center justify-between bg-gray-50 hover:bg-black hover:text-white p-4 rounded-[1.5rem] border border-gray-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-white/10">
                  <UIcon name="i-heroicons-shopping-cart" class="w-5 h-5 text-gray-400 group-hover:text-white" />
                </div>
                <span class="font-bold text-lg tracking-tight">{{ alt.name }}</span>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const videoElement = ref(null)
const errorMsg = ref('')
const detectedBrand = ref(null)
const brands = ref([])
const searchQuery = ref('')
const isSearchOpen = ref(false)

const { detectedMarketId } = useMarketContext()

onMounted(async () => {
  // 1. Önce Lokal Hafızadan Yükle (Offline Desteği)
  const cachedBrands = localStorage.getItem('clearcheck_brands')
  if (cachedBrands) {
    brands.value = JSON.parse(cachedBrands)
  }

  // 2. Canlı API üzerinden verileri tazele
  try {
    const res = await fetch('/api/brands')
    const freshData = await res.json()
    if (freshData && freshData.length > 0) {
      brands.value = freshData
      localStorage.setItem('clearcheck_brands', JSON.stringify(freshData))
    }
  } catch (err) {
    console.warn('Canlı veri çekilemedi, çevrimdışı modda devam ediliyor.')
  }

  await initScanner()
  await initCamera()
})

// Akıllı Arama Filtrelemesi
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  return brands.value.filter(b => b.name.toLowerCase().includes(query)).slice(0, 5)
})

const selectFromSearch = (brand) => {
  checkBrandStatus({ text: brand.name.toLowerCase() })
  isSearchOpen.value = false
  searchQuery.value = ''
}

const initCamera = async () => {
  errorMsg.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      videoElement.value.onloadedmetadata = () => {
        videoElement.value.play()
        startProcessingLoop()
      }
    }
  } catch (err) {
    errorMsg.value = 'Kamera erişimi engellendi.'
    console.error('Camera error:', err)
  }
}

let lastProcessTime = 0
const PROCESS_INTERVAL = 500 

const startProcessingLoop = () => {
  const loop = async (timestamp) => {
    if (
      isScannerReady.value && 
      !detectedBrand.value && 
      (timestamp - lastProcessTime > PROCESS_INTERVAL)
    ) {
      lastProcessTime = timestamp
      
      if (videoElement.value) {
        const scanResult = await processFrame(videoElement.value)
        if (scanResult) {
          checkBrandStatus(scanResult)
        }
      }
    }
    animationFrameId = requestAnimationFrame(loop)
  }
  animationFrameId = requestAnimationFrame(loop)
}

const checkBrandStatus = (scanResult) => {
  const { text, barcode } = scanResult
  if (!text && !barcode) return

  // Temizleme fonksiyonu: Boşluk, tire vb. kaldırır
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  const cleanText = normalize(text)

  console.log('🔍 Taranan Metin:', text)
  if (barcode) console.log('🏷 Barkod:', barcode)
  
  // Marka eşleştirme
  const match = brands.value.find(b => {
    const brandName = normalize(b.name)
    return cleanText.includes(brandName) || (barcode && b.barcode === barcode)
  })
  
  if (match) {
    console.log('✅ Eşleşme Bulundu:', match.name)
    const filteredAlternatives = match.alternatives.filter(alt => 
      alt.in.includes(detectedMarketId.value) || alt.in.includes('GENEL')
    )

    detectedBrand.value = {
      ...match,
      displayAlternatives: filteredAlternatives
    }
    
    triggerVibration(match.status)
  }
}

const triggerVibration = (status) => {
  if ('vibrate' in navigator) {
    if (status === 'boykot') {
      navigator.vibrate([200, 100, 200])
    } else {
      navigator.vibrate([100])
    }
  }
}

const clearResult = () => {
  detectedBrand.value = null
}

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<style>
.scan-line {
  animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes scan {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(280px); opacity: 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%) scale(0.95);
  opacity: 0;
}
</style>
