/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { onlyForTesting } from '../openapi-builder';
import { OpenApiDocumentBuilder } from '../index';
import swaggerExampleSchema from '../../resources/swaggerio-example.json';
import { ExpressPath } from '../types';
// import OpenApiPath from '../middleware/openApiPath'
const document: OpenAPIV3.Document = swaggerExampleSchema as OpenAPIV3.Document;

const stub = JSON.parse(
  JSON.stringify({
    openapi: document.openapi,
    info: document.info,
    externalDocs: document.externalDocs,
    servers: document.servers,
    tags: document.tags,
  }),
) as OpenAPIV3.Document;

describe('verifyBasicOpenApiReqs handles', () => {
  it('a correct document stub', () => {
    expect(onlyForTesting.verifyBasicOpenApiReqs(stub)).toEqual('');
  });
  it('a document missing info', () => {
    const stub2 = { openapi: stub.openapi };
    expect(onlyForTesting.verifyBasicOpenApiReqs(stub2 as OpenAPIV3.Document)).toEqual('info, title and version.');
  });
  it('a document missing title and version', () => {
    const stub2 = {
      openapi: stub.openapi,
      info: { contact: stub.info.contact },
    };
    expect(onlyForTesting.verifyBasicOpenApiReqs(stub2 as OpenAPIV3.Document)).toEqual('title and version.');
  });
  it('a document missing openapi version', () => {
    const stub2 = { info: stub.info };
    expect(onlyForTesting.verifyBasicOpenApiReqs(stub2 as OpenAPIV3.Document)).toEqual('openapi, ');
  });
});

describe('transformExpressPathToOpenApi handles', () => {
  it('an ExpressPath object', () => {
    const expressPath: ExpressPath = {
      path: 'test/:id/endpoint',
      method: 'get',
      pathParams: [{ name: 'id', in: 'path' }],
      exclude: false,
    };
    onlyForTesting.transformExpressPathToOpenApi(expressPath);
    expect(expressPath.path).toEqual('test/{id}/endpoint');
  });
  it('multiple parameters', () => {
    const expressPath: ExpressPath = {
      path: 'test/:id/:endpoint/:name/new',
      method: 'get',
      pathParams: [
        { name: 'id', in: 'path' },
        { name: 'endpoint', in: 'path' },
        { name: 'name', in: 'path' },
      ],
      exclude: false,
    };
    onlyForTesting.transformExpressPathToOpenApi(expressPath);
    expect(expressPath.path).toEqual('test/{id}/{endpoint}/{name}/new');
  });
});

describe('mergeParameters handles', () => {
  it(' merging parameters and path', () => {
    const expressPath: ExpressPath = {
      path: 'test/:id/:endpoint',
      method: 'get',
      pathParams: [{ name: 'id', in: 'path', schema: { type: 'string' } }, { name: 'endpoint', in: 'path', schema: { type: 'string' } }],
      exclude: false,
    };
    let parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] = [
      { name: 'id', in: 'path', description: 'Test', schema: { type: 'integer', format: 'int64' } },
    ];
    parameters = onlyForTesting.mergeParameters(parameters, expressPath);
    // eslint-disable-next-line no-console
    console.log(parameters);
    expect(parameters).toEqual([{
      name: 'id',
      in: 'path',
      description: 'Test',
      schema: { type: 'integer', format: 'int64' },
    }, { name: 'endpoint', in: 'path', schema: { type: 'string' } }]);
    expect(expressPath.pathParams.length).toBe(1);
  });
});

describe('buildPathsObject handles', () => {
  it('')
})

it('detects the openApiPath middleware', (done) => {
  done();
});
