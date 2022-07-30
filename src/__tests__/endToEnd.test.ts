/* eslint-disable no-console */
import express, { Express, Router, RequestHandler, Request, Response } from 'express';
import OpenApiSchemaValidator from 'openapi-schema-validator'
import OpenApiDocumentBuilder from '../openapi-builder';
import { parseExpressApp } from 'express-route-parser'
const validator = new OpenApiSchemaValidator({ version: 3 });
const successResponse = (req: Request, res: Response) => {
  res.status(200).send();
}

describe('it parses an Express application and ', () => {
  let app: Express;
  let router: Router;
  let subrouter: Router;
  let documentBuilder: OpenApiDocumentBuilder;
  beforeEach(() => {
    app = express();
    router = express.Router();
    subrouter = express.Router();

  });
  describe('creates an open api document', () => {
    beforeEach(() => {
      documentBuilder = OpenApiDocumentBuilder.initializeDocument({ openapi: '3.0.1', info: { title: 'testing', version: '1' }, paths: {} }, true)
    })
    test('with single layer routes', () => {
      subrouter.get('/endpoint', successResponse);
      router.use('/sub-route', subrouter);
      app.use('/test', router);
      const parsed = parseExpressApp(app);
      documentBuilder.buildPathsObject(parsed)
      console.log(documentBuilder.document.paths);
      expect(validator.validate(documentBuilder.document).errors.length).toEqual(0)
    })
    test('with nested routes', () => {
      subrouter.get('/endpoint', successResponse);
      router.use('/sub-route', subrouter);
      app.use('/test', router);
      const parsed = parseExpressApp(app);
      documentBuilder.buildPathsObject(parsed)
      console.log(documentBuilder.document.paths);
      expect(validator.validate(documentBuilder.document).errors.length).toEqual(0)
    })
    test('with complex parameters', () => {
      const router2 = express.Router();
      const subrouter2 = express.Router();
      subrouter.get('/endpoint', successResponse);
      subrouter.post('/endpoint2', successResponse);

      app.use('/sub-route/:test1', router);
      router.use('/sub-sub-route/:test2/:test3', subrouter);
      app.use('/sub-route2', router2);
      router2.use('/:test/qualifier', subrouter2);
      subrouter2.put('/:name/endpoint2/:id', successResponse);
      const parsed = parseExpressApp(app);
      documentBuilder.buildPathsObject(parsed)
      console.log(documentBuilder.document.paths);
      expect(validator.validate(documentBuilder.document).errors.length).toEqual(0)
    })
    test('with attached open api documentation', () => {
      //
    })
    test('with attached open api documents with colliding parameters', () => {
      //
    })
    test('with initially provided schemas', () => {
      //
    })
    test('with references for parameters', () => {
      //
    })
    test('with references for other components', () => {
      //
    })
    test('with using the document component interface', () => {
      //
    })
    test('with using the operation builder interface', () => {
      //
    })
    test('with using the response builder interface', () => {
      //
    })
  })

  describe('based on generated open api document it validates a requests', () => {
    test('query parameters', () => {
      //
    })
    test('path parameters', () => {
      //
    })
    test('request body', () => {
      //
    })
    test('headers', () => {
      //
    })
  })

})