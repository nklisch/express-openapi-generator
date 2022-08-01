/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-underscore-dangle */

import { OpenAPIV3 } from 'openapi-types';
import { ComponentFieldNames, CompositeSchemaTypes, Component, ComponentParameter } from '../types';
import { Parameter, parseExpressApp } from 'express-route-parser';
import { RouteMetaData } from '../types';
import { Express } from 'express';
import clone from '../utl';
export default class DocumentBuilder {
    private static instance?: DocumentBuilder;
    private readonly _document: OpenAPIV3.Document;
    private readonly components: Map<string, Component>;

    private constructor(documentStub: OpenAPIV3.Document) {
        documentStub = clone(documentStub);
        const missingFields = verifyBasicOpenApiReqs(documentStub);
        if (missingFields) {
            throw new Error('Provided Open Api stub document is missing the following fields: ' + missingFields);
        }
        this._document = documentStub;
        this.components = new Map<string, Component>();
        this.processComponents();
    }
    /**
     * Deletes the singleton instance, allowing re-initialization if desired.
     */
    public static deleteDocumentInstance(): void {
        if (DocumentBuilder.instance) {
            delete DocumentBuilder.instance;
        }
    }

    /**
     * Initializes the singleton document. This allows you to import this class from
     * any module and maintain an global document reference.
     *
     * @remarks
     * **Warning**: Each call to this method will override previous instances, loosing the internal document.
     * Recommended to only call this once per project.
     *
     * @param documentStub The minimum required OpenApiv3 skeleton spec
     * @returns The document builder object instance
     */
    public static initializeDocument(documentStub: OpenAPIV3.Document): DocumentBuilder {
        DocumentBuilder.instance = new DocumentBuilder(documentStub);
        return DocumentBuilder.instance;
    }
    /**
     * Retrieves the current document builder instance.
     * Used to retrieve references across modules.
     */
    public static get documentBuilder(): DocumentBuilder {
        if (!DocumentBuilder.instance) {
            throw new Error('Must initialize document before getting builder instance');
        }
        return DocumentBuilder.instance;
    }
    /**
     * Parses the express app and builds an OpenApiv3 Paths object
     *
     * @remarks
     * **Warning**: This must be used after all other routes have been attached
     * and processed onto the express app. Suggested to be placed right before app.listen().
     *
     * You may use this, build a document, then use this method with different flags and build again for multiple
     * versions of the OpenApi v3 document.
     *
     * This allows you to remove routes you don't want documented on one doc, but include it on another.
     *
     * @param app The Express App object
     * @param requireOpenApiDocs Require extended OpenApi middleware documentation to exist to include the route in the final Paths Object
     * @param includeExcludedPaths Override the exclude flag that was attached by middleware and include those routes in the final Paths Object
     */
    public generatePathsObject(app: Express, requireOpenApiDocs = false, includeExcludedPaths = false): void {
        this._document.paths = this.buildPaths(app, requireOpenApiDocs, includeExcludedPaths);
    }
    /**
     *
     * @returns A deep copy of the current OpenApi v3 document
     */
    public build(): OpenAPIV3.Document {
        return clone(this._document);
    }

    private processComponents(): void {
        if (!this._document.components) {
            return;
        }
        for (const [field, components] of Object.entries(this._document.components)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            for (const [name, component] of Object.entries(components)) {
                this.component(field as ComponentFieldNames, name, { component: component as Component });
            }
        }
    }
    /**
     * A builder method to generate allOf schemas.
     *
     * @param names List of names of schemas in the components of this document
     * @returns A valid allOf schema object, using $ref syntax to reference component schemas
     */
    public allOf = (names: string[]): OpenAPIV3.SchemaObject => {
        return this.compositeSchema(CompositeSchemaTypes.allOf, names);
    };
    /**
     * A builder method to generate oneOf schemas.
     *
     * @param names List of names of schemas in the components of this document
     * @returns A valid oneOf schema object, using $ref syntax to reference component schemas
     */
    public oneOf = (names: string[]): OpenAPIV3.SchemaObject => {
        return this.compositeSchema(CompositeSchemaTypes.oneOf, names);
    };
    /**
     * A builder method to generate anyOf schemas.
     *
     * @param names List of names of schemas in the components of this document
     * @returns A valid anyOf schema object, using $ref syntax to reference component schemas
     */
    public anyOf = (names: string[]): OpenAPIV3.SchemaObject => {
        return this.compositeSchema(CompositeSchemaTypes.anyOf, names);
    };
    /**
     * A builder method that can create an allOf, oneOf, anyOf schema objects.
     *
     * @param type One of 'anyOf', 'oneOf', 'allOf', selecting which will be created
     * @param names List of names of schemas in the components of this document
     * @returns A valid allOf, oneOf, anyOf schema object, using $ref syntax to reference component schemas
     * @throws Error if a component name doesn't exist on the document
     */
    public compositeSchema = (type: CompositeSchemaTypes, names: string[]): OpenAPIV3.SchemaObject => {
        const composite: any = {};
        composite[type] = names.map((name) => {
            const ref = this.schema(name);
            if (!ref) {
                throw new Error(`Provided component name ${name} does not exist on the document`);
            }
            return ref;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return composite as OpenAPIV3.SchemaObject;
    };

    /**
     * A method for adding and retrieving components from the document
     *
     * @param field The category of the component, based on the OpenApiv3 spec
     * @param name The name of the component object
     * @param params Options
     * @param params.component If this is included, the component will be added to the document,
     * overriding existing components with the same name and field
     * @param params.copy If this is included, return a full copy, not just a $ref of the request component
     * @returns The component or undefined if it doesn't exist on the document
     * @throws If the field name is not one of {@link ComponentFieldNames}
     */
    public component = (
        field: ComponentFieldNames,
        name: string,
        params?: ComponentParameter,
    ): Component | OpenAPIV3.ReferenceObject | undefined => {
        if (!Object.values(ComponentFieldNames).includes(field)) {
            throw new Error(
                `Provided component fields - ${field} - is invalid, must be one of: ${Object.values(
                    ComponentFieldNames,
                ).toString()}`,
            );
        }
        if (params?.component) {
            if (!this._document.components) {
                this._document.components = {};
            }
            if (!this._document.components[field]) {
                this._document.components[field] = {};
            }
            params.component = clone(params.component);
            this.components.set(`${field}-${name}`, params.component);
            (this._document.components as any)[field][name] = params.component;
        }
        const key = `${field}-${name}`;
        if (!this.components.has(key)) {
            return undefined;
        }
        return params?.copy ? clone(this.components.get(key)) : { $ref: `#/components/${field}/${name}` };
    };
    /**
     * A method for adding and retrieving schema components from the document
     *
     * @param name The name of the schema component
     * @param params Options
     * @param params.component If this is included, the schema will be added to the document,
     * overriding existing schema of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested schema
     * @returns The schema or undefined if it doesn't exist on the document
     */
    public schema = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.schemas, name, params) as
            | OpenAPIV3.SchemaObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving response components from the document
     *
     * @param name The name of the response component
     * @param params Options
     * @param params.component If this is included, the response will be added to the document,
     * overriding existing response of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested response
     * @returns The response or undefined if it doesn't exist on the document
     */
    public response = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.responses, name, params) as
            | OpenAPIV3.ResponseObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving parameter components from the document
     *
     * @param name The name of the parameter component
     * @param params Options
     * @param params.component If this is included, the parameter will be added to the document,
     * overriding existing parameter of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested parameter
     * @returns The parameter or undefined if it doesn't exist on the document
     */
    public parameter = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.parameters, name, params) as
            | OpenAPIV3.ParameterObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving example components from the document
     *
     * @param name The name of the example component
     * @param params Options
     * @param params.component If this is included, the example will be added to the document,
     * overriding existing example of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested example
     * @returns The example or undefined if it doesn't exist on the document
     */
    public example = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ExampleObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.examples, name, params) as
            | OpenAPIV3.ExampleObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving requestBody components from the document
     *
     * @param name The name of the requestBody component
     * @param params Options
     * @param params.component If this is included, the requestBody will be added to the document,
     * overriding existing requestBody of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested requestBody
     * @returns The requestBody or undefined if it doesn't exist on the document
     */
    public requestBody = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.requestBodies, name, params) as
            | OpenAPIV3.RequestBodyObject
            | undefined;
    };
    /**
     * A method for adding and retrieving header components from the document
     *
     * @param name The name of the header component
     * @param params Options
     * @param params.component If this is included, the header will be added to the document,
     * overriding existing header of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested header
     * @returns The header or undefined if it doesn't exist on the document
     */
    public header = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.headers, name, params) as
            | OpenAPIV3.HeaderObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving securityScheme components from the document
     *
     * @param name The name of the securityScheme component
     * @param params Options
     * @param params.component If this is included, the securityScheme will be added to the document,
     * overriding existing securityScheme of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested securityScheme
     * @returns The securityScheme or undefined if it doesn't exist on the document
     */
    public securityScheme = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.securitySchemes, name, params) as
            | OpenAPIV3.SecuritySchemeObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving link components from the document
     *
     * @param name The name of the link component
     * @param params Options
     * @param params.component If this is included, the link will be added to the document,
     * overriding existing link of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested link
     * @returns The link or undefined if it doesn't exist on the document
     */
    public link = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.LinkObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.links, name, params) as
            | OpenAPIV3.LinkObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     * A method for adding and retrieving callback components from the document
     *
     * @param name The name of the callback component
     * @param params Options
     * @param params.component If this is included, the callback will be added to the document,
     * overriding existing callback of the same name
     * @param params.copy If this is included, return a full copy, not just a $ref of the requested callback
     * @returns The callback or undefined if it doesn't exist on the document
     */
    public callback = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.CallbackObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.callbacks, name, params) as
            | OpenAPIV3.CallbackObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };

    private buildPaths = (
        app: Express,
        requireOpenApiDocs: boolean,
        includeExcludedPaths: boolean,
    ): OpenAPIV3.PathsObject => {
        const expressParserOutput: RouteMetaData[] = parseExpressApp(app);
        const paths: any = {};
        for (const path of expressParserOutput) {
            const excludeThisPath =
                (path?.metadata?.exclude && !includeExcludedPaths) ||
                (requireOpenApiDocs && !path?.metadata?.operationObject);
            if (excludeThisPath) {
                continue;
            }
            transformExpressPathToOpenApi(path);
            if (!paths[path.path]) {
                paths[path.path] = {};
            }
            paths[path.path][path.method] = path?.metadata?.operationObject || {};
            if (path?.metadata?.operationId) {
                paths[path.path][path.method].operationId = path?.metadata?.operationId;
            }
            let parameters =
                (path?.metadata?.operationObject?.parameters as (
                    | OpenAPIV3.ReferenceObject
                    | OpenAPIV3.ParameterObject
                )[]) || ([] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]);
            parameters = this.mergeParameters(parameters, path);
            if (parameters.length > 0) {
                paths[path.path][path.method].parameters = parameters;
            }

            if (!paths[path.path][path.method].responses) {
                paths[path.path][path.method].responses = {
                    default: { description: 'Responses object not provided for this route' },
                };
            }
        }
        return paths as OpenAPIV3.PathsObject;
    };

    private mergeParameters = (
        parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
        path: RouteMetaData,
    ): (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] => {
        for (let i = 0; i < parameters.length; i++) {
            for (let j = 0; j < path.pathParams.length; j++) {
                if ((parameters[i] as OpenAPIV3.ReferenceObject).$ref) {
                    parameters[i] = this.parameter((parameters[i] as OpenAPIV3.ReferenceObject).$ref.split('/')[3], {
                        copy: true,
                    }) as OpenAPIV3.ParameterObject;
                }
                if ((parameters[i] as OpenAPIV3.ParameterObject)?.name === path.pathParams[j].name) {
                    parameters[i] = Object.assign(path.pathParams[j], parameters[i]) as
                        | OpenAPIV3.ReferenceObject
                        | OpenAPIV3.ParameterObject;
                    path.pathParams.splice(j, 1);
                    break;
                }
            }
        }
        return [...parameters, ...(path.pathParams as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[])] as (
            | OpenAPIV3.ParameterObject
            | OpenAPIV3.ReferenceObject
        )[];
    };
}

const verifyBasicOpenApiReqs = (openApiDoc: OpenAPIV3.Document): string => {
    let missingFields = openApiDoc?.openapi ? '' : 'openapi, ';
    missingFields += openApiDoc?.info ? '' : 'info, ';
    missingFields += openApiDoc?.info?.title ? '' : 'title ';
    missingFields += openApiDoc?.info?.version ? '' : 'and version.';
    return missingFields;
};

const transformExpressPathToOpenApi = (path: RouteMetaData): void => {
    path.pathParams.forEach((param: Parameter) => {
        path.path = path.path.replace(`:${param.name}`, `{${param.name}}`);
    });
};

export const onlyForTesting = {
    verifyBasicOpenApiReqs,
    transformExpressPathToOpenApi,
};
