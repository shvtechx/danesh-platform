$env:Path = "C:\Program Files\nodejs;$env:Path"
Set-Location "D:\AI-Tech\Learning_Platform\Onlinelearning-main\Onlinelearning-main"
& "C:\Program Files\nodejs\node.exe" node_modules\ts-node\dist\bin.js --project prisma/tsconfig.seed.json prisma/seed-all-subject-courses.ts
