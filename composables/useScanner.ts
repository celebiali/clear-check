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

  const processFrame = async (videoElement: HTMLVideoElement): Promise<string | null> => {
    if (!objectDetector || isProcessing.value) return null
    isProcessing.value = true

    try {
      // V0.4: TF.js Object Detection Trigger
      const predictions = await objectDetector.detect(videoElement)
      
      // Sadece sahnede genel bir obje varsa devam et
      // Bu sayede düz bir duvara tutulduğunda OCR çalışıp CPU'yu yormaz
      if (predictions.length > 0) {
        
        // V0.1: Tesseract OCR (tur+eng)
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        
        const { data: { text } } = await Tesseract.recognize(
          canvas,
          'tur+eng',
          { logger: () => {} } // Logları kapalı tutuyoruz performansı artırmak için
        )
        
        return text.trim().toLowerCase()
      }

      // V0.3 için Not: Burada Barkod (EAN-13) okuma modülü eklenebilir.
      
    } catch (err) {
      console.error('Frame processing failed:', err)
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
