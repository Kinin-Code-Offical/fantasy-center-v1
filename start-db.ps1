$InstanceName = "fantasy-yahoo-sports:europe-west3:trade-center-fantasy-development-sql"
# Alternative: "fantasy-yahoo-sports:europe-west3:trade-center-fantasy-developer-sql"

Write-Host "Starting Cloud SQL Proxy for instance: $InstanceName"
.\cloud-sql-proxy.exe $InstanceName --port=5432 --credentials-file=./key.json