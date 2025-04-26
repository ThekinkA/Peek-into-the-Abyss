import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '96.30.195.99',
  user: 'remote_user',
  password: 'root',
  database: 'exploring_the_abyss',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default {
  'GET /api/node/distribution': async (req: Request, res: Response) => {
    try {
      // 查询每个城市的IP数量和位置信息
      const [rows] = await pool.query(`
        SELECT 
          p.country,
          p.city,
          p.longitude,
          p.latitude,
          COUNT(i.ip) as ipCount
        FROM position_with_lng_lat p
        LEFT JOIN ip_with_country_city i 
        ON p.country = i.country AND p.city = i.city
        GROUP BY p.country, p.city, p.longitude, p.latitude
      `);

      res.send({
        success: true,
        data: rows,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        errorMessage: error.message,
      });
    }
  },

  'GET /api/node/torprofile': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          IP,
          name,
          type,
          nikename,
          release_date,
          release_time,
          ORPort,
          DirPort,
          des_hash,
          fea_label,
          Tor_ver,
          protocol_ver,
          width_rec,
          status_state,
          status_reason,
          OS,
          microdesc
        FROM torprofile
        LIMIT 100
      `);

      res.send({
        success: true,
        data: rows,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        errorMessage: error.message,
      });
    }
  },
};
