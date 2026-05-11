$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"

# Test a few URLs to understand what works
foreach ($path in @("/api/v1/subjects", "/en/login", "/fa/login", "/")) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000$path" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
    Write-Output "OK $($r.StatusCode): $path"
  } catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Output "$code : $path"
  } catch {
    Write-Output "ERR: $path - $_"
  }
}
