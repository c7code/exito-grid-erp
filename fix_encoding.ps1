
# Final definitive encoding fix using confirmed codepoints
# Pattern confirmed: ó = chars(0xC3, 0x192, 0xC2, 0xB3) in Unicode terms
# U+00C3 = Ã, U+0192 = ƒ, U+00C2 = Â, U+00B3 = ³

$path = "c:\Users\Euller Matheus\exito-grid-erp\app\src\pages\admin\SolarProjects.tsx"
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Build prefix: U+00C3 + U+0192 + U+00C2
$A = [string][char]0x00C3  # Ã
$f = [string][char]0x0192  # ƒ
$B = [string][char]0x00C2  # Â
$pfx = $A + $f + $B        # prefix for all 4-char garbled sequences

# Build all 4-char garbled -> correct mappings
# These are in order of specificity (longer sequences first to avoid partial matches)
$r = @(
    # ção / ção patterns (2 garbled chars in sequence)
    @($pfx + [char]0x00A7 + $pfx + [char]0x00A3 + "o", "ção"),   # ção suffix
    @($pfx + [char]0x00A7 + $pfx + [char]0x00B5 + "es", "ções"), # ções suffix  
    
    # Individual accented chars
    @($pfx + [char]0x00B3, "ó"),   # ó
    @($pfx + [char]0x00A9, "é"),   # é  
    @($pfx + [char]0x00A7, "ç"),   # ç
    @($pfx + [char]0x00A3, "ã"),   # ã
    @($pfx + [char]0x00A1, "á"),   # á
    @($pfx + [char]0x00AD, "í"),   # í
    @($pfx + [char]0x00B5, "õ"),   # õ
    @($pfx + [char]0x00B4, "ô"),   # ô
    @($pfx + [char]0x00AA, "ê"),   # ê
    @($pfx + [char]0x00BA, "ú"),   # ú
    @($pfx + [char]0x00BB, "û"),   # û
    @($pfx + [char]0x00A2, "â"),   # â
    @($pfx + [char]0x00A0, "à"),   # à
    @($pfx + [char]0x009C, "Ü"),   # capital cases
    @($pfx + [char]0x0081, "Á"),
    @($pfx + [char]0x0089, "É"),
    @($pfx + [char]0x008D, "Í"),
    @($pfx + [char]0x0093, "Ó"),
    @($pfx + [char]0x009A, "Ú"),
    @($pfx + [char]0x008A, "Ê"),
    @($pfx + [char]0x008E, "Î"),
    @($pfx + [char]0x0083, "Ã"),
    @($pfx + [char]0x0087, "Ç"),
    
    # Em dash and special chars (different prefix)
    @($A + [char]0x0080 + [char]0x0094, "—"),  # em dash
    @($A + [char]0x0080 + [char]0x0093, "–"),  # en dash  
    @($A + [char]0x0080 + [char]0x00A2, "•"),  # bullet
    @($A + [char]0x0080 + [char]0x009C, '"'),  # left quote
    @($A + [char]0x0080 + [char]0x009D, '"'),  # right quote
    
    # Remaining 2-char sequences (simpler cases with just C3 prefix)
    @($A + [char]0x00A3, "ã"),
    @($A + [char]0x00B5, "õ"),
    @($A + [char]0x00A9, "é"),
    @($A + [char]0x00B3, "ó"),
    @($A + [char]0x00A7, "ç"),
    @($A + [char]0x00A1, "á"),
    @($A + [char]0x00AD, "í"),
    @($A + [char]0x00B4, "ô"),
    @($A + [char]0x00AA, "ê"),
    @($A + [char]0x00BA, "ú"),
    @($A + [char]0x00BB, "û"),
    @($A + [char]0x00A2, "â"),
    @($A + [char]0x00B1, "ñ"),
    
    # C2 sequences  
    @($B + [char]0x00B0, "°"),
    @($B + [char]0x00B2, "²"),
    @($B + [char]0x00B3, "³"),
    @($B + [char]0x00A0, " ")
)

$fixed = $text
$total = 0
foreach ($pair in $r) {
    $wrong = $pair[0]
    $correct = $pair[1]
    if ($fixed.Contains($wrong)) {
        $before = $fixed
        $fixed = $fixed.Replace($wrong, $correct)
        $cnt = ($before.Length - $fixed.Length) / ($wrong.Length - $correct.Length)
        Write-Host "Replaced $cnt x -> '$correct'"
        $total += [int]$cnt
    }
}

Write-Host "`nTotal: $total replacements"

# Quick verify
$testLines = @("Diagn", "Simula", "Imov", "Analise", "tecnic")
foreach ($t in $testLines) {
    $idx = $fixed.IndexOf($t)
    if ($idx -ge 0) {
        Write-Host "$t -> $($fixed.Substring($idx, [Math]::Min(15, $fixed.Length-$idx)))"
    }
}

[System.IO.File]::WriteAllText($path, $fixed, [System.Text.Encoding]::UTF8)
Write-Host "`nFile saved successfully!"
