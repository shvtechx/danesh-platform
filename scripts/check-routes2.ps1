$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"

# Test with redirects following
foreach ($path in @("/api/v1/subjects", "/en/login", "/")) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000$path" -UseBasicParsing -ErrorAction Stop
    Write-Output "OK $($r.StatusCode): $path (final URL may differ)"
  } catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Output "$code : $path"
  } catch {
    Write-Output "ERR: $path - $_"
  }
}

# Test resolveBaseUrl logic: check if /en/login gives 200 or redirect (2xx/3xx)
Write-Output ""
Write-Output "--- Checking if resolveBaseUrl endpoint works ---"
& "C:\Program Files\nodejs\node.exe" -e @"
fetch('http://localhost:3000/en/login', { redirect: 'manual' })
  .then(r => console.log('status:', r.status))
  .catch(e => console.log('error:', e.message));
"@
