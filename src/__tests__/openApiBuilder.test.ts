/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { onlyForTesting } from '../openapi-builder';
import { DocumentBuilder } from '../index';
import swaggerExampleSchema from '../../resources/swaggerio-example.json';
import { ComponentFieldNames } from '../types';
import { RouteMetaData } from 'express-route-parser';
import clone from '../utl';

const document: OpenAPIV3.Document = swaggerExampleSchema as OpenAPIV3.Document;

const stub = clone({
    openapi: document.openapi,
    info: document.info,
    externalDocs: document.externalDocs,
    servers: document.servers,
    tags: document.tags,
}) as OpenAPIV3.Document;

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
            metadata: { exclude: false, operationId: 'test' },
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
            metadata: { exclude: false, operationId: 'test' },
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
    it('attaches document components', () => {
        const doc = clone(stub);
        doc.components = swaggerExampleSchema.components as OpenAPIV3.ComponentsObject;
        const builder = DocumentBuilder.initializeDocument(doc);
        expect(builder.schema('user')).toEqual({ $ref: '#/components/schemas/user' });
        expect(builder.schema('repository', { copy: true })).toEqual(
            swaggerExampleSchema.components.schemas.repository,
        );
    });

    it('saves a component to the document', () => {
        const schema = clone(swaggerExampleSchema.components.schemas.pullrequest) as OpenAPIV3.SchemaObject;
        const link = clone(swaggerExampleSchema.components.links.PullRequestMerge) as OpenAPIV3.LinkObject;
        const builder = DocumentBuilder.initializeDocument(clone(stub));
        builder.schema('pullrequest', { component: schema });
        builder.link('PullRequestMerge', { component: link });
        expect(builder.schema('pullrequest')).toEqual({ $ref: '#/components/schemas/pullrequest' });
        expect(builder.schema('pullrequest', { copy: true })).toEqual(schema);
        expect(builder.schema('nonexisting')).toBe(undefined);

        expect(builder.link('PullRequestMerge')).toEqual({ $ref: '#/components/links/PullRequestMerge' });
        expect(builder.link('PullRequestMerge', { copy: true })).toEqual(link);

        builder.response('testing', { component: responseObject });
        expect(builder.response('testing')).toEqual({ $ref: '#/components/responses/testing' });
        expect(builder.response('testing', { copy: true })).toEqual(responseObject);

        builder.parameter('testing', { component: parameterObject });
        expect(builder.parameter('testing')).toEqual({ $ref: '#/components/parameters/testing' });
        expect(builder.parameter('testing', { copy: true })).toEqual(parameterObject);

        builder.example('testing', { component: exampleObject });
        expect(builder.example('testing')).toEqual({ $ref: '#/components/examples/testing' });
        expect(builder.example('testing', { copy: true })).toEqual(exampleObject);

        builder.requestBody('testing', { component: requestBody });
        expect(builder.requestBody('testing')).toEqual({ $ref: '#/components/requestBodies/testing' });
        expect(builder.requestBody('testing', { copy: true })).toEqual(requestBody);

        builder.header('testing', { component: headerObject });
        expect(builder.header('testing')).toEqual({ $ref: '#/components/headers/testing' });
        expect(builder.header('testing', { copy: true })).toEqual(headerObject);

        builder.securityScheme('testing', { component: securityObject });
        expect(builder.securityScheme('testing')).toEqual({ $ref: '#/components/securitySchemes/testing' });
        expect(builder.securityScheme('testing', { copy: true })).toEqual(securityObject);

        builder.callback('testing', { component: securityObject });
        expect(builder.callback('testing')).toEqual({ $ref: '#/components/callbacks/testing' });
        expect(builder.callback('testing', { copy: true })).toEqual(securityObject);
    });

    it('gets a document instance', () => {
        DocumentBuilder.initializeDocument(stub);
        DocumentBuilder.documentBuilder.schema('testing', {
            component: clone(swaggerExampleSchema.components.schemas.pullrequest) as OpenAPIV3.SchemaObject,
        });
        expect(DocumentBuilder.documentBuilder.schema('testing')).toEqual({
            $ref: '#/components/schemas/testing',
        });
    });

    it('throws error on incomplete document', () => {
        const stub2 = { openapi: stub.openapi };
        expect(() => DocumentBuilder.initializeDocument(stub2 as OpenAPIV3.Document)).toThrow();
    });

    it('throws error if getting instances before initialized', () => {
        DocumentBuilder.deleteDocumentInstance();
        expect(() => DocumentBuilder.documentBuilder).toThrow();
    });

    it('throws error if component field name is wrong', () => {
        expect(() =>
            DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document).component(
                'n/a' as ComponentFieldNames,
                'test',
            ),
        ).toThrow();
    });

    it('can create composite schemas', () => {
        const builder = DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document);
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
        const builder = DocumentBuilder.initializeDocument(swaggerExampleSchema as OpenAPIV3.Document);
        expect(() => builder.allOf(['n/a'])).toThrow();
    });
});
