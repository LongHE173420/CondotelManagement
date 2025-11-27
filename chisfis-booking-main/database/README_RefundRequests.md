# Bảng RefundRequests - Quản lý Yêu cầu Hoàn tiền

## Tổng quan

Bảng `RefundRequests` được sử dụng để lưu trữ tất cả các yêu cầu hoàn tiền từ khách hàng khi hủy booking.

## Cấu trúc Bảng

### Các trường chính:

| Tên trường | Kiểu dữ liệu | Mô tả |
|-----------|--------------|-------|
| `Id` | INT (PK, Identity) | ID tự tăng của refund request |
| `BookingId` | INT (FK) | ID của booking cần hoàn tiền |
| `CustomerId` | INT (FK) | ID của khách hàng |
| `CustomerName` | NVARCHAR(255) | Tên khách hàng |
| `CustomerEmail` | NVARCHAR(255) | Email khách hàng |
| `RefundAmount` | DECIMAL(18,2) | Số tiền cần hoàn |
| `Status` | NVARCHAR(50) | Trạng thái: Pending, Completed, Refunded, Rejected |
| `BankCode` | NVARCHAR(50) | Mã ngân hàng (MB, VCB, TCB, etc.) |
| `AccountNumber` | NVARCHAR(50) | Số tài khoản |
| `AccountHolder` | NVARCHAR(255) | Tên chủ tài khoản |
| `Reason` | NVARCHAR(500) | Lý do hoàn tiền |
| `CancelDate` | DATETIME | Ngày hủy booking |
| `ProcessedBy` | INT (FK) | ID của admin xử lý |
| `ProcessedAt` | DATETIME | Ngày xử lý hoàn tiền |
| `TransactionId` | NVARCHAR(100) | ID giao dịch từ Cas API (nếu hoàn tự động) |
| `PaymentMethod` | NVARCHAR(50) | Phương thức: 'Auto' (Cas API) hoặc 'Manual' |
| `CreatedAt` | DATETIME | Ngày tạo yêu cầu |
| `UpdatedAt` | DATETIME | Ngày cập nhật cuối |

## Trạng thái (Status)

- **Pending**: Yêu cầu đã được tạo, chờ admin xử lý
- **Completed**: Đã hoàn tiền thành công (tự động qua Cas API)
- **Refunded**: Đã hoàn tiền thủ công (admin xác nhận đã chuyển)
- **Rejected**: Yêu cầu bị từ chối

## Foreign Keys

- `BookingId` → `Bookings.BookingId` (CASCADE DELETE)
- `CustomerId` → `Users.UserId`
- `ProcessedBy` → `Users.UserId` (Admin xử lý)

## Indexes

1. **IX_RefundRequests_BookingId**: Tìm kiếm theo BookingId
2. **IX_RefundRequests_CustomerId**: Tìm kiếm theo CustomerId
3. **IX_RefundRequests_Status**: Filter theo Status
4. **IX_RefundRequests_CreatedAt**: Filter theo ngày tạo
5. **IX_RefundRequests_Status_CreatedAt**: Composite index cho filter thường dùng

## Stored Procedures

### 1. `sp_CreateRefundRequest`
Tạo yêu cầu hoàn tiền mới.

**Parameters:**
- `@BookingId`: ID booking
- `@CustomerId`: ID khách hàng
- `@CustomerName`: Tên khách hàng
- `@CustomerEmail`: Email (optional)
- `@RefundAmount`: Số tiền hoàn
- `@BankCode`: Mã ngân hàng (optional)
- `@AccountNumber`: Số tài khoản (optional)
- `@AccountHolder`: Tên chủ tài khoản (optional)
- `@Reason`: Lý do (optional)
- `@CancelDate`: Ngày hủy (optional)
- `@RefundRequestId`: OUTPUT - ID của refund request vừa tạo

**Example:**
```sql
DECLARE @RefundId INT;
EXEC sp_CreateRefundRequest
    @BookingId = 1,
    @CustomerId = 1,
    @CustomerName = 'Nguyễn Văn A',
    @CustomerEmail = 'nguyenvana@example.com',
    @RefundAmount = 1000000,
    @BankCode = 'VCB',
    @AccountNumber = '1234567890',
    @AccountHolder = 'NGUYEN VAN A',
    @RefundRequestId = @RefundId OUTPUT;
SELECT @RefundId;
```

### 2. `sp_UpdateRefundStatus`
Cập nhật trạng thái hoàn tiền.

**Parameters:**
- `@RefundRequestId`: ID refund request
- `@Status`: Trạng thái mới
- `@ProcessedBy`: ID admin xử lý (optional)
- `@TransactionId`: ID giao dịch từ Cas API (optional)
- `@PaymentMethod`: 'Auto' hoặc 'Manual' (optional)

**Example:**
```sql
EXEC sp_UpdateRefundStatus
    @RefundRequestId = 1,
    @Status = 'Completed',
    @ProcessedBy = 1,
    @TransactionId = 'TXN123456',
    @PaymentMethod = 'Auto';
```

## View

### `vw_RefundRequests`
View tổng hợp thông tin refund request với:
- BookingIdFormatted (BOOK-001)
- Thông tin condotel
- Tên admin xử lý

**Example:**
```sql
SELECT * FROM vw_RefundRequests 
WHERE Status = 'Pending' 
ORDER BY CreatedAt DESC;
```

## Trigger

### `TR_RefundRequests_UpdateTimestamp`
Tự động cập nhật `UpdatedAt` khi có thay đổi.

## Quy trình sử dụng

### 1. Tenant tạo yêu cầu hoàn tiền:
```sql
-- Khi tenant submit form hoàn tiền
EXEC sp_CreateRefundRequest
    @BookingId = @bookingId,
    @CustomerId = @customerId,
    @CustomerName = @customerName,
    @RefundAmount = @refundAmount,
    @BankCode = @bankCode,
    @AccountNumber = @accountNumber,
    @AccountHolder = @accountHolder,
    @CancelDate = @cancelDate,
    @RefundRequestId = @refundId OUTPUT;
```

### 2. Admin xử lý hoàn tiền tự động:
```sql
-- Sau khi gọi Cas API thành công
EXEC sp_UpdateRefundStatus
    @RefundRequestId = @refundId,
    @Status = 'Completed',
    @ProcessedBy = @adminId,
    @TransactionId = @transactionId,
    @PaymentMethod = 'Auto';
```

### 3. Admin xác nhận hoàn tiền thủ công:
```sql
-- Khi admin xác nhận đã chuyển tiền thủ công
EXEC sp_UpdateRefundStatus
    @RefundRequestId = @refundId,
    @Status = 'Refunded',
    @ProcessedBy = @adminId,
    @PaymentMethod = 'Manual';
```

## Queries thường dùng

### Lấy danh sách yêu cầu hoàn tiền chờ xử lý:
```sql
SELECT * FROM vw_RefundRequests 
WHERE Status = 'Pending' 
ORDER BY CreatedAt DESC;
```

### Lấy yêu cầu hoàn tiền của một booking:
```sql
SELECT * FROM vw_RefundRequests 
WHERE BookingId = @bookingId;
```

### Filter theo status và khoảng ngày:
```sql
SELECT * FROM vw_RefundRequests 
WHERE Status = @status
  AND CreatedAt BETWEEN @startDate AND @endDate
ORDER BY CreatedAt DESC;
```

### Thống kê hoàn tiền:
```sql
SELECT 
    Status,
    COUNT(*) AS TotalRequests,
    SUM(RefundAmount) AS TotalAmount
FROM RefundRequests
GROUP BY Status;
```

## Lưu ý

1. **Một booking chỉ có thể có một yêu cầu hoàn tiền đang xử lý** (Pending hoặc Completed)
2. **RefundAmount phải > 0**
3. **Status chỉ có thể là**: Pending, Completed, Refunded, Rejected
4. **PaymentMethod chỉ có thể là**: Auto, Manual, hoặc NULL
5. Khi xóa booking, refund request sẽ tự động bị xóa (CASCADE DELETE)




