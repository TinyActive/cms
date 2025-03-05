# Tạo dữ liệu mẫu cho Activity
Write-Host "Bắt đầu chạy script tạo dữ liệu mẫu cho Activity..." -ForegroundColor Green

# Chạy script TypeScript với ts-node
try {
    npx ts-node prisma/seed-activity.ts
    Write-Host "Tạo dữ liệu mẫu thành công!" -ForegroundColor Green
} catch {
    Write-Host "Có lỗi xảy ra: $_" -ForegroundColor Red
} 