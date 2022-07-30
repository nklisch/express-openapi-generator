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
        const builder = new ResponseBuilder('testing').content(contentObject).headers({}).links({});
        expect(builder.responseObject).toEqual({
            description: 'testing',
            headers: {},
            content: contentObject,
            links: {},
        });
    });

    it('uses defaults', () => {
        const builder = new ResponseBuilder('testing', { mediaType: 'application/json' }).mediaType(
            contentObject['*/*'],
        );
        expect(builder.responseObject).toEqual({
            description: 'testing',
            content: { 'application/json': contentObject['*/*'] },
        });
    });

    it('throws error if mediaType is not provided', () => {
        expect(() => new ResponseBuilder('testing').mediaType(contentObject['*/*'])).toThrow();
    });
});
