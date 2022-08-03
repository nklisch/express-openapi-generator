/* eslint-disable @typescript-eslint/naming-convention */
import { OpenAPIV3 } from 'openapi-types';
import { ResponseBuilder } from '../index';
const contentObject: { [media: string]: OpenAPIV3.MediaTypeObject } = {
    '*/*': {
        schema: {
            type: 'array',
            items: {
                $ref: '#/components/schemas/Pet',
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
describe('ResponseBuilder', () => {
    it('builds an operation', () => {
        expect(ResponseBuilder.new('testing').content(contentObject).headers({}).links({}).build()).toEqual({
            description: 'testing',
            headers: {},
            content: contentObject,
            links: {},
        });
    });

    it('uses defaults', () => {
        ResponseBuilder.defaults({ mimeType: 'application/json' });
        expect(
            ResponseBuilder.new('testing')
                .schema(contentObject['*/*'].schema as OpenAPIV3.SchemaObject)
                .build(),
        ).toEqual({
            description: 'testing',
            content: { 'application/json': contentObject['*/*'] },
        });
    });

    it('throws error if mediaType is not provided', () => {
        ResponseBuilder.defaults({});
        expect(() =>
            ResponseBuilder.new('testing').schema(contentObject['*/*'].schema as OpenAPIV3.SchemaObject),
        ).toThrow();
    });
});
