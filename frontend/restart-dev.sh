#!/bin/bash

echo "🧹 Nettoyage des caches..."
rm -rf node_modules/.cache
rm -rf .cache
rm -rf build

echo "✅ Caches nettoyés"
echo "🚀 Démarrage du serveur de développement..."
npm start
