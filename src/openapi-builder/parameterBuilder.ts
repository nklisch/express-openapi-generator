/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';
import clone from '../utl';

export default class ParameterBuilder {
    private readonly _parameter: OpenAPIV3.ParameterObject

    /**
     * Starts building a path parameter object
     * 
     * @param name The name of the parameter
     * @returns ParameterBuilder instance for method chaining
     */
    public static path(name: string): ParameterBuilder {
        return new ParameterBuilder(name, 'path');
    }
    /**
     * Starts building a query parameter object
     * 
     * @param name The name of the parameter
     * @returns ParameterBuilder instance for method chaining
     */
    public static query(name: string): ParameterBuilder {
        return new ParameterBuilder(name, 'query');
    }
    /**
     * Starts building a header parameter object
     * 
     * @param name The name of the parameter
     * @returns ParameterBuilder instance for method chaining
     */
    public static header(name: string): ParameterBuilder {
        return new ParameterBuilder(name, 'header');
    }
    /**
     * Starts building a cookie parameter object
     * 
     * @param name The name of the parameter
     * @returns ParameterBuilder instance for method chaining
     */
    public static cookie(name: string): ParameterBuilder {
        return new ParameterBuilder(name, 'cookie');
    }

    private constructor(name: string, _in: string) {
        const parameter: OpenAPIV3.ParameterObject = { name, in: _in };
        if (_in === 'path') {
            parameter.required = true;
        }
        this._parameter = parameter;
    }
    /**
     * Sets the required field, defaults to true
     * 
     * @param {boolean} [required=true] Required flag
     * @returns ParameterBuilder instance for method chaining
     */
    public isRequired(required = true) {
        this._parameter.required = required;
        return this;
    }
    /**
     * Sets the deprecated field, defaults to true
     * 
     * @param {boolean} [deprecated=true] Deprecated flag
     * @returns ParameterBuilder instance for method chaining
     */
    public deprecated(deprecated = true) {
        this._parameter.deprecated = deprecated;
        return this;
    }
    /**
     * Sets the parameter's schema to be a simple string type.
     * Used to offer quick complete - does not require .build()
     * 
     * @returns A complete OpenApiv3 parameter object
     */
    public stringType() {
        this._parameter.schema = { type: 'string' };
        return clone(this._parameter)
    }

    /**
     * Sets the parameter's schema to be a simple boolean type.
     * Used to offer quick complete - does not require .build()
     * 
     * @returns A complete OpenApiv3 parameter object
     */
    public booleanType() {
        this._parameter.schema = { type: 'boolean' }
        return clone(this._parameter)
    }

    /**
     * Sets the parameter's schema to be a simple integer type.
     * Used to offer quick complete - does not require .build()
     * 
     * @returns A complete OpenApiv3 parameter object
     */
    public integerType() {
        this._parameter.schema = { type: 'integer' }
        return clone(this._parameter)
    }

    /**
     * Sets the parameter's schema to be a simple number type.
     * Used to offer quick complete - does not require .build()
     * 
     * @returns A complete OpenApiv3 parameter object
     */
    public numberType() {
        this._parameter.schema = { type: 'number' }
        return clone(this._parameter)
    }
    /**
     * Sets the parameter's schema field
     * 
     * @returns ParameterBuilder instance for method chaining
     */
    public schema(schema: OpenAPIV3.SchemaObject) {
        this._parameter.schema = schema;
        return this;
    }

    /**
     * Sets the parameter's schema field
     * 
     * @returns ParameterBuilder instance for method chaining
     */
    public example(example: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this._parameter.example = example;
        return this;
    }

    /**
     * Creates a deep copy of the current state of the parameter object and returns it.
     *
     * @returns A deep copy of the built parameter object
     */
    public build(): OpenAPIV3.ParameterObject {
        return clone(this._parameter);
    }

    /**
     * Shorthand for build() method.
     * 
     * @returns A deep copy of the built parameter object
     */
    public b(): OpenAPIV3.ParameterObject {
        return this.build();
    }


}
