import { ref } from 'vue'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import Tesseract from 'tesseract.js'

export const useScanner = () => {
  const isReady = ref(false)
  const isProcessing = ref(false)
  let reader: BrowserMultiFormatReader | null = null
  let tesseractWorker: Tesseract.Worker | null = null

  const initScanner = async () => {
    reader = new BrowserMultiFormatReader()
    // Tesseract'ı arka planda, kullanıcıyı bekletmeden hazırla
    tesseractWorker = await Tesseract.createWorker('tur+eng', 1, {
      cacheMethod: 'readOnly',
      logger: () => {}
    })
    isReady.value = true
  }

  const processFrame = async (videoElement: HTMLVideoElement): Promise<{ barcode?: string, text?: string } | null> => {
    if (isProcessing.value || !reader) return null
    isProcessing.value = true

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth / 1.5 // Performans için biraz küçült
      canvas.height = videoElement.videoHeight / 1.5
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      // 1. KANAL: Barkod Tarama (Hızlı)
      try {
        const barcodeResult = await reader.decodeFromImageElement(canvas as unknown as HTMLImageElement)
        if (barcodeResult) {
          return { barcode: barcodeResult.getText() }
        }
      } catch (e) {
        // Barkod yoksa devam et
      }

      // 2. KANAL: Yazı/Logo Okuma (OCR)
      if (tesseractWorker) {
        const { data: { text } } = await tesseractWorker.recognize(canvas)
        if (text && text.length > 3) {
          return { text: text.trim().toLowerCase() }
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
    initScanner,
    processFrame,
    isReady,
    isProcessing
  }
}
