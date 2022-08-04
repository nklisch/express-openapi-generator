/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { OperationBuilder } from '../index';

const responsesObject: OpenAPIV3.ResponsesObject = {
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

const securityObject: OpenAPIV3.SecuritySchemeObject = {
    type: 'apiKey',
    name: 'api_key',
    in: 'header',
};

it('builds an operation', () => {
    const operation = OperationBuilder.new(responsesObject)
        .tags(['test'])
        .operationId('testing')
        .requestBody(requestBody)
        .summary('My operation')
        .callbacks({ test: { $ref: 'test' } })
        .description('testing operation')
        .parameters([parameterObject])
        .security([])
        .deprecated(false)
        .externalDocs({ url: 'testing' })
        .servers([])
        .build();

    expect(operation).toEqual({
        responses: responsesObject,
        tags: ['test'],
        operationId: 'testing',
        requestBody,
        summary: 'My operation',
        callbacks: { test: { $ref: 'test' } },
        description: 'testing operation',
        parameters: [parameterObject],
        security: [],
        deprecated: false,
        externalDocs: { url: 'testing' },
        servers: [],
    });
});

it('uses defaults', () => {
    OperationBuilder.defaults({ tags: ['testing'] });
    expect(OperationBuilder.new(responsesObject).b()).toEqual({ responses: responsesObject, tags: ['testing'] });
});
