$loginBody = @{
    email = "admin@acme.com"
    password = "password123"
    tenantId = "acme"
} | ConvertTo-Json

try {
    Write-Host "Logging in..."
    $response = Invoke-RestMethod -Uri "http://localhost:5097/api/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $response.accessToken
    Write-Host "Token obtained: $token"
    
    $headers = @{
        Authorization = "Bearer $token"
        "X-Tenant-ID" = "acme"
    }
    
    Write-Host "Querying categories..."
    $categories = Invoke-RestMethod -Uri "http://localhost:5097/api/categories" -Method Get -Headers $headers
    Write-Host "Categories result:"
    $categories | ConvertTo-Json
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body"
    }
}
