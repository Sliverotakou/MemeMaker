package com.mememaker

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.net.URL

class MemeShareModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MemeShare"

    @ReactMethod
    fun shareMeme(imagePath: String, message: String, promise: Promise) {
        val context = reactApplicationContext
        
        // Exécuter dans un thread séparé en cas de téléchargement d'image distante
        Thread {
            try {
                val file = if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                    // Télécharger l'image distante dans le cache temporaire de l'application
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

                // Générer l'URI sécurisé avec FileProvider
                val authority = "${context.packageName}.fileprovider"
                val contentUri: Uri = FileProvider.getUriForFile(context, authority, file)

                // Créer l'Intent de partage d'image
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "image/*"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_TEXT, message)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                // Créer le sélecteur natif (Chooser)
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
}
