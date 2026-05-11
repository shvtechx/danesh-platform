$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"
& "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev --port 3000 2>&1 | Tee-Object -FilePath "scripts\dev-server.log"
