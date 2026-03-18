$files = Get-ChildItem -Path 'd:\erp-exito-grid\electraflow-api\src' -Recurse -Filter '*.entity.ts'
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $matches = [regex]::Matches($content, '@Column')
    $count = $matches.Count
    Write-Host "$count $($f.FullName)"
}
