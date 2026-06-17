# Upload images to your production server using scp (OpenSSH)
# Usage: powershell -ExecutionPolicy Bypass -File .\upload-images.ps1

$hostname = Read-Host "Enter server hostname (e.g. eclipseprinters.com)"
$user = Read-Host "Enter SSH username (e.g. ubuntu or deploy)"
$port = Read-Host "Enter SSH port (press Enter for default 22)"
if ([string]::IsNullOrWhiteSpace($port)) { $port = 22 }
$remotePath = Read-Host "Enter remote images directory (e.g. /var/www/your-site/public_html/images/)"

$files = @(
    'eclipseprinters-stamp-s312.jpg',
    'eclipseprinters-stamp-s300.jpg',
    'eclipseprinters-stamp-s303.jpg',
    'eclipseprinters-custom-30x50.jpg',
    'eclipseprinters-22x58-yellow.jpg',
    'eclipseprinters-22x58.jpg',
    'eclipseprinters-wooden-stamp.jpg'
)

Write-Host "Uploading to $user@$hostname`:$remotePath on port $port`n"

# Verify local files
$missing = @()
foreach ($f in $files) {
    $local = Join-Path -Path $PSScriptRoot -ChildPath "images\$f"
    if (-not (Test-Path $local)) { $missing += $f }
}

if ($missing.Count -gt 0) {
    Write-Host "Missing files in ./images/:`n" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host " - $_" }
    Write-Host "`nPlease place the files in the project's ./images/ directory and re-run this script." -ForegroundColor Yellow
    exit 1
}

# Upload each file using scp
foreach ($f in $files) {
    $local = Join-Path -Path $PSScriptRoot -ChildPath "images\$f"
    $remote = "$user@$hostname`:`${remotePath}$f"
    Write-Host "Uploading $f..."
    # Run scp (will prompt for password if not using keys)
    $proc = Start-Process -FilePath scp -ArgumentList @('-P',$port,$local,$remote) -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Host "Failed to upload $f (exit code $($proc.ExitCode))." -ForegroundColor Red
    } else {
        Write-Host "Uploaded $f" -ForegroundColor Green
    }
}

Write-Host "All done. Verify files are reachable at https://$hostname/images/" -ForegroundColor Cyan

Write-Host "If you don't have scp available, use your hosting control panel or WinSCP for SFTP uploads." -ForegroundColor Gray
