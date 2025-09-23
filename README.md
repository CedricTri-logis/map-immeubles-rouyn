# Application de Visualisation des Immeubles - Rouyn-Noranda

Application web pour visualiser et planifier des trajets entre vos immeubles à Rouyn-Noranda.

## Prérequis

- Node.js (version 14 ou supérieure)
- Une clé API Google Maps

## Installation

### 1. Cloner ou télécharger le projet

### 2. Installer les dépendances

```bash
npm install
```

### 3. Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs suivantes:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
4. Créez une clé API dans "APIs & Services" > "Credentials"
5. (Recommandé) Restreignez la clé API à `localhost:3000` pour la sécurité

### 4. Configurer la clé API

1. Copiez le fichier `.env.example` en `.env`:
   ```bash
   cp .env.example .env
   ```

2. Ouvrez le fichier `.env` et remplacez `YOUR_API_KEY_HERE` par votre clé API Google Maps:
   ```
   GOOGLE_MAPS_API_KEY=votre_clé_api_ici
   PORT=3000
   ```

## Démarrage

### Mode production
```bash
npm start
```

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

L'application sera accessible à l'adresse: http://localhost:3000

## Utilisation

1. Les immeubles seront automatiquement géocodés et affichés sur la carte au chargement
2. Utilisez les boutons pour:
   - **Afficher tous les immeubles**: Recentre la carte pour voir tous les marqueurs
   - **Calculer le trajet optimal**: Calcule le chemin le plus court (optimisé par Google)
   - **Effacer le trajet**: Retire le trajet de la carte
3. Cliquez sur un immeuble dans la liste pour zoomer dessus
4. Utilisez la barre de recherche pour filtrer les immeubles

## Fonctionnalités

- Géocodage automatique de toutes les adresses avec Google Geocoding API
- Affichage des immeubles sur Google Maps
- Calcul du trajet optimal avec Google Directions API
- Recherche et filtrage des immeubles
- Vue Street View disponible
- Support jusqu'à 25 waypoints pour le calcul de trajet (limitation Google)

## Déploiement sur Vercel

### Étapes pour déployer:

1. **Installer Vercel CLI** (si pas déjà fait):
   ```bash
   npm i -g vercel
   ```

2. **Se connecter à Vercel**:
   ```bash
   vercel login
   ```

3. **Déployer le projet**:
   ```bash
   vercel
   ```
   Suivez les instructions et acceptez les paramètres par défaut.

4. **Configurer la clé API sur Vercel**:
   ```bash
   vercel env add GOOGLE_MAPS_API_KEY
   ```
   Entrez votre clé API quand demandé, sélectionnez tous les environnements.

5. **Redéployer avec les variables d'environnement**:
   ```bash
   vercel --prod
   ```

### Alternative: Déployer via GitHub

1. Poussez votre code sur GitHub
2. Connectez votre repo GitHub à Vercel via [vercel.com](https://vercel.com)
3. Ajoutez `GOOGLE_MAPS_API_KEY` dans les variables d'environnement sur Vercel Dashboard
4. Déployez automatiquement à chaque push

## Notes

- L'API Google Maps a des quotas gratuits généreux (28,000 requêtes de géocodage/mois)
- Le géocodage Google est beaucoup plus précis pour les adresses québécoises
- Les immeubles sont divisés en groupes de 25 maximum (limite Google Directions API)
- L'optimisation du trajet est faite automatiquement par Google