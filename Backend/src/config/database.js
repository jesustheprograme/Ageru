import tediousSql from 'mssql';
import windowsSql from 'mssql/msnodesqlv8.js';
import { env } from './env.js';

const useWindowsAuth = env.db.auth === 'windows';
const sql = useWindowsAuth ? windowsSql : tediousSql;

// Permite alternar entre autenticacion Windows y credenciales SQL sin cambiar repositorios.
const dbConfig = useWindowsAuth
  ? {
      connectionString: `Driver={SQL Server Native Client 11.0};Server=${env.db.server};Database=${env.db.database};Trusted_Connection=Yes;`,
    }
  : {
      user: env.db.user,
      password: env.db.password,
      server: env.db.server,
      database: env.db.database,
      options: {
        encrypt: env.db.encrypt,
        trustServerCertificate: env.db.trustServerCertificate,
      },
    };

let poolPromise;

/**
 * Devuelve un pool compartido de SQL Server.
 *
 * El pool se crea bajo demanda y se reutiliza entre consultas para evitar abrir
 * conexiones nuevas por request. Si la conexion falla, se libera la promesa para
 * permitir un nuevo intento posterior.
 */
export const getDbPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
};

export { sql };
