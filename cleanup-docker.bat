@echo off
REM 🧹 Docker Cleanup Script für Sportskalendar (Windows)
REM Dieses Script bereinigt alle Docker-Container, Images und Volumes

echo 🧹 Starte Docker-Bereinigung für Sportskalendar...

REM 1. Alle Container stoppen
echo [INFO] Stoppe alle Sportskalendar-Container...
docker-compose -f docker-compose.clean.yml down 2>nul
echo [SUCCESS] Container gestoppt

REM 2. Alle Container entfernen
echo [INFO] Entferne alle Sportskalendar-Container...
docker-compose -f docker-compose.clean.yml rm -f 2>nul
echo [SUCCESS] Container entfernt

REM 3. Alle Sportskalendar-Images entfernen
echo [INFO] Entferne alle Sportskalendar-Images...
for /f %%i in ('docker images -q sportskalendar* 2^>nul') do docker rmi -f %%i 2>nul
echo [SUCCESS] Images entfernt

REM 4. Docker-System bereinigen
echo [INFO] Bereinige Docker-System...
docker system prune -a -f
echo [SUCCESS] Docker-System bereinigt

REM 5. Volumes bereinigen (mit Bestätigung)
echo [WARNING] Bereinige Docker-Volumes (alle Daten gehen verloren!)
set /p confirm="Sind Sie sicher? (y/N): "
if /i "%confirm%"=="y" (
    docker volume prune -f
    echo [SUCCESS] Volumes bereinigt
) else (
    echo [WARNING] Volumes-Bereinigung übersprungen
)

REM 6. Netzwerke bereinigen
echo [INFO] Bereinige ungenutzte Netzwerke...
docker network prune -f
echo [SUCCESS] Netzwerke bereinigt

REM 7. Status anzeigen
echo [INFO] Aktueller Docker-Status:
echo --- Container ---
docker ps -a --filter "name=sportskalendar" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo --- Images ---
docker images --filter "reference=sportskalendar*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo --- Volumes ---
docker volume ls --filter "name=sportskalendar" --format "table {{.Name}}\t{{.Driver}}"

echo [SUCCESS] Docker-Bereinigung abgeschlossen! 🎉
echo [INFO] Sie können jetzt die Container neu starten:
echo   docker-compose -f docker-compose.clean.yml up --build -d

pause
