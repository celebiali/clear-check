<template>
  <div class="relative w-full h-screen bg-gray-900 overflow-hidden flex flex-col items-center justify-center font-sans">
    
    <!-- Loading State -->
    <div v-if="!isScannerReady" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white backdrop-blur-md">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-green-400 mb-4" />
      <h2 class="text-xl font-semibold">Modeller Yükleniyor...</h2>
      <p class="text-sm text-gray-400 mt-2">Bu işlem ilk seferde biraz zaman alabilir.</p>
    </div>

    <!-- Video Element -->
    <video
      ref="videoElement"
      class="absolute top-0 left-0 w-full h-full object-cover z-0"
      autoplay
      playsinline
      muted
    ></video>
    
    <!-- Scanner Overlay (Target Frame) -->
    <div class="z-10 pointer-events-none relative w-full h-full flex flex-col items-center justify-center p-4">
      
      <!-- Top Instruction -->
      <div class="absolute top-12 left-1/2 -translate-x-1/2 text-white text-base md:text-lg font-medium bg-black/60 px-6 py-3 rounded-full shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md border border-white/10 whitespace-nowrap">
        Ürünü Çerçeveye Yerleştirin
      </div>
      
      <!-- Frame -->
      <div class="w-72 h-72 border-4 border-white/40 rounded-[2rem] relative shadow-2xl">
        <!-- Scanning animation line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-green-400 opacity-80 scan-line shadow-[0_0_15px_#4ade80]"></div>
        
        <!-- Corner decorations -->
        <div class="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-[2rem]"></div>
        <div class="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-[2rem]"></div>
        <div class="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-[2rem]"></div>
        <div class="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-[2rem]"></div>
      </div>
      
      <!-- Bottom Process Indicator -->
      <div v-if="isProcessing" class="absolute bottom-24 flex items-center gap-2 text-white/80 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm text-sm">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
        Analiz ediliyor...
      </div>
    </div>

    <!-- Error State -->
    <div v-if="errorMsg" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 backdrop-blur-xl text-white p-8 rounded-3xl shadow-2xl w-11/12 max-w-sm text-center border border-red-500/50">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto mb-4 text-red-200" />
      <h3 class="font-bold text-2xl mb-3">Kamera Hatası</h3>
      <p class="text-base text-red-100">{{ errorMsg }}</p>
      <UButton color="white" variant="solid" size="lg" class="mt-6 font-bold" @click="initCamera">Tekrar Dene</UButton>
    </div>

    <!-- Result Card -->
    <Transition name="slide-up">
      <div v-if="detectedBrand" class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-11/12 max-w-md bg-white rounded-[2rem] shadow-2xl p-6 transition-all border-t-[10px]" :class="detectedBrand.status === 'boykot' ? 'border-red-500' : 'border-green-500'">
        
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="inline-flex items-center justify-center w-10 h-10 rounded-full shadow-inner" :class="detectedBrand.status === 'boykot' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">
                <UIcon :name="detectedBrand.status === 'boykot' ? 'i-heroicons-x-mark' : 'i-heroicons-check'" class="w-6 h-6" />
              </span>
              <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">{{ detectedBrand.name }}</h2>
            </div>
            <p class="text-sm font-bold tracking-widest uppercase" :class="detectedBrand.status === 'boykot' ? 'text-red-500' : 'text-green-500'">
              {{ detectedBrand.status === 'boykot' ? 'BOYKOTLU ÜRÜN' : 'GÜVENLİ ÜRÜN' }}
            </p>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="rounded-full" @click="clearResult" />
        </div>

        <p v-if="detectedBrand.reason" class="mt-3 text-sm text-gray-600 leading-relaxed font-medium">
          {{ detectedBrand.reason }}
        </p>

        <!-- Alternative Suggestion Card (If boycotted) -->
        <div v-if="detectedBrand.status === 'boykot' && detectedBrand.alternative" class="mt-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-amber-500" />
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Önerilen Alternatif</h4>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-black text-xl text-gray-800">{{ detectedBrand.alternative }}</span>
            <UButton size="md" color="primary" variant="solid" icon="i-heroicons-shopping-bag" class="font-bold shadow-md hover:shadow-lg transition-shadow" to="#" target="_blank">
              Satın Al
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Nuxt 3 auto-imports ref, onMounted, onBeforeUnmount and useScanner
const videoElement = ref(null)
const errorMsg = ref('')
const detectedBrand = ref(null)
const brands = ref([])

let stream = null
let animationFrameId = null

const { initScanner, processFrame, isReady: isScannerReady, isProcessing } = useScanner()

onMounted(async () => {
  // Load Brands JSON
  try {
    const res = await fetch('/brands.json')
    brands.value = await res.json()
  } catch (err) {
    console.error('Brands verisi yüklenemedi', err)
  }

  // Modelleri yükle
  await initScanner()
  
  // Kamerayı başlat
  await initCamera()
})

const initCamera = async () => {
  errorMsg.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      videoElement.value.onloadedmetadata = () => {
        videoElement.value.play()
        startProcessingLoop()
      }
    }
  } catch (err) {
    errorMsg.value = 'Kamera erişimine izin vermeniz gerekiyor veya cihazınızda uygun kamera bulunamadı.'
    console.error('Camera error:', err)
  }
}

// Processing Throttle (Saniyede ~2 kez)
let lastProcessTime = 0
const PROCESS_INTERVAL = 500 

const startProcessingLoop = () => {
  const loop = async (timestamp) => {
    // Sadece modeller hazırsa, şu an başka işlem yapılmıyorsa, sonuç ekranda yoksa ve interval dolduysa çalış
    if (
      isScannerReady.value && 
      !detectedBrand.value && 
      (timestamp - lastProcessTime > PROCESS_INTERVAL)
    ) {
      lastProcessTime = timestamp
      
      if (videoElement.value) {
        const textResult = await processFrame(videoElement.value)
        if (textResult) {
          checkBrandStatus(textResult)
        }
      }
    }
    animationFrameId = requestAnimationFrame(loop)
  }
  animationFrameId = requestAnimationFrame(loop)
}

const checkBrandStatus = (scannedText) => {
  // JSON içindeki markalarla eşleşme ara
  // Marka isimleri text içinde geçiyor mu?
  const match = brands.value.find(b => scannedText.includes(b.name.toLowerCase()))
  
  if (match) {
    detectedBrand.value = match
    triggerVibration(match.status)
  }
}

const triggerVibration = (status) => {
  if ('vibrate' in navigator) {
    if (status === 'boykot') {
      // Boykotlu üründe sert/uzun titreşim deseni
      navigator.vibrate([300, 100, 300, 100, 300])
    } else {
      // Güvenli üründe kısa tek titreşim
      navigator.vibrate([150])
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
