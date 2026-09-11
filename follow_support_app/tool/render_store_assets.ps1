# Render the store images from assets/follow_work_notes_icon.png.
#   powershell -ExecutionPolicy Bypass -File tool\render_store_assets.ps1
# Writes store/play-icon-512.png, store/app-store-icon-1024.png and
# store/play-feature-1024x500.png under follow_support_app/.
#
# The source icon has rounded corners on a transparent canvas (even its middle
# is alpha 252). Both stores round the corners themselves and neither supports
# transparency (Google Play renders alpha as black, App Store Connect rejects
# it), so the square inside the rounded shape is cropped and flattened onto an
# opaque background.
#
# Kept ASCII only: Windows PowerShell 5.1 misreads UTF-8 scripts without a BOM,
# so Japanese text is written as \u escapes.
Add-Type -AssemblyName System.Drawing

$app = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $app 'store'
New-Item -ItemType Directory -Force $outDir | Out-Null

$source = [System.Drawing.Bitmap]::FromFile((Join-Path $app 'assets\follow_work_notes_icon.png'))
$navy = [System.Drawing.Color]::FromArgb(255, 10, 47, 102)

# Walk each diagonal inward until the pixel is part of the icon body. The shape
# is convex, so once all four crop corners are inside, the whole crop is.
function Get-DiagonalInset([System.Drawing.Bitmap]$bmp, [int]$dx, [int]$dy) {
    $max = [int]($bmp.Width / 2)
    for ($i = 0; $i -lt $max; $i++) {
        $x = if ($dx -gt 0) { $i } else { $bmp.Width - 1 - $i }
        $y = if ($dy -gt 0) { $i } else { $bmp.Height - 1 - $i }
        if ($bmp.GetPixel($x, $y).A -ge 240) { return $i }
    }
    throw 'icon body not found on the diagonal'
}
$inset = @(
    (Get-DiagonalInset $source 1 1),
    (Get-DiagonalInset $source -1 1),
    (Get-DiagonalInset $source 1 -1),
    (Get-DiagonalInset $source -1 -1)
) | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum
$inset += 12
$cropSize = $source.Width - 2 * $inset
$crop = New-Object System.Drawing.Rectangle($inset, $inset, $cropSize, $cropSize)
Write-Host "crop inset $inset, size $cropSize"

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return @($bmp, $g)
}

function Save-Icon([int]$size, [string]$name) {
    $bmp, $g = New-Canvas $size $size
    $g.Clear($navy)
    $dest = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $g.DrawImage($source, $dest, $crop, [System.Drawing.GraphicsUnit]::Pixel)
    $path = Join-Path $outDir $name
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "wrote $path"
}

Save-Icon 512 'play-icon-512.png'
Save-Icon 1024 'app-store-icon-1024.png'

# Feature graphic. Google Play crops and scales it for different placements, so
# the icon and the title stay well inside the middle.
$bmp, $g = New-Canvas 1024 500
$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(1024, 500)),
    [System.Drawing.Color]::FromArgb(255, 14, 111, 134),
    [System.Drawing.Color]::FromArgb(255, 8, 36, 92))
$g.FillRectangle($gradient, 0, 0, 1024, 500)

$iconSize = 280
$iconX = 96
$iconY = [int]((500 - $iconSize) / 2)
$radius = 62
$clip = New-Object System.Drawing.Drawing2D.GraphicsPath
$clip.AddArc($iconX, $iconY, 2 * $radius, 2 * $radius, 180, 90)
$clip.AddArc($iconX + $iconSize - 2 * $radius, $iconY, 2 * $radius, 2 * $radius, 270, 90)
$clip.AddArc($iconX + $iconSize - 2 * $radius, $iconY + $iconSize - 2 * $radius, 2 * $radius, 2 * $radius, 0, 90)
$clip.AddArc($iconX, $iconY + $iconSize - 2 * $radius, 2 * $radius, 2 * $radius, 90, 90)
$clip.CloseFigure()
$g.SetClip($clip)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($navy)), $iconX, $iconY, $iconSize, $iconSize)
$g.DrawImage($source, (New-Object System.Drawing.Rectangle($iconX, $iconY, $iconSize, $iconSize)), $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.ResetClip()

$title = [regex]::Unescape('\u30D5\u30A9\u30ED\u30FC\u4F5C\u696D\u30CE\u30FC\u30C8')
$subtitle = [regex]::Unescape('\u5BFE\u8C61\u30FB\u9032\u6357\u30FB\u5C65\u6B74\u3092\u7AEF\u672B\u5185\u3067\u7BA1\u7406')
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$soft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
$titleFont = New-Object System.Drawing.Font('Yu Gothic', 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font('Yu Gothic', 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$textX = $iconX + $iconSize + 48
$g.DrawString($title, $titleFont, $white, $textX, 170)
$g.DrawString($subtitle, $subFont, $soft, $textX + 4, 262)

$path = Join-Path $outDir 'play-feature-1024x500.png'
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $source.Dispose()
Write-Host "wrote $path"
