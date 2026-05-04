import { ref } from 'vue'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import Tesseract from 'tesseract.js'

export const useScanner = () => {
  const isReady = ref(false)
  const isProcessing = ref(false)
  let objectDetector: cocoSsd.ObjectDetection | null = null

  const initScanner = async () => {
    try {
      // V0.4 Hazırlığı: Gelecekte daha gelişmiş model yüklenebilir.
      // Şimdilik sadece tetikleyici (trigger) olarak COCO-SSD kullanıyoruz.
      objectDetector = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
      isReady.value = true
    } catch (err) {
      console.error('TF Model yüklenemedi:', err)
    }
  }

  const processFrame = async (videoElement: HTMLVideoElement): Promise<{ text?: string, barcode?: string } | null> => {
    if (!objectDetector || isProcessing.value) return null
    isProcessing.value = true

    try {
      // 1. Barkod Taraması (Modern tarayıcı desteği varsa)
      let detectedBarcode = ''
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] })
        const barcodes = await barcodeDetector.detect(videoElement)
        if (barcodes.length > 0) {
          detectedBarcode = barcodes[0].rawValue
        }
      }

      // 2. TF.js Object Detection Trigger
      const predictions = await objectDetector.detect(videoElement)
      
      // Obje veya Barkod bulunduysa OCR çalıştır
      if (predictions.length > 0 || detectedBarcode) {
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        
        const { data: { text } } = await Tesseract.recognize(
          canvas,
          'tur+eng',
          { logger: () => {} }
        )
        
        return {
          text: text.trim().toLowerCase(),
          barcode: detectedBarcode
        }
      }
    } catch (err) {
      console.error('Tarama hatası:', err)
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
