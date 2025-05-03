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

  'GET /api/node/latest-ips': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT IP 
        FROM torprofile 
        ORDER BY release_date DESC, release_time DESC 
        LIMIT 5
      `);

      res.send({
        success: true,
        data: rows.map((row: any) => row.IP),
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        errorMessage: error.message,
      });
    }
  },

  'GET /api/node/latest-time': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT time_value 
        FROM latest_time 
        ORDER BY time_value DESC 
        LIMIT 1
      `);

      res.send({
        success: true,
        data: rows[0]?.time_value || '',
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        errorMessage: error.message,
      });
    }
  },

  'GET /api/node/ip-counts': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT valid_after_time, ip_num 
        FROM ip_counts 
        ORDER BY valid_after_time DESC 
        LIMIT 6
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

  'GET /api/node/c-class-alive': async (req: Request, res: Response) => {
    try {
      const { originalIp } = req.query;
      const [rows] = await pool.query(`
        SELECT 
          id,
          original_ip,
          alive_count,
          dead_count,
          host1,
          host2,
          host3,
          host4,
          host5
        FROM c_class_alive
        WHERE original_ip = ?
      `, [originalIp]);

      if (rows.length === 0) {
        res.send({
          success: true,
          data: null,
          message: '数据库中无相关数据'
        });
        return;
      }

      res.send({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        errorMessage: '链接数据库失败'
      });
    }
  },

  'GET /api/node/default-c-class-alive': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id,
          original_ip,
          alive_count,
          dead_count,
          host1,
          host2,
          host3,
          host4,
          host5
        FROM c_class_alive
        LIMIT 1
      `);

      if (rows.length === 0) {
        res.send({
          success: true,
          data: null,
          message: '数据库中无相关数据'
        });
        return;
      }

      res.send({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        errorMessage: '链接数据库失败'
      });
    }
  },

  'GET /api/node/category-stats': async (req: Request, res: Response) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          category,
          COUNT(*) as count
        FROM torprofile
        WHERE category IN ('Middle', 'Guard', 'Exit')
        GROUP BY category
      `);

      res.send({
        success: true,
        data: rows
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        errorMessage: error.message
      });
    }
  },
};
