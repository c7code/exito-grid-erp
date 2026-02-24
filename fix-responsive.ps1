# Fix KPI card grids to be responsive (1 col on mobile, 2 on tablet, 4 on desktop)
Get-ChildItem -Path "c:\Users\Euller Matheus\Downloads\EPR EXITO\app\src\pages" -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $original = $content

    # Fix "grid grid-cols-4" -> "grid grid-cols-2 md:grid-cols-4"
    $content = $content -replace 'grid grid-cols-4 gap', 'grid grid-cols-2 md:grid-cols-4 gap'

    # Fix "grid grid-cols-3" -> "grid grid-cols-1 sm:grid-cols-3"
    $content = $content -replace 'grid grid-cols-3 gap', 'grid grid-cols-1 sm:grid-cols-3 gap'

    # Fix header flex that overflows: "flex items-center justify-between" near h1 headers
    # Make sure we don't double-apply already-responsive ones
    $content = $content -replace 'className="flex items-center justify-between">\s*\r?\n\s*<div>\s*\r?\n\s*<h1', 'className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1'

    if ($content -ne $original) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Grid fixed: $($_.Name)"
    }
}
