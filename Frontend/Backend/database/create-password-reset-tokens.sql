USE Ageru;
GO

IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_tokens (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_password_reset_tokens PRIMARY KEY DEFAULT NEWID(),
        usuario_id UNIQUEIDENTIFIER NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_password_reset_tokens_usuarios
            FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
    );

    CREATE UNIQUE INDEX UX_password_reset_tokens_token_hash
        ON dbo.password_reset_tokens(token_hash);

    CREATE INDEX IX_password_reset_tokens_usuario_id
        ON dbo.password_reset_tokens(usuario_id, created_at DESC);
END;
GO
