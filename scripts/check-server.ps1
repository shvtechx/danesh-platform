$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"

foreach ($port in @(3001, 3000)) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port/api/v1/subjects" -UseBasicParsing -TimeoutSec 5
    Write-Output "Server alive on port $port - status $($r.StatusCode)"
    $data = $r.Content | ConvertFrom-Json
    $data.subjects | Select-Object -First 5 | ForEach-Object {
      Write-Output "  subject: $($_.code) - $($_.name)"
    }
    break
  } catch {
    Write-Output "Port $port not responding"
  }
}
