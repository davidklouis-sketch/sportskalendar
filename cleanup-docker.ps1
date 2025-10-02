# 🧹 Docker Cleanup Script für Sportskalendar (PowerShell)
# Dieses Script bereinigt alle Docker-Container, Images und Volumes

Write-Host "🧹 Starte Docker-Bereinigung für Sportskalendar..." -ForegroundColor Blue

# Funktionen für farbige Ausgabe
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

try {
    # 1. Alle Container stoppen
    Write-Info "Stoppe alle Sportskalendar-Container..."
    docker-compose -f docker-compose.clean.yml down 2>$null
    Write-Success "Container gestoppt"

    # 2. Alle Container entfernen
    Write-Info "Entferne alle Sportskalendar-Container..."
    docker-compose -f docker-compose.clean.yml rm -f 2>$null
    Write-Success "Container entfernt"

    # 3. Alle Sportskalendar-Images entfernen
    Write-Info "Entferne alle Sportskalendar-Images..."
    $images = docker images -q sportskalendar* 2>$null
    if ($images) {
        $images | ForEach-Object { docker rmi -f $_ 2>$null }
    }
    Write-Success "Images entfernt"

    # 4. Docker-System bereinigen
    Write-Info "Bereinige Docker-System..."
    docker system prune -a -f
    Write-Success "Docker-System bereinigt"

    # 5. Volumes bereinigen (mit Bestätigung)
    Write-Warning "Bereinige Docker-Volumes (alle Daten gehen verloren!)"
    $confirm = Read-Host "Sind Sie sicher? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        docker volume prune -f
        Write-Success "Volumes bereinigt"
    } else {
        Write-Warning "Volumes-Bereinigung übersprungen"
    }

    # 6. Netzwerke bereinigen
    Write-Info "Bereinige ungenutzte Netzwerke..."
    docker network prune -f
    Write-Success "Netzwerke bereinigt"

    # 7. Status anzeigen
    Write-Info "Aktueller Docker-Status:"
    Write-Host "--- Container ---" -ForegroundColor Cyan
    docker ps -a --filter "name=sportskalendar" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    Write-Host "--- Images ---" -ForegroundColor Cyan
    docker images --filter "reference=sportskalendar*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

    Write-Host "--- Volumes ---" -ForegroundColor Cyan
    docker volume ls --filter "name=sportskalendar" --format "table {{.Name}}\t{{.Driver}}"

    Write-Success "Docker-Bereinigung abgeschlossen! 🎉"
    Write-Info "Sie können jetzt die Container neu starten:"
    Write-Host "  docker-compose -f docker-compose.clean.yml up --build -d" -ForegroundColor Yellow

} catch {
    Write-Error "Fehler bei der Docker-Bereinigung: $($_.Exception.Message)"
}

Read-Host "Drücken Sie Enter zum Beenden"
