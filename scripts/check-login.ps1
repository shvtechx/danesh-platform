$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"

# Test what /en/login returns
$result = Invoke-WebRequest -Uri "http://localhost:3000/en/login" -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Output "Status: $($result.StatusCode)"
Write-Output "Headers: $($result.Headers | Out-String)"
