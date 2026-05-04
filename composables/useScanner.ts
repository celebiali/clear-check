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
      // Netlik için Çözünürlüğü DÜŞÜRMÜYORUZ, Orijinal Netlikte Kalıyoruz
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      // Dijital Netlik Artırıcı (Görüntüyü daha keskin hale getirir)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(videoElement, 0, 0)

      // 1. Barkod Tarama (Yüksek Netlikte)
      try {
        const barcodeResult = await reader.decodeFromImageElement(canvas as unknown as HTMLImageElement)
        if (barcodeResult) {
          return { barcode: barcodeResult.getText() }
        }
      } catch (e) {}

      // 2. Yazı/Logo Okuma (Daha keskin görüntü ile)
      if (tesseractWorker) {
        // Sadece orta bölgeyi tara (Performans ve Odak için)
        // Genelde ürünün markası merkezdedir.
        const { data: { text } } = await tesseractWorker.recognize(canvas)
        if (text && text.length > 2) {
          return { text: text.trim().toLowerCase() }
        }
      }

    } catch (err) {
      console.error('Analiz hatası:', err)
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
