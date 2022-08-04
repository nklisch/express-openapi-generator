import { ParameterBuilder } from '../index';
describe('Parameter builder is able to', () => {
    it('build a query parameter', () => {
        expect(ParameterBuilder.query('test').stringType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'string' },
        });
        expect(ParameterBuilder.query('test').booleanType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'boolean' },
        });
        expect(ParameterBuilder.query('test').numberType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'number' },
        });
        expect(ParameterBuilder.query('test').integerType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'integer' },
        });
        expect(
            ParameterBuilder.query('test')
                .schema({ type: 'object', properties: { name: { type: 'string' } } })
                .build(),
        ).toEqual({ name: 'test', in: 'query', schema: { type: 'object', properties: { name: { type: 'string' } } } });
        expect(ParameterBuilder.query('test').isRequired().stringType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'string' },
            required: true,
        });
        expect(ParameterBuilder.query('test').deprecated().stringType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'string' },
            deprecated: true,
        });
        expect(ParameterBuilder.query('test').example('Hello').stringType()).toEqual({
            name: 'test',
            in: 'query',
            schema: { type: 'string' },
            example: 'Hello',
        });
    });

    it('build a path parameter', () => {
        expect(ParameterBuilder.path('test').stringType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'string' },
            required: true,
        });
        expect(ParameterBuilder.path('test').booleanType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'boolean' },
            required: true,
        });
        expect(ParameterBuilder.path('test').numberType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'number' },
            required: true,
        });
        expect(ParameterBuilder.path('test').integerType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'integer' },
            required: true,
        });
        expect(
            ParameterBuilder.path('test')
                .schema({ type: 'object', properties: { name: { type: 'string' } } })
                .b(),
        ).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'object', properties: { name: { type: 'string' } } },
            required: true,
        });
        expect(ParameterBuilder.path('test').isRequired().stringType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'string' },
            required: true,
        });
        expect(ParameterBuilder.path('test').deprecated().stringType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'string' },
            deprecated: true,
            required: true,
        });
        expect(ParameterBuilder.path('test').example('Hello').stringType()).toEqual({
            name: 'test',
            in: 'path',
            schema: { type: 'string' },
            example: 'Hello',
            required: true,
        });
    });

    it('build a header parameter', () => {
        expect(ParameterBuilder.header('test').stringType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'string' },
        });
        expect(ParameterBuilder.header('test').booleanType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'boolean' },
        });
        expect(ParameterBuilder.header('test').numberType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'number' },
        });
        expect(ParameterBuilder.header('test').integerType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'integer' },
        });
        expect(
            ParameterBuilder.header('test')
                .schema({ type: 'object', properties: { name: { type: 'string' } } })
                .build(),
        ).toEqual({ name: 'test', in: 'header', schema: { type: 'object', properties: { name: { type: 'string' } } } });
        expect(ParameterBuilder.header('test').isRequired().stringType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'string' },
            required: true,
        });
        expect(ParameterBuilder.header('test').deprecated().stringType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'string' },
            deprecated: true,
        });
        expect(ParameterBuilder.header('test').example('Hello').stringType()).toEqual({
            name: 'test',
            in: 'header',
            schema: { type: 'string' },
            example: 'Hello',
        });
    });
    it('build a cookie parameter', () => {
        expect(ParameterBuilder.cookie('test').stringType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'string' },
        });
        expect(ParameterBuilder.cookie('test').booleanType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'boolean' },
        });
        expect(ParameterBuilder.cookie('test').numberType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'number' },
        });
        expect(ParameterBuilder.cookie('test').integerType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'integer' },
        });
        expect(
            ParameterBuilder.cookie('test')
                .schema({ type: 'object', properties: { name: { type: 'string' } } })
                .b(),
        ).toEqual({ name: 'test', in: 'cookie', schema: { type: 'object', properties: { name: { type: 'string' } } } });
        expect(ParameterBuilder.cookie('test').isRequired().stringType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'string' },
            required: true,
        });
        expect(ParameterBuilder.cookie('test').deprecated().stringType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'string' },
            deprecated: true,
        });
        expect(ParameterBuilder.cookie('test').example('Hello').stringType()).toEqual({
            name: 'test',
            in: 'cookie',
            schema: { type: 'string' },
            example: 'Hello',
        });
    });
});
