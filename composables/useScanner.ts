import { ref } from 'vue'
import Tesseract from 'tesseract.js'
import { BrowserMultiFormatReader } from '@zxing/library'

export const useScanner = () => {
  const isReady = ref(true)
  const isProcessing = ref(false)
  const codeReader = new BrowserMultiFormatReader()
  let tesseractWorker: Tesseract.Worker | null = null

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
      // 1. ADIM: Güçlendirilmiş Barkod Tarama (Zxing - iPhone/Android uyumlu)
      try {
        const result = await codeReader.decodeFromVideoElement(videoElement)
        if (result) {
          const barcode = result.getText()
          return { barcode }
        }
      } catch (e) {
        // Barkod bulunamadıysa devam et
      }

      // 2. ADIM: OCR (Metin Okuma)
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        const worker = await initOCR()
        const { data: { text } } = await worker.recognize(canvas)
        
        return {
          text: text.trim().toLowerCase(),
        }
      }
    } catch (err) {
      // Sessiz hata yönetimi
    } finally {
      isProcessing.value = false
    }
    
    return null
  }

  return {
    initScanner: () => Promise.resolve(),
    processFrame,
    isReady,
    isProcessing
  }
}
