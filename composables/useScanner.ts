import { ref } from 'vue'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

export const useScanner = () => {
  const isReady = ref(false)
  const isProcessing = ref(false)
  let reader: BrowserMultiFormatReader | null = null

  const initScanner = async () => {
    reader = new BrowserMultiFormatReader()
    isReady.value = true
  }

  const processFrame = async (videoElement: HTMLVideoElement): Promise<{ barcode: string } | null> => {
    if (isProcessing.value || !reader) return null
    isProcessing.value = true

    try {
      // 1. Video karesini yakala
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(videoElement, 0, 0)

      // 2. Canvas'ı bir imaj gibi okut (En kararlı yöntem)
      const result = await reader.decodeFromImageElement(canvas as unknown as HTMLImageElement)
      
      if (result) {
        return { barcode: result.getText() }
      }
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        // console.warn('Tarama hatası:', err)
      }
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
