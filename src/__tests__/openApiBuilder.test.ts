/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { onlyForTesting } from '../openapi-builder';
import { OpenApiDocumentBuilder } from '../index';
import swaggerExampleSchema from '../../resources/swaggerio-example.json';
import { ExpressPath } from '../types';
// import OpenApiPath from '../middleware/openApiPath'
const document: OpenAPIV3.Document = swaggerExampleSchema as OpenAPIV3.Document;


const stub = structuredClone({
  openapi: document.openapi,
  info: document.info,
  externalDocs: document.externalDocs,
  servers: document.servers,
  tags: document.tags,
}) as OpenAPIV3.Document;

const pathsObject: OpenAPIV3.PathsObject = {
  "/test/{id}": {
    get: {
      operationId: "getTest",
      parameters: [
        {
          name: "id",
          in: "path",
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        default:
        {
          description: "Responses object not provided for this route",
        },
      },
    },
  },
  "/test": {
    get: {
      operationId: "getTests",
      responses: {
        default:
        {
          description: "Responses object not provided for this route",
        },
      },
    },
  },
  "/test/{name}/{id}": {
    post: {
      tags: [
        "testing",
      ],
      summary: "test object",
      description: "A test",
      operationId: "createTest",
      parameters: [
        {
          name: "id",
          in: "path",
          schema: {
            type: "integer",
          },
        },
        {
          name: "name",
          in: "path",
          schema: {
            type: "string",
          },
        },
        {
          name: "testing",
          in: "query",
          schema: {
            type: "integer",
          },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                test: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "testing response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  test: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}



const exampleOperation: OpenAPIV3.OperationObject = {
  tags: ['testing'],
  summary: 'test object',
  description: 'A test',
  operationId: 'createTest',
  parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' } }, { name: 'name', in: 'path', schema: { type: 'string' } }, { name: 'testing', in: 'query', schema: { type: 'integer' } }],
  requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { test: { type: 'string' } } } } } },
  responses: { '200': { description: 'testing response', content: { 'application/json': { schema: { type: 'object', properties: { test: { type: 'string' } } } } } } }
}
const parserOutput: ExpressPath[] = [
  { path: '/test/:id', method: 'get', pathParams: [{ name: 'id', in: 'path', schema: { type: 'string' } }], exclude: false, operationId: 'getTest' },
  { path: '/test', method: 'get', pathParams: [], exclude: false, operationId: 'getTests' },
  { path: '/test/:name/:id', method: 'post', pathParams: [{ name: 'id', in: 'path', schema: { type: 'string' } }, { name: 'name', in: 'path', schema: { type: 'string' } }], exclude: false, openApiOperation: exampleOperation, operationId: 'createTest' }
]

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
      operationId: 'test'
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
      operationId: 'test'
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
      pathParams: [
        { name: 'id', in: 'path', schema: { type: 'string' } },
        { name: 'endpoint', in: 'path', schema: { type: 'string' } },
      ],
      exclude: false,
      operationId: 'test'
    };
    let parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] = [
      { name: 'id', in: 'path', description: 'Test', schema: { type: 'integer', format: 'int64' } },
    ];
    parameters = onlyForTesting.mergeParameters(parameters, expressPath);
    expect(parameters).toEqual([
      {
        name: 'id',
        in: 'path',
        description: 'Test',
        schema: { type: 'integer', format: 'int64' },
      },
      { name: 'endpoint', in: 'path', schema: { type: 'string' } },
    ]);
    expect(expressPath.pathParams.length).toBe(1);
  });
});

describe('buildPathsObject handles', () => {

  it('an expected input with defaults', () => {
    expect(onlyForTesting.buildPathsObject(parserOutput, false, false)).toEqual(pathsObject);
  });

  it('handles excluding paths', () => {
    const parserOutputCopy = structuredClone(parserOutput);
    parserOutputCopy[0].exclude = true;
    const pathsObjectCopy = structuredClone(pathsObject);
    delete pathsObjectCopy["/test/{id}"];
    expect(onlyForTesting.buildPathsObject(parserOutputCopy, false, false)).toEqual(pathsObjectCopy);
    expect(onlyForTesting.buildPathsObject(parserOutputCopy, false, true)).toEqual(pathsObject);
  });

  it('handles excluding paths with no docs', () => {
    const pathsObjectCopy = structuredClone(pathsObject);
    delete pathsObjectCopy["/test/{id}"]
    delete pathsObjectCopy["/test"]
    expect(onlyForTesting.buildPathsObject(parserOutput, true, false)).toEqual(pathsObjectCopy);
  });

});

describe('OpenApiDocumentBuilder builds documents', () => {
  it('with a stub and input', () => {
    const doc = structuredClone(stub);
    const builder = OpenApiDocumentBuilder.initializeDocument(doc, true);
    builder.buildPathsObject(parserOutput)
    doc.paths = pathsObject;
    expect(builder.document).toEqual(doc);
  })
  it('attaches document components', () => {
    const doc = structuredClone(stub);
    doc.components = swaggerExampleSchema.components as OpenAPIV3.ComponentsObject;
    const builder = OpenApiDocumentBuilder.initializeDocument(doc, true);
    expect(builder.schema({ name: 'user' })).toEqual({ $ref: '#/components/schemas/user' })
    expect(builder.schema({ name: 'repository', copy: true })).toEqual(swaggerExampleSchema.components.schemas.repository);
  })
})
