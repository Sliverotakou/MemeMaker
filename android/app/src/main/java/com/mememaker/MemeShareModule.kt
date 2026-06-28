package com.mememaker

import android.content.Intent
import android.graphics.*
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.URL

class MemeShareModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MemeShare"

    @ReactMethod
    fun shareMeme(imagePath: String, message: String, promise: Promise) {
        val context = reactApplicationContext

        Thread {
            try {
                val file = if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                    val cacheDir = context.cacheDir
                    val tempFile = File(cacheDir, "shared_meme_${System.currentTimeMillis()}.png")

                    val urlObj = URL(imagePath)
                    urlObj.openStream().use { input ->
                        tempFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    tempFile
                } else {
                    var cleanPath = imagePath
                    if (cleanPath.startsWith("file://")) {
                        cleanPath = cleanPath.substring(7)
                    }
                    File(cleanPath)
                }

                if (!file.exists()) {
                    promise.reject("FILE_NOT_FOUND", "Le fichier image n'existe pas : ${file.absolutePath}")
                    return@Thread
                }

                // Décoder le bitmap original
                val originalBitmap = BitmapFactory.decodeFile(file.absolutePath)
                if (originalBitmap == null) {
                    promise.reject("DECODE_ERROR", "Impossible de décoder l'image.")
                    return@Thread
                }

                // Créer un bitmap mutable pour dessiner le texte dessus
                val mutableBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
                originalBitmap.recycle()

                val canvas = Canvas(mutableBitmap)
                val width = mutableBitmap.width.toFloat()
                val height = mutableBitmap.height.toFloat()

                // Extraire top_text et bottom_text depuis le message
                val topText = extractTopText(message)
                val bottomText = extractBottomText(message)

                // Dessiner les textes sur l'image
                if (topText.isNotEmpty()) {
                    drawMemeText(canvas, topText, width, height * 0.08f, width)
                }
                if (bottomText.isNotEmpty()) {
                    drawMemeText(canvas, bottomText, width, height * 0.88f, width)
                }

                // Sauvegarder le bitmap modifié
                val outputFile = File(context.cacheDir, "meme_share_${System.currentTimeMillis()}.png")
                FileOutputStream(outputFile).use { out ->
                    mutableBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                }
                mutableBitmap.recycle()

                // Partager avec FileProvider
                val authority = "${context.packageName}.fileprovider"
                val contentUri: Uri = FileProvider.getUriForFile(context, authority, outputFile)

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "image/*"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_TEXT, message)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooserIntent = Intent.createChooser(shareIntent, "Partager mon Mème via...")

                val currentAct = reactApplicationContext.currentActivity
                if (currentAct != null) {
                    currentAct.startActivity(chooserIntent)
                } else {
                    chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(chooserIntent)
                }

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SHARE_ERROR", "Erreur lors du partage : ${e.message}", e)
            }
        }.start()
    }

    @ReactMethod
    fun shareSticker(imagePath: String, promise: Promise) {
        val context = reactApplicationContext

        Thread {
            try {
                val file = if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                    val cacheDir = context.cacheDir
                    val tempFile = File(cacheDir, "shared_sticker_${System.currentTimeMillis()}.webp")

                    val urlObj = URL(imagePath)
                    urlObj.openStream().use { input ->
                        tempFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    tempFile
                } else {
                    var cleanPath = imagePath
                    if (cleanPath.startsWith("file://")) {
                        cleanPath = cleanPath.substring(7)
                    }
                    File(cleanPath)
                }

                if (!file.exists()) {
                    promise.reject("FILE_NOT_FOUND", "Le fichier sticker n'existe pas : ${file.absolutePath}")
                    return@Thread
                }

                // Partager avec FileProvider
                val authority = "${context.packageName}.fileprovider"
                val contentUri: Uri = FileProvider.getUriForFile(context, authority, file)

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "image/webp"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooserIntent = Intent.createChooser(shareIntent, "Partager mon Sticker via...")

                val currentAct = reactApplicationContext.currentActivity
                if (currentAct != null) {
                    currentAct.startActivity(chooserIntent)
                } else {
                    chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(chooserIntent)
                }

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SHARE_ERROR", "Erreur lors du partage du sticker : ${e.message}", e)
            }
        }.start()
    }

    /**
     * Dessine un texte de style mème (blanc, gras, contour noir épais) sur le canvas.
     */
    private fun drawMemeText(canvas: Canvas, text: String, canvasWidth: Float, yPosition: Float, maxWidth: Float) {
        val fontSize = canvasWidth * 0.07f
        val padding = canvasWidth * 0.05f

        val paint = Paint().apply {
            color = Color.WHITE
            textSize = fontSize
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
            isAntiAlias = true
        }

        val strokePaint = Paint(paint).apply {
            style = Paint.Style.STROKE
            strokeWidth = fontSize * 0.12f
            color = Color.BLACK
        }

        val textToUpper = text.uppercase()
        val availableWidth = maxWidth - (padding * 2)

        // Couper le texte en lignes si nécessaire
        val lines = wrapText(textToUpper, paint, availableWidth)

        val centerX = canvasWidth / 2f
        var currentY = yPosition

        for (line in lines) {
            // Contour noir d'abord
            canvas.drawText(line, centerX, currentY, strokePaint)
            // Texte blanc par-dessus
            canvas.drawText(line, centerX, currentY, paint)
            currentY += fontSize * 1.2f
        }
    }

    /**
     * Découpe le texte en lignes adaptées à la largeur disponible.
     */
    private fun wrapText(text: String, paint: Paint, maxWidth: Float): List<String> {
        val words = text.split(" ")
        val lines = mutableListOf<String>()
        var currentLine = ""

        for (word in words) {
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            if (paint.measureText(testLine) <= maxWidth) {
                currentLine = testLine
            } else {
                if (currentLine.isNotEmpty()) {
                    lines.add(currentLine)
                }
                currentLine = word
            }
        }
        if (currentLine.isNotEmpty()) {
            lines.add(currentLine)
        }

        return lines
    }

    /**
     * Extrait le top_text depuis le message de partage.
     * Format attendu : "... \"TOP_TEXT - BOTTOM_TEXT\""
     */
    private fun extractTopText(message: String): String {
        val match = Regex("\"(.+?)\\s*-\\s*(.+?)\"").find(message)
        return match?.groupValues?.getOrNull(1)?.trim() ?: ""
    }

    /**
     * Extrait le bottom_text depuis le message de partage.
     */
    private fun extractBottomText(message: String): String {
        val match = Regex("\"(.+?)\\s*-\\s*(.+?)\"").find(message)
        return match?.groupValues?.getOrNull(2)?.trim() ?: ""
    }
}
