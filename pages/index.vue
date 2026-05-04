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

    <!-- Top Action Bar -->
    <div class="absolute top-8 left-0 w-full z-[100] px-6 flex justify-between items-center">
      <div class="bg-white/10 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/20 text-white text-[10px] font-black tracking-widest uppercase shadow-xl">
        ClearCheck <span class="text-green-400 ml-1">Pro</span>
      </div>
      
      <button 
        @click="openSearch" 
        class="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
      </button>
    </div>

    <!-- Search Overlay -->
    <div v-if="isSearchOpen" class="fixed inset-0 z-[200] bg-gray-950 p-6 overflow-y-auto">
      <div class="max-w-md mx-auto flex flex-col pt-8">
        <div class="flex items-center gap-3 mb-6">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Marka ismi yazın..."
            class="flex-1 bg-white/10 text-white text-lg font-bold placeholder-white/30 h-14 px-6 rounded-2xl border border-white/10 focus:border-green-400/50 focus:outline-none transition-all"
          />
          <button 
            @click="closeSearch"
            class="text-white/60 text-sm font-bold px-4 py-3 rounded-xl hover:bg-white/10 transition-all"
          >
            Kapat
          </button>
        </div>

        <!-- Search Results -->
        <div v-if="searchResults.length > 0" class="space-y-3">
          <h4 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Sonuçlar</h4>
          <div 
            v-for="brand in searchResults" 
            :key="brand.name"
            @click="selectFromSearch(brand)"
            class="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer active:bg-white/10 transition-all"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="brand.status === 'boykot' ? 'bg-red-500/20' : 'bg-green-500/20'">
                <UIcon 
                  :name="brand.status === 'boykot' ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'" 
                  class="w-6 h-6"
                  :class="brand.status === 'boykot' ? 'text-red-400' : 'text-green-400'"
                />
              </div>
              <span class="text-white text-lg font-bold">{{ brand.name }}</span>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="text-white/20 w-5 h-5" />
          </div>
        </div>
        
        <div v-else-if="searchQuery.length >= 2" class="text-center py-12">
          <p class="text-white/40 text-sm">Bu isimde bir marka bulunamadı.</p>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-white/30 text-sm">Aramak istediğiniz marka ismini yazın.</p>
        </div>
      </div>
    </div>

    <!-- Scanner Overlay -->
    <div class="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
      <div class="w-72 h-72 border-2 border-white/20 rounded-[3rem] relative overflow-hidden bg-white/5">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent scan-line shadow-[0_0_20px_#4ade80]"></div>
        <div class="absolute top-4 left-4 w-10 h-10 border-t-3 border-l-3 border-green-400 rounded-tl-xl"></div>
        <div class="absolute top-4 right-4 w-10 h-10 border-t-3 border-r-3 border-green-400 rounded-tr-xl"></div>
        <div class="absolute bottom-4 left-4 w-10 h-10 border-b-3 border-l-3 border-green-400 rounded-bl-xl"></div>
        <div class="absolute bottom-4 right-4 w-10 h-10 border-b-3 border-r-3 border-green-400 rounded-br-xl"></div>
      </div>
    </div>

    <!-- Debug Log -->
    <div class="absolute bottom-4 left-0 w-full z-[90] px-6 pointer-events-none">
      <div class="bg-black/70 backdrop-blur text-[10px] text-white/50 p-2 rounded-xl text-center font-mono">
        {{ debugLog }}
      </div>
    </div>

    <!-- Error State -->
    <div v-if="errorMsg" class="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 p-6">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <UIcon name="i-heroicons-video-camera-slash" class="w-10 h-10 text-red-500" />
        </div>
        <h3 class="font-black text-2xl text-gray-900 mb-4">Kamera İzni</h3>
        <p class="text-gray-500 text-sm leading-relaxed mb-6">Ürünleri analiz edebilmem için kamera erişimine ihtiyacım var.</p>
        <button @click="initCamera" class="bg-black text-white font-bold rounded-2xl w-full py-4 text-base">İzin Ver</button>
      </div>
    </div>

    <!-- Result Card -->
    <Transition name="slide-up">
      <div v-if="detectedBrand" class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[120] w-[90%] max-w-md bg-white rounded-3xl shadow-2xl p-6 border-t-4" :class="detectedBrand.status === 'boykot' ? 'border-red-500' : 'border-green-500'">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="detectedBrand.status === 'boykot' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'">
              <UIcon :name="detectedBrand.status === 'boykot' ? 'i-heroicons-x-mark' : 'i-heroicons-check'" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-2xl font-black text-gray-900">{{ detectedBrand.name }}</h2>
              <span class="text-xs font-bold uppercase tracking-widest" :class="detectedBrand.status === 'boykot' ? 'text-red-500' : 'text-green-500'">
                {{ detectedBrand.status === 'boykot' ? 'Boykot Kapsamında' : 'Güvenilir' }}
              </span>
            </div>
          </div>
          <button @click="clearResult" class="text-gray-400 p-2 rounded-full hover:bg-gray-100"><UIcon name="i-heroicons-x-mark" class="w-5 h-5" /></button>
        </div>
        <p v-if="detectedBrand.reason" class="text-sm text-gray-500 mb-4">{{ detectedBrand.reason }}</p>
        <div v-if="detectedBrand.status === 'boykot' && detectedBrand.displayAlternatives?.length" class="bg-gray-50 rounded-2xl p-4">
          <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Alternatifler</h4>
          <div class="space-y-2">
            <div v-for="alt in detectedBrand.displayAlternatives" :key="alt.name" class="flex items-center gap-3 bg-white p-3 rounded-xl">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 shrink-0" />
              <span class="font-bold text-gray-800">{{ alt.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const videoElement = ref(null)
const searchInputRef = ref(null)
const errorMsg = ref('')
const detectedBrand = ref(null)
const brands = ref([])
const searchQuery = ref('')
const isSearchOpen = ref(false)
const debugLog = ref('Başlatılıyor...')

const { initScanner, processFrame, isReady: isScannerReady, isProcessing } = useScanner()
const { detectedMarketId } = useMarketContext()

let stream = null
let animationFrameId = null
let lastProcessTime = 0
const PROCESS_INTERVAL = 500

onMounted(async () => {
  try {
    const cached = localStorage.getItem('clearcheck_brands')
    if (cached) brands.value = JSON.parse(cached)
    const res = await fetch('/api/brands')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      brands.value = data
      localStorage.setItem('clearcheck_brands', JSON.stringify(data))
    }
    debugLog.value = `${brands.value.length} marka yüklendi.`
  } catch (e) {
    debugLog.value = 'Veri yüklenirken hata oluştu.'
  }
  await initScanner()
  await initCamera()
})

const searchResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []
  const q = searchQuery.value.toLowerCase().trim()
  return brands.value.filter(b => b.name.toLowerCase().includes(q)).slice(0, 10)
})

const openSearch = () => {
  isSearchOpen.value = true
  nextTick(() => { if (searchInputRef.value) searchInputRef.value.focus() })
}

const closeSearch = () => { isSearchOpen.value = false; searchQuery.value = '' }

const selectFromSearch = (brand) => {
  showBrandResult(brand)
  closeSearch()
}

const initCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      videoElement.value.onloadedmetadata = () => {
        videoElement.value.play()
        startProcessingLoop()
      }
    }
  } catch (e) { errorMsg.value = 'Kamera açılamadı.' }
}

const startProcessingLoop = () => {
  const loop = async (timestamp) => {
    if (isScannerReady.value && !detectedBrand.value && !isSearchOpen.value && !isProcessing.value && (timestamp - lastProcessTime > PROCESS_INTERVAL)) {
      lastProcessTime = timestamp
      if (videoElement.value?.readyState >= 2) {
        const result = await processFrame(videoElement.value)
        if (result?.barcode) await lookupBarcode(result.barcode)
      }
    }
    animationFrameId = requestAnimationFrame(loop)
  }
  animationFrameId = requestAnimationFrame(loop)
}

const lookupBarcode = async (barcode) => {
  debugLog.value = `Sorgulanıyor: ${barcode}`
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1 && data.product?.brands) {
      const productBrand = data.product.brands.split(',')[0].trim()
      debugLog.value = `Ürün: ${productBrand}`
      const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      const productBrandClean = normalize(productBrand)
      const match = brands.value.find(b => {
        const bName = normalize(b.name)
        return productBrandClean.includes(bName) || bName.includes(productBrandClean)
      })
      if (match) showBrandResult(match)
    } else {
      debugLog.value = 'Barkod bulunamadı.'
    }
  } catch (e) { debugLog.value = 'API hatası.' }
}

const showBrandResult = (brand) => {
  const filteredAlternatives = brand.alternatives?.filter(alt => alt.in.includes(detectedMarketId.value) || alt.in.includes('GENEL')) || []
  detectedBrand.value = { ...brand, displayAlternatives: filteredAlternatives }
  if ('vibrate' in navigator) navigator.vibrate(brand.status === 'boykot' ? [200, 100, 200] : [100])
}

const clearResult = () => { detectedBrand.value = null; debugLog.value = 'Tarama aktif.' }

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (stream) stream.getTracks().forEach(t => t.stop())
})
</script>

<style>
.scan-line { animation: scan 2.5s ease-in-out infinite; }
@keyframes scan { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(280px); opacity: 0; } }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }
</style>
