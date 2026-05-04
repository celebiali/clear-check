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
      // V0.4 Hazırlığı: Lite model kullanarak hızı 2 kat artırıyoruz
      objectDetector = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
      
      // Tesseract Worker'ı önceden hazırlayarak ilk taramayı hızlandırıyoruz
      const worker = await Tesseract.createWorker('tur+eng', 1, {
        cacheMethod: 'readOnly', // Modelleri önbellekten oku
        gzip: true, // Daha hızlı veri transferi
        logger: () => {}
      })
      // Not: Worker'ı global veya kalıcı bir yerde tutmak performansı artırır.
      
      isReady.value = true
      console.log('Scanner Sistemleri Hazır.')
    } catch (err) {
      console.error('Sistem yüklenirken hata oluştu:', err)
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

      // 2. TF.js Object Detection (Hassaslaştırılmış)
      const predictions = await objectDetector.detect(videoElement)
      
      // LOG: Geliştirici için ne görüldüğünü yazalım
      if (predictions.length > 0) console.log('Obje Algılandı:', predictions[0].class)
      if (detectedBarcode) console.log('Barkod Algılandı:', detectedBarcode)

      // Tetikleyiciyi esnetiyoruz: Obje olmasa bile belirli aralıklarla OCR'ı dene
      // Veya sadece obje/barkod varsa daha hızlı çalış
      if (predictions.length > 0 || detectedBarcode || Math.random() > 0.8) {
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
