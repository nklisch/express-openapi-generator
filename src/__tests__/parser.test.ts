/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import express, { Express, Request, RequestHandler, Response, Router } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import OpenApiPath from '../express-open-api-middleware/middlewareFactory';
import ExpressPathParser, { onlyForTesting } from '../express-parser/parser';
import { ExpressRegex } from '../types';

const staticPath = /^\/sub-route2\/?(?=\/|$)/i as ExpressRegex;
const oneDynamicPath = () => {
  return {
    regex: /^\/sub-route\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex,
    keys: [
      {
        name: 'test1',
        optional: false,
        offset: 12,
      },
    ],
  };
};
const twoDynamicPaths = () => {
  return {
    regex: /^\/sub-sub-route\/(?:([^\/]+?))\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex,
    keys: [
      {
        name: 'test2',
        optional: false,
        offset: 16,
      },
      {
        name: 'test3',
        optional: false,
        offset: 31,
      },
    ],
  };
};

const operationObject: OpenAPIV3.OperationObject = {
  description: 'Returns pets based on ID',
  summary: 'Find pets by ID',
  operationId: 'getPetsById',
  responses: {
    '200': {
      description: 'pet response',
      content: {
        '*/*': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Pet',
            },
          },
        },
      },
    },
    default: {
      description: 'error payload',
      content: {
        'text/html': {
          schema: {
            $ref: '#/components/schemas/ErrorModel',
          },
        },
      },
    },
  },
};

describe('mapKeysToPath: maps keys to path', () => {
  it('handles one dynamic path parameter', () => {
    expect(onlyForTesting.mapKeysToPath(oneDynamicPath().regex, oneDynamicPath().keys)).toBe('/sub-route/:test1');
  });
  it('handles two dynamic path parameters', () => {
    expect(onlyForTesting.mapKeysToPath(twoDynamicPaths().regex, twoDynamicPaths().keys)).toBe(
      '/sub-sub-route/:test2/:test3',
    );
  });
  it('handles empty keys', () => {
    expect(() => onlyForTesting.mapKeysToPath(staticPath, [])).toThrow();
  });
  it('handles optional parameters', () => {
    const optional = twoDynamicPaths();
    optional.regex = /^\/sub-sub-route(?:\/([^\/]+?))?\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex;
    optional.keys[0].optional = true;
    expect(onlyForTesting.mapKeysToPath(optional.regex, optional.keys)).toBe('/sub-sub-route/:test2?/:test3');
  });
});

describe('pathRegexParser: converts regex to path', () => {
  it('handles static regex route', () => {
    expect(onlyForTesting.pathRegexParser(staticPath, [])).toBe('sub-route2');
  });
  it('handles one dynamic path parameters', () => {
    expect(onlyForTesting.pathRegexParser(oneDynamicPath().regex, oneDynamicPath().keys)).toBe('sub-route/:test1');
  });
  it('handles two dynamic path parameters', () => {
    expect(onlyForTesting.pathRegexParser(twoDynamicPaths().regex, twoDynamicPaths().keys)).toBe(
      'sub-sub-route/:test2/:test3',
    );
  });
  it('handles normal string', () => {
    expect(onlyForTesting.pathRegexParser('testing/test', [])).toBe('testing/test');
  });
  it('handles fast slash', () => {
    const fastSlash: any = /test/;
    fastSlash.fast_slash = true;
    fastSlash.fast_star = false;
    expect(onlyForTesting.pathRegexParser(fastSlash, [])).toBe('');
  });
  it('handles fast star', () => {
    const fastStar: any = /test/;
    fastStar.fast_slash = false;
    fastStar.fast_star = true;
    expect(onlyForTesting.pathRegexParser(fastStar, [])).toBe('*');
  });
  it('handles custom regex path', () => {
    expect(onlyForTesting.pathRegexParser(/test/ as ExpressRegex, [])).toBe('/test/');
  });
});

describe('it parses an express app with', () => {
  let app: Express;
  const successResponse: RequestHandler = (req: Request, res: Response) => {
    res.status(204).send();
  };
  beforeEach(() => {
    app = express();
  });

  it('a route', (done) => {
    app.get('/test/the/endpoint', successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test/the/endpoint');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    done();
  });

  it('a path parameter', (done) => {
    app.delete('/test/:id/endpoint', successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test/:id/endpoint');
    expect(method).toBe('delete');
    expect(pathParams).toEqual([{ name: 'id', in: 'path', required: true }]);
    done();
  });

  it('a optional path parameter', (done) => {
    app.patch('/test/:id?/endpoint', successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test/:id?/endpoint');
    expect(method).toBe('patch');
    expect(pathParams).toEqual([{ name: 'id', in: 'path', required: false }]);
    done();
  });

  it('multiple path parameters', (done) => {
    app.post('/test/:name/:id/:day', successResponse);
    app.get('/test/:id?/:test?/:cid?', successResponse);
    const parsed = new ExpressPathParser(app);
    let { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test/:name/:id/:day');
    expect(method).toBe('post');
    expect(pathParams).toEqual([
      { name: 'name', in: 'path', required: true },
      { name: 'id', in: 'path', required: true },
      { name: 'day', in: 'path', required: true },
    ]);
    ({ path, method, pathParams } = parsed.appPaths[1]);
    expect(path).toBe('/test/:id?/:test?/:cid?');
    expect(method).toBe('get');
    expect(pathParams).toEqual([
      { name: 'id', in: 'path', required: false },
      { name: 'test', in: 'path', required: false },
      { name: 'cid', in: 'path', required: false },
    ]);
    done();
  });

  it('regex path parameters', (done) => {
    app.post(/\/abc|\/xyz/, successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/\\/abc|\\/xyz/');
    expect(method).toBe('post');
    expect(pathParams).toEqual([]);
    done();
  });

  it('array of path parameters', (done) => {
    app.get(['/abcd', '/xyza', /\/lmn|\/pqr/], successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/abcd,/xyza,/\\/lmn|\\/pqr/');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    done();
  });

  it('paths with *,? and +', (done) => {
    app.get('/abc?d', successResponse);
    app.get('/ab*cd', successResponse);
    app.get('/a(bc)?d', successResponse);
    const parsed = new ExpressPathParser(app);
    let { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/abc?d');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    ({ path, method, pathParams } = parsed.appPaths[1]);
    expect(path).toBe('/ab*cd');
    expect(method).toBe('get');
    expect(pathParams).toEqual([{ in: 'path', name: 0, required: true }]);
    ({ path, method, pathParams } = parsed.appPaths[2]);
    expect(path).toBe('/a(bc)?d');
    expect(method).toBe('get');
    expect(pathParams).toEqual([{ in: 'path', name: 0, required: true }]);
    done();
  });

  it('route pattern', (done) => {
    app
      .route('/test')
      .all((req, res, next) => next())
      .get(successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    done();
  });

  it('path with middleware', (done) => {
    app.use((req, res, next) => next());
    app.get('/test', (req, res, next) => next(), successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    done();
  });

  it('an openApiPath middleware path doc extraction', (done) => {
    app.get('/test', OpenApiPath.path('test', { operationObject }), successResponse);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams, openApiOperation } = parsed.appPaths[0];
    expect(path).toBe('/test');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    expect(openApiOperation).toEqual(operationObject);
    done();
  });

  it('too many openApiPath middlewares on a route should fail', (done) => {
    app.get(
      '/test',
      OpenApiPath.path('test', { operationObject }),
      OpenApiPath.path('test', { operationObject }),
      successResponse,
    );
    expect(() => new ExpressPathParser(app)).toThrow();
    done();
  });

  it('openApiPathMiddleware is on a app use function should fail', (done) => {
    app.use(OpenApiPath.path('test', { operationObject }));
    app.get('/test', OpenApiPath.path('test', { operationObject }), successResponse);
    expect(() => new ExpressPathParser(app)).toThrow();
    done();
  });
});

describe('parses an express app with ', () => {
  let app: Express;
  let router: Router;
  let subrouter: Router;
  const successResponse: RequestHandler = (req: Request, res: Response) => {
    res.status(204).send();
  };
  beforeEach(() => {
    app = express();
    router = express.Router();
    subrouter = express.Router();
  });

  it('sub-routes', (done) => {
    subrouter.get('/endpoint', successResponse);
    router.use('/sub-route', subrouter);
    app.use('/test', router);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/test/sub-route/endpoint');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    done();
  });

  it('sub-routes with openApiMiddleware', (done) => {
    subrouter.get('/endpoint', OpenApiPath.path('test', { operationObject }), successResponse);
    router.use('/sub-route', subrouter);
    app.use('/test', router);
    const parsed = new ExpressPathParser(app);
    const { path, method, pathParams, openApiOperation } = parsed.appPaths[0];
    expect(path).toBe('/test/sub-route/endpoint');
    expect(method).toBe('get');
    expect(pathParams).toEqual([]);
    expect(openApiOperation).toEqual(operationObject);
    done();
  });

  it('nested sub-routes with a path parameters Router', (done) => {
    const router2 = express.Router();
    const subrouter2 = express.Router();

    subrouter.get('/endpoint', successResponse);
    subrouter.post('/endpoint2', successResponse);

    app.use('/sub-route/:test1', router);
    router.use('/sub-sub-route/:test2/:test3', subrouter);
    app.use('/sub-route2', router2);
    router2.use('/:test/qualifier', subrouter2);
    subrouter2.put('/:name/endpoint2/:id', successResponse);

    const parsed = new ExpressPathParser(app);
    let { path, method, pathParams } = parsed.appPaths[0];
    expect(path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint');
    expect(pathParams).toEqual([
      { name: 'test1', in: 'path', required: true },
      { name: 'test2', in: 'path', required: true },
      { name: 'test3', in: 'path', required: true },
    ]);
    expect(method).toBe('get');
    ({ path, method, pathParams } = parsed.appPaths[1]);
    expect(path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint2');
    expect(pathParams).toEqual([
      { name: 'test1', in: 'path', required: true },
      { name: 'test2', in: 'path', required: true },
      { name: 'test3', in: 'path', required: true },
    ]);
    expect(method).toBe('post');
    ({ path, method, pathParams } = parsed.appPaths[2]);
    expect(path).toBe('/sub-route2/:test/qualifier/:name/endpoint2/:id');
    expect(pathParams).toEqual([
      { name: 'test', in: 'path', required: true },
      { name: 'name', in: 'path', required: true },
      { name: 'id', in: 'path', required: true },
    ]);
    expect(method).toBe('put');
    done();
  });
});
