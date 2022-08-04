/* eslint-disable @typescript-eslint/naming-convention */
import { RequestBodyBuilder } from '../index';

describe('RequestBodyBuilder is able to', () => {
    it('create requestBodyObject', () => {
        expect(
            RequestBodyBuilder.new('testing')
                .content({ 'application/json': { schema: { type: 'number' } } })
                .build(),
        ).toEqual({ description: 'testing', content: { 'application/json': { schema: { type: 'number' } } } });
    });
    it('create requestBodyObject with the schema method', () => {
        expect(RequestBodyBuilder.new('testing').schema({ type: 'number' }, 'application/json').build()).toEqual({
            description: 'testing',
            content: { 'application/json': { schema: { type: 'number' } } },
        });
    });
    it('create requestBodyObject with defaults', () => {
        RequestBodyBuilder.defaults({ mimeType: 'application/json' });
        expect(RequestBodyBuilder.new('testing').schema({ type: 'number' }).build()).toEqual({
            description: 'testing',
            content: { 'application/json': { schema: { type: 'number' } } },
        });
    });
    it('create requestBodyObject with an array schema', () => {
        expect(RequestBodyBuilder.new('testing').schemaArray({ type: 'string' }, 'application/json').b()).toEqual({
            description: 'testing',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
        });
    });
});
