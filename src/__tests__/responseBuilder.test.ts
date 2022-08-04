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
                .b(),
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
    it('create response object with an array schema', () => {
        expect(ResponseBuilder.new('testing').schemaArray({ type: 'string' }, 'application/json').b()).toEqual({
            description: 'testing',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
        });
    });
});
