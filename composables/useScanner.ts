import { ref } from 'vue'
import Tesseract from 'tesseract.js'

export const useScanner = () => {
  const isReady = ref(true) // Artık her zaman hazır başlıyoruz
  const isProcessing = ref(false)
  let tesseractWorker: Tesseract.Worker | null = null

  // Tesseract'ı sadece ihtiyaç anında ve arka planda yükle
  const initOCR = async () => {
    if (tesseractWorker) return tesseractWorker
    tesseractWorker = await Tesseract.createWorker('tur+eng', 1, {
      cacheMethod: 'readOnly',
      gzip: true,
      logger: () => {}
    })
    return tesseractWorker
  }

  const processFrame = async (videoElement: HTMLVideoElement): Promise<{ text?: string, barcode?: string } | null> => {
    if (isProcessing.value) return null
    isProcessing.value = true

    try {
      // 1. ADIM: NATIVE BARKOD (Hemen çalışır, 0ms bekleme)
      let detectedBarcode = ''
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] })
        const barcodes = await barcodeDetector.detect(videoElement)
        if (barcodes.length > 0) {
          detectedBarcode = barcodes[0].rawValue
          // Barkod bulursak hemen dön, OCR ile vakit kaybetme
          return { barcode: detectedBarcode }
        }
      }

      // 2. ADIM: OCR (Sadece barkod yoksa ve arka planda hazırsa çalışır)
      // Bu kısım artık ana açılışı engellemiyor.
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth / 2 // Hız için çözünürlüğü düşür
      canvas.height = videoElement.videoHeight / 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        
        // OCR worker'ını sadece gerekliyse ve arka planda başlat
        const worker = await initOCR()
        const { data: { text } } = await worker.recognize(canvas)
        
        return {
          text: text.trim().toLowerCase(),
          barcode: detectedBarcode
        }
      }
    } catch (err) {
      console.warn('Tarama işlemi atlandı (Modeller yükleniyor olabilir).')
    } finally {
      isProcessing.value = false
    }
    
    return null
  }

  return {
    initScanner: () => Promise.resolve(), // Geriye dönük uyumluluk için boş bıraktık
    processFrame,
    isReady,
    isProcessing
  }
}
