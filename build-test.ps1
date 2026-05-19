npm run build 2>&1 | Out-File -FilePath build-output.txt -Encoding UTF8
Get-Content build-output.txt
