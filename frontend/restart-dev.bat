@echo off
echo Nettoyage des caches...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .cache rmdir /s /q .cache
if exist build rmdir /s /q build

echo Caches nettoyes
echo Demarrage du serveur de developpement...
npm start
