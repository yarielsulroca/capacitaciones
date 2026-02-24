# fix-wayfinder-duplicates.ps1
# Scans all Wayfinder-generated route files and removes duplicate import lines.
# Run this after executing `php artisan wayfinder:generate` if Vite throws:
# "Identifier 'queryParams' has already been declared"

$routesDir = Join-Path $PSScriptRoot "resources\js\routes"
$importFragment = "import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition }"

$files = Get-ChildItem -Recurse -Path $routesDir -Filter "*.ts"
$fixedCount = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $occurrences = ([regex]::Matches($content, [regex]::Escape($importFragment))).Count

    if ($occurrences -gt 1) {
        Write-Host "Fixing duplicate import in: $($file.FullName)"
        $seenImport = $false
        $outputLines = New-Object System.Collections.Generic.List[string]

        # Read the file as bytes and decode with UTF8 to preserve encoding
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        $lines = $text -split "(?<=\r?\n)"

        foreach ($line in $lines) {
            $trimmed = $line.TrimEnd("`r", "`n")
            if ($trimmed -like "import { queryParams*") {
                if (-not $seenImport) {
                    $seenImport = $true
                    $outputLines.Add($line)
                }
                # Skip duplicate
            } else {
                $outputLines.Add($line)
            }
        }

        $fixed = [string]::Concat($outputLines)
        [System.IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.Encoding]::UTF8)
        $fixedCount++
    }
}

if ($fixedCount -eq 0) {
    Write-Host "No duplicate imports found. All route files are clean."
} else {
    Write-Host "`nFixed $fixedCount file(s). Run `npm run dev` or restart Vite to apply changes."
}
