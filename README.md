# MemeMaker

MemeMaker est une application mobile React Native de génération de mèmes propulsée par l'Intelligence Artificielle (Gemini AI et Pollinations.ai). Elle arbore un style visuel "Néo-Brutaliste" unique, épuré et audacieux.

## Fonctionnalités Principales

*   **Context Reader** : Décrivez une situation ou collez une conversation, et l'IA génère automatiquement un texte humoristique adapté avec des suggestions de mise en page.
*   **Voice-to-Meme** : Enregistrez votre voix directement depuis l'application. L'IA retranscrit l'audio, détecte l'émotion et crée un mème sur-mesure !
*   **Génération d'Images par IA** : Transformez vos mèmes textuels en images réelles grâce à Pollinations.ai.
*   **Historique et Sauvegarde** : Sauvegardez vos créations localement et retrouvez-les dans votre flux personnel.
*   **Partage Facile** : Partagez instantanément vos œuvres générées avec vos amis via les réseaux sociaux.
*   **Design Néo-Brutaliste** : Une interface utilisateur sans émojis, avec des ombres marquées, des couleurs vives (Jaune, Cyan, Rose) et des bordures épaisses.

---

## ⚠️ Important : Architecture Backend

Cette application mobile (le client) fonctionne en tandem avec une API Backend dédiée pour gérer les requêtes lourdes d'Intelligence Artificielle de manière sécurisée (traitement audio, requêtes Gemini, etc.).

**Le code source du backend est hébergé séparément sur un dépôt public :**
👉 **[Backend MemeMaker - Repository GitHub](https://github.com/Junior-NB/MemeMakerBackend)**

Pour faire fonctionner cette application localement, vous devez **impérativement** cloner et lancer le backend en parallèle.

---

## Prérequis

*   [Node.js](https://nodejs.org/) (version 20+ recommandée)
*   [React Native CLI environment setup](https://reactnative.dev/docs/environment-setup) (Android Studio / SDK Android)

## Installation & Démarrage

1.  **Cloner le projet**
    ```bash
    git clone <votre_repo_mobile>
    cd MemeMaker
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```
    *Note: Ce projet utilise `react-native-nitro-modules` et `react-native-audio-recorder-player` pour la capture audio. Assurez-vous que votre environnement C++ (NDK/CMake) est correctement configuré pour Android.*

3.  **Configurer le backend local**
    N'oubliez pas de rediriger les ports de votre émulateur Android vers votre backend local si ce dernier tourne sur le port 3000 :
    ```bash
    adb reverse tcp:3000 tcp:3000
    ```

4.  **Lancer l'application (Android)**
    ```bash
    npm run android
    ```

## Technologies Utilisées

*   **Frontend** : React Native, TypeScript
*   **Style** : Néo-Brutalisme (Custom CSS/StyleSheets)
*   **Audio** : `react-native-audio-recorder-player`
*   **Backend (API)** : Node.js, Express (Voir [repo backend](https://github.com/Junior-NB/MemeMakerBackend))
*   **IA** : Google Gemini (Texte & Audio), Pollinations.ai (Génération d'images)
