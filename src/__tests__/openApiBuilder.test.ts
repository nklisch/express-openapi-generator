/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { onlyForTesting } from '../openapi-builder';
import { DocumentBuilder } from '../index';
import swaggerExampleSchema from '../../resources/swaggerio-example.json';
import { ComponentFieldNames } from '../types';
import { RouteMetaData } from 'express-route-parser';
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
  '/test/{id}': {
    get: {
      operationId: 'getTest',
      parameters: [
        {
          name: 'id',
          in: 'path',
          schema: {
            type: 'string',
          },
          required: true
        },
      ],
      responses: {
        default: {
          description: 'Responses object not provided for this route',
        },
      },
    },
  },
  '/test': {
    get: {
      operationId: 'getTests',
      responses: {
        default: {
          description: 'Responses object not provided for this route',
        },
      },
    },
  },
  '/test/{name}/{id}': {
    post: {
      tags: ['testing'],
      summary: 'test object',
      description: 'A test',
      operationId: 'createTest',
      parameters: [
        {
          name: 'id',
          in: 'path',
          schema: {
            type: 'integer',
          },
          required: true
        },
        {
          name: 'name',
          in: 'path',
          schema: {
            type: 'string',
          },
          required: true
        },
        {
          name: 'testing',
          in: 'query',
          schema: {
            type: 'integer',
          }
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                test: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'testing response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  test: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const exampleOperation: OpenAPIV3.OperationObject = {
  tags: ['testing'],
  summary: 'test object',
  description: 'A test',
  operationId: 'createTest',
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'integer' } },
    { name: 'name', in: 'path', schema: { type: 'string' } },
    { name: 'testing', in: 'query', schema: { type: 'integer' } },
  ],
  requestBody: {
    content: { 'application/json': { schema: { type: 'object', properties: { test: { type: 'string' } } } } },
  },
  responses: {
    '200': {
      description: 'testing response',
      content: { 'application/json': { schema: { type: 'object', properties: { test: { type: 'string' } } } } },
    },
  },
};
const parserOutput: RouteMetaData[] = [
  {
    path: '/test/:id',
    method: 'get',
    pathParams: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
    metadata: { exclude: false, operationId: 'getTest' }
  },
  { path: '/test', method: 'get', pathParams: [], metadata: { exclude: false, operationId: 'getTests' } },
  {
    path: '/test/:name/:id',
    method: 'post',
    pathParams: [
      { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
      { name: 'name', in: 'path', schema: { type: 'string' }, required: true },
    ],
    metadata: { exclude: false, operationId: 'createTest', openApiOperation: exampleOperation }
  },
];

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
    const expressPath: RouteMetaData = {
      path: 'test/:id/endpoint',
      method: 'get',
      pathParams: [{ name: 'id', in: 'path', required: true }],
      metadata: { exclude: false, operationId: 'test' }
    };
    onlyForTesting.transformExpressPathToOpenApi(expressPath);
    expect(expressPath.path).toEqual('test/{id}/endpoint');
  });
  it('multiple parameters', () => {
    const expressPath: RouteMetaData = {
      path: 'test/:id/:endpoint/:name/new',
      method: 'get',
      pathParams: [
        { name: 'id', in: 'path', required: true },
        { name: 'endpoint', in: 'path', required: true },
        { name: 'name', in: 'path', required: true },
      ],
      metadata: { exclude: false, operationId: 'test' }
    };
    onlyForTesting.transformExpressPathToOpenApi(expressPath);
    expect(expressPath.path).toEqual('test/{id}/{endpoint}/{name}/new');
  });
});

const responseObject: OpenAPIV3.ResponseObject = {
  description: 'A complex object array response',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/VeryComplexType',
        },
      },
    },
  },
};

const parameterObject: OpenAPIV3.ParameterObject = {
  name: 'id',
  in: 'query',
  description: 'ID of the object to fetch',
  required: false,
  schema: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  style: 'form',
  explode: true,
};
const exampleObject: OpenAPIV3.ExampleObject = {
  summary: 'A foo example',
  value: { foo: 'bar' },
};
const requestBody: OpenAPIV3.RequestBodyObject = {
  description: 'user to add to the system',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/User',
      },
      examples: {
        user: {
          summary: 'User Example',
          externalValue: 'http://foo.bar/examples/user-example.json',
        },
      },
    },
    'application/xml': {
      schema: {
        $ref: '#/components/schemas/User',
      },
      examples: {
        user: {
          summary: 'User example in XML',
          externalValue: 'http://foo.bar/examples/user-example.xml',
        },
      },
    },
    'text/plain': {
      examples: {
        user: {
          summary: 'User example in Plain text',
          externalValue: 'http://foo.bar/examples/user-example.txt',
        },
      },
    },
    '*/*': {
      examples: {
        user: {
          summary: 'User example in other format',
          externalValue: 'http://foo.bar/examples/user-example.whatever',
        },
      },
    },
  },
};

const headerObject: OpenAPIV3.HeaderObject = {
  description: 'The number of allowed requests in the current period',
  schema: {
    type: 'integer',
  },
};

const securityObject: OpenAPIV3.SecuritySchemeObject = {
  type: 'apiKey',
  name: 'api_key',
  in: 'header',
};

describe('OpenApiDocumentBuilder', () => {
  it('builds documents with a stub and input', () => {
    const doc = structuredClone(stub);
    const builder = DocumentBuilder.initializeDocument(doc, true);
    builder.buildPathsObject(parserOutput);
    doc.paths = pathsObject;
    expect(builder.document).toEqual(doc);
  });
  it('attaches document components', () => {
    const doc = structuredClone(stub);
    doc.components = swaggerExampleSchema.components as OpenAPIV3.ComponentsObject;
    const builder = DocumentBuilder.initializeDocument(doc, true);
    expect(builder.schema({ name: 'user' })).toEqual({ $ref: '#/components/schemas/user' });
    expect(builder.schema({ name: 'repository', copy: true })).toEqual(
      swaggerExampleSchema.components.schemas.repository,
    );
  });

  it('saves a component to the document', () => {
    const schema = structuredClone(swaggerExampleSchema.components.schemas.pullrequest);
    const link = structuredClone(swaggerExampleSchema.components.links.PullRequestMerge);
    const builder = DocumentBuilder.initializeDocument(structuredClone(stub), true);
    builder.schema({ name: 'pullrequest', component: schema as OpenAPIV3.SchemaObject });
    builder.link({ name: 'PullRequestMerge', component: link });
    expect(builder.schema({ name: 'pullrequest' })).toEqual({ $ref: '#/components/schemas/pullrequest' });
    expect(builder.schema({ name: 'pullrequest', copy: true })).toEqual(schema);
    expect(builder.schema({ name: 'nonexisting' })).toBe(undefined);

    expect(builder.link({ name: 'PullRequestMerge' })).toEqual({ $ref: '#/components/links/PullRequestMerge' });
    expect(builder.link({ name: 'PullRequestMerge', copy: true })).toEqual(link);

    builder.response({ name: 'testing', component: responseObject });
    expect(builder.response({ name: 'testing' })).toEqual({ $ref: '#/components/responses/testing' });
    expect(builder.response({ name: 'testing', copy: true })).toEqual(responseObject);

    builder.parameter({ name: 'testing', component: parameterObject });
    expect(builder.parameter({ name: 'testing' })).toEqual({ $ref: '#/components/parameters/testing' });
    expect(builder.parameter({ name: 'testing', copy: true })).toEqual(parameterObject);

    builder.example({ name: 'testing', component: exampleObject });
    expect(builder.example({ name: 'testing' })).toEqual({ $ref: '#/components/examples/testing' });
    expect(builder.example({ name: 'testing', copy: true })).toEqual(exampleObject);

    builder.requestBody({ name: 'testing', component: requestBody });
    expect(builder.requestBody({ name: 'testing' })).toEqual({ $ref: '#/components/requestBodies/testing' });
    expect(builder.requestBody({ name: 'testing', copy: true })).toEqual(requestBody);

    builder.header({ name: 'testing', component: headerObject });
    expect(builder.header({ name: 'testing' })).toEqual({ $ref: '#/components/headers/testing' });
    expect(builder.header({ name: 'testing', copy: true })).toEqual(headerObject);

    builder.securityScheme({ name: 'testing', component: securityObject });
    expect(builder.securityScheme({ name: 'testing' })).toEqual({ $ref: '#/components/securitySchemes/testing' });
    expect(builder.securityScheme({ name: 'testing', copy: true })).toEqual(securityObject);

    builder.callback({ name: 'testing', component: securityObject });
    expect(builder.callback({ name: 'testing' })).toEqual({ $ref: '#/components/callbacks/testing' });
    expect(builder.callback({ name: 'testing', copy: true })).toEqual(securityObject);
  });

  it('gets a document instance', () => {
    DocumentBuilder.initializeDocument(stub);
    DocumentBuilder.documentBuilder.schema({
      name: 'testing',
      component: structuredClone(swaggerExampleSchema.components.schemas.pullrequest) as OpenAPIV3.SchemaObject,
    });
    expect(DocumentBuilder.documentBuilder.schema({ name: 'testing' })).toEqual({
      $ref: '#/components/schemas/testing',
    });
  });

  it('throws error on incomplete document', () => {
    const stub2 = { openapi: stub.openapi };
    expect(() => DocumentBuilder.initializeDocument(stub2 as OpenAPIV3.Document, true)).toThrow();
  });

  it('throws error if getting instances before initialized', () => {
    DocumentBuilder.deleteDocumentInstance();
    expect(() => DocumentBuilder.documentBuilder).toThrow();
  });

  it('throws error if component field name is wrong', () => {
    expect(() =>
      DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document).component(
        'n/a' as ComponentFieldNames,
        { name: 'test' },
      ),
    ).toThrow();
  });

  it('can create composite schemas', () => {
    const builder = DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document, true);
    expect(builder.allOf(['pullrequest', 'user'])).toEqual({
      allOf: [{ $ref: '#/components/schemas/pullrequest' }, { $ref: '#/components/schemas/user' }],
    });
    expect(builder.oneOf(['pullrequest', 'user'])).toEqual({
      oneOf: [{ $ref: '#/components/schemas/pullrequest' }, { $ref: '#/components/schemas/user' }],
    });
    expect(builder.anyOf(['pullrequest', 'user'])).toEqual({
      anyOf: [{ $ref: '#/components/schemas/pullrequest' }, { $ref: '#/components/schemas/user' }],
    });
  });

  it("throws error a schema in composite schema doesn't exist", () => {
    const builder = DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document, true);
    expect(() => builder.allOf(['n/a'])).toThrow();
  });
});
