'use strict'
const build = require('pino-abstract-transport');
const SonicBoom = require('sonic-boom');
const path = require('path');

/**
 * Custom Pino transport to route logs to different files based on context and level.
 * 
 * @param {Object} opts - Transport options.
 * @returns {Promise<import('pino-abstract-transport').Stream>}
 */
module.exports = async function (opts) {
  const logDir = path.resolve(process.cwd(), 'logs');
  
  const systemStream = new SonicBoom({ dest: path.join(logDir, 'system.log'), mkdir: true, sync: true });
  const requestStream = new SonicBoom({ dest: path.join(logDir, 'requests.log'), mkdir: true, sync: true });
  const errorStream = new SonicBoom({ dest: path.join(logDir, 'error.log'), mkdir: true, sync: true });

  return build(async function (source) {
    for await (let obj of source) {
      const line = JSON.stringify(obj) + '\n';
      
      // 1. Error logging: level 50 (error) and 60 (fatal)
      const isError = obj.level >= 50 || (obj.res && obj.res.statusCode >= 500);
      if (isError) {
        errorStream.write(line);
      }
      
      // 2. Request logging: pino-http logs contain req, res, or responseTime
      const isRequest = obj.req || obj.res || typeof obj.responseTime !== 'undefined' || obj.statusCode || obj.context === 'GlobalExceptionFilter';
      if (isRequest) {
        requestStream.write(line);
      } else {
        // 3. System logging: everything else
        systemStream.write(line);
      }
    }
  }, {
    async close() {
      systemStream.end();
      requestStream.end();
      errorStream.end();
    },
  });
};
