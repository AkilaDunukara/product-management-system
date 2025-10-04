import http from 'http';
import express, { Express } from 'express';
import eventsRouter from '../../src/routes/events';
import { getSubClient } from '../../src/config/redis';

jest.mock('../../src/config/redis');

const mockGetSubClient = getSubClient as jest.MockedFunction<typeof getSubClient>;

describe('Events Routes', () => {
  let app: Express;
  let server: http.Server;
  let port: number;

  beforeEach((done) => {
    app = express();
    app.use((req, res, next) => {
      (req as any).sellerId = 'seller-123';
      next();
    });
    app.use('/events', eventsRouter);
    
    server = app.listen(0, () => {
      port = (server.address() as any).port;
      jest.clearAllMocks();
      done();
    });
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET /events/stream', () => {
    it('should establish SSE connection', (done) => {
      const mockSubClient: any = {
        subscribe: jest.fn().mockImplementation((channel, callback) => {
          expect(channel).toBe('notifications:seller-123');
          expect(typeof callback).toBe('function');
          return Promise.resolve();
        }),
        unsubscribe: jest.fn().mockResolvedValue(undefined)
      };

      mockGetSubClient.mockReturnValue(mockSubClient);

      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/events/stream',
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream'
          }
        },
        (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toBe('text/event-stream');
          expect(res.headers['cache-control']).toBe('no-cache');
          expect(res.headers['connection']).toBe('keep-alive');

          let dataReceived = '';
          const timeout = setTimeout(() => {
            req.destroy();
            done(new Error('Test timeout - no data received'));
          }, 1000);

          res.on('data', (chunk: Buffer) => {
            dataReceived += chunk.toString();
            
            if (dataReceived.includes('data: {') && dataReceived.includes('"type":"connected"')) {
              clearTimeout(timeout);
              
              const lines = dataReceived.split('\n');
              const dataLine = lines.find(line => line.startsWith('data: '));
              if (dataLine) {
                const jsonStr = dataLine.substring(6);
                const data = JSON.parse(jsonStr);
                expect(data.type).toBe('connected');
                expect(data.sellerId).toBe('seller-123');
                expect(data.message).toBe('SSE connection established');
                expect(data.timestamp).toBeDefined();
              }
              
              req.destroy();
              done();
            }
          });

          res.on('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code !== 'ECONNRESET') {
              done(err);
            }
          });
        }
      );

      req.on('error', (err: any) => {
        if (err.code !== 'ECONNRESET') {
          done(err);
        }
      });

      req.end();
    }, 10000);

    it('should handle Redis subscription errors', (done) => {
      const mockSubClient: any = {
        subscribe: jest.fn().mockRejectedValue(new Error('Redis subscription failed')),
        unsubscribe: jest.fn().mockResolvedValue(undefined)
      };

      mockGetSubClient.mockReturnValue(mockSubClient);

      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/events/stream',
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream'
          }
        },
        (res) => {
          expect(res.statusCode).toBe(200);

          let dataReceived = '';
          let connectedReceived = false;
          const timeout = setTimeout(() => {
            req.destroy();
            done(new Error('Test timeout - no error data received'));
          }, 2000);

          res.on('data', (chunk: Buffer) => {
            dataReceived += chunk.toString();
            
            if (dataReceived.includes('"type":"connected"')) {
              connectedReceived = true;
            }
            
            if (connectedReceived && dataReceived.includes('"type":"error"')) {
              clearTimeout(timeout);
              
              const lines = dataReceived.split('\n');
              const errorLine = lines.find(line => line.includes('"type":"error"'));
              if (errorLine) {
                const jsonStr = errorLine.substring(errorLine.indexOf('{'));
                const errorData = JSON.parse(jsonStr);
                expect(errorData.type).toBe('error');
                expect(errorData.message).toBe('Failed to establish event stream');
                expect(errorData.error_code).toBe('SSE_SETUP_ERROR');
              }
              
              req.destroy();
              done();
            }
          });

          res.on('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code !== 'ECONNRESET') {
              done(err);
            }
          });
        }
      );

      req.on('error', (err: any) => {
        if (err.code !== 'ECONNRESET') {
          done(err);
        }
      });

      req.end();
    }, 10000);

    it('should send notifications to client', (done) => {
      let subscriptionCallback: any;
      const mockSubClient: any = {
        subscribe: jest.fn().mockImplementation((channel, callback) => {
          subscriptionCallback = callback;
          return Promise.resolve();
        }),
        unsubscribe: jest.fn().mockResolvedValue(undefined)
      };

      mockGetSubClient.mockReturnValue(mockSubClient);

      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/events/stream',
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream'
          }
        },
        (res) => {
          expect(res.statusCode).toBe(200);

          let dataReceived = '';
          let notificationSent = false;
          const timeout = setTimeout(() => {
            req.destroy();
            done(new Error('Test timeout - notification not received'));
          }, 2000);

          res.on('data', (chunk: Buffer) => {
            dataReceived += chunk.toString();
            
            if (dataReceived.includes('"type":"connected"') && !notificationSent) {
              notificationSent = true;
              setTimeout(() => {
                const notification = {
                  type: 'product.created',
                  productId: 123,
                  message: 'Product created successfully'
                };
                subscriptionCallback(JSON.stringify(notification));
              }, 100);
            }

            if (dataReceived.includes('event: product.created') && dataReceived.includes('"productId":123')) {
              clearTimeout(timeout);
              expect(dataReceived).toContain('event: product.created');
              expect(dataReceived).toContain('"productId":123');
              expect(dataReceived).toContain('"message":"Product created successfully"');
              req.destroy();
              done();
            }
          });

          res.on('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code !== 'ECONNRESET') {
              done(err);
            }
          });
        }
      );

      req.on('error', (err: any) => {
        if (err.code !== 'ECONNRESET') {
          done(err);
        }
      });

      req.end();
    }, 10000);

    it('should handle malformed notification messages', (done) => {
      let subscriptionCallback: any;
      const mockSubClient: any = {
        subscribe: jest.fn().mockImplementation((channel, callback) => {
          subscriptionCallback = callback;
          return Promise.resolve();
        }),
        unsubscribe: jest.fn().mockResolvedValue(undefined)
      };

      mockGetSubClient.mockReturnValue(mockSubClient);

      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/events/stream',
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream'
          }
        },
        (res) => {
          expect(res.statusCode).toBe(200);

          let dataReceived = '';
          let errorSent = false;
          const timeout = setTimeout(() => {
            req.destroy();
            done(new Error('Test timeout - error handling not triggered'));
          }, 2000);

          res.on('data', (chunk: Buffer) => {
            dataReceived += chunk.toString();
            
            if (dataReceived.includes('"type":"connected"') && !errorSent) {
              errorSent = true;
              setTimeout(() => {
                subscriptionCallback('invalid json');
              }, 100);
            }

            if (dataReceived.includes('"message":"Failed to process notification"')) {
              clearTimeout(timeout);
              expect(console.error).toHaveBeenCalled();
              req.destroy();
              done();
            }
          });

          res.on('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code !== 'ECONNRESET') {
              done(err);
            }
          });
        }
      );

      req.on('error', (err: any) => {
        if (err.code !== 'ECONNRESET') {
          done(err);
        }
      });

      req.end();
    }, 10000);
  });
});

