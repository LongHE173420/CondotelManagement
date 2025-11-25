-- ============================================
-- Bảng RefundRequests - Lưu trữ yêu cầu hoàn tiền
-- ============================================

CREATE TABLE [dbo].[RefundRequests] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [BookingId] INT NOT NULL,
    [CustomerId] INT NOT NULL,
    [CustomerName] NVARCHAR(255) NOT NULL,
    [CustomerEmail] NVARCHAR(255) NULL,
    
    -- Thông tin hoàn tiền
    [RefundAmount] DECIMAL(18,2) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Completed, Refunded, Rejected
    
    -- Thông tin ngân hàng
    [BankCode] NVARCHAR(50) NULL, -- Mã ngân hàng (MB, VCB, TCB, ACB, etc.)
    [AccountNumber] NVARCHAR(50) NULL,
    [AccountHolder] NVARCHAR(255) NULL,
    
    -- Thông tin xử lý
    [Reason] NVARCHAR(500) NULL, -- Lý do hoàn tiền
    [CancelDate] DATETIME NULL, -- Ngày hủy booking
    [ProcessedBy] INT NULL, -- Admin ID xử lý
    [ProcessedAt] DATETIME NULL, -- Ngày xử lý
    [TransactionId] NVARCHAR(100) NULL, -- ID giao dịch từ Cas API (nếu hoàn tự động)
    [PaymentMethod] NVARCHAR(50) NULL, -- 'Auto' (Cas API) hoặc 'Manual' (chuyển thủ công)
    
    -- Timestamps
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NULL,
    
    -- Foreign Keys
    CONSTRAINT [FK_RefundRequests_Bookings] FOREIGN KEY ([BookingId]) 
        REFERENCES [dbo].[Bookings]([BookingId]) ON DELETE CASCADE,
    CONSTRAINT [FK_RefundRequests_Users_Customer] FOREIGN KEY ([CustomerId]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefundRequests_Users_Admin] FOREIGN KEY ([ProcessedBy]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION,
    
    -- Constraints
    CONSTRAINT [CK_RefundRequests_Status] CHECK ([Status] IN ('Pending', 'Completed', 'Refunded', 'Rejected')),
    CONSTRAINT [CK_RefundRequests_RefundAmount] CHECK ([RefundAmount] > 0),
    CONSTRAINT [CK_RefundRequests_PaymentMethod] CHECK ([PaymentMethod] IN ('Auto', 'Manual') OR [PaymentMethod] IS NULL)
);

-- ============================================
-- Indexes để tối ưu truy vấn
-- ============================================

-- Index cho tìm kiếm theo BookingId
CREATE NONCLUSTERED INDEX [IX_RefundRequests_BookingId] 
ON [dbo].[RefundRequests]([BookingId]);

-- Index cho filter theo Status
CREATE NONCLUSTERED INDEX [IX_RefundRequests_Status] 
ON [dbo].[RefundRequests]([Status]);

-- Index cho filter theo CreatedAt (để filter theo ngày)
CREATE NONCLUSTERED INDEX [IX_RefundRequests_CreatedAt] 
ON [dbo].[RefundRequests]([CreatedAt]);
