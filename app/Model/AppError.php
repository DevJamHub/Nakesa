<?php
// CLASS AppError: kesalahan yang pesannya boleh dibaca pengguna, misalnya "Stok tidak cukup."
// $status = kode HTTP jawaban API, $code = kode singkat untuk JavaScript (misalnya invalid_credentials).

class AppError extends RuntimeException
{
    private int $status;
    private ?string $errorCode;

    public function __construct(string $message, int $status = 422, ?string $errorCode = null)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }
}
