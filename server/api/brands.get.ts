import { defineEventHandler } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    // Proje kök dizinindeki public/brands.json dosyasını oku
    const filePath = path.resolve('public/brands.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const brands = JSON.parse(fileContent)

    return brands
  } catch (error) {
    console.error('Veri okuma hatası:', error)
    // Dosya okunamazsa boş liste dön
    return []
  }
})
