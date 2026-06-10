USE Ageru;
GO

CREATE OR ALTER TRIGGER trg_usuario_crea_cuenta
ON usuarios
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO cuentas (usuario_id, numero_cuenta_enmascarado)
    SELECT
        id,
        '****' + RIGHT(REPLACE(CONVERT(VARCHAR(36), id), '-', ''), 12)
    FROM inserted;
END;
GO
