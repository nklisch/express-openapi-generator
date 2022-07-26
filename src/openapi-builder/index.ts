/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from 'openapi-types';
import { ComponentFieldNames, CompositeSchemaTypes, ExpressPath, Component, ComponentParameter } from '../types';

export default class OpenApiDocumentBuilder {
  private static instance?: OpenApiDocumentBuilder;
  private readonly _document: OpenAPIV3.Document;
  private readonly components: Map<string, any>;

  private constructor(documentStub: OpenAPIV3.Document) {
    documentStub = deepCopy(documentStub) as OpenAPIV3.Document;
    const missingFields = verifyBasicOpenApiReqs(documentStub);
    if (missingFields) {
      throw new Error('Provided Open Api stub document is missing the following fields: ' + missingFields);
    }
    this._document = documentStub;
    this.components = new Map<string, any>();
    this.processComponents();
  }

  private processComponents() {
    if (!this._document.components) {
      return;
    }
    for (const [field, components] of Object.entries(this._document.components)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      for (const [name, component] of Object.entries(components)) {
        this.component(field as ComponentFieldNames, { name, component: component as Component });
      }
    }
  }

  public static initializeDocument(documentStub: OpenAPIV3.Document, reinitialize = false): OpenApiDocumentBuilder {
    if (!OpenApiDocumentBuilder.instance || reinitialize) {
      OpenApiDocumentBuilder.instance = new OpenApiDocumentBuilder(documentStub);
    }
    return OpenApiDocumentBuilder.instance;
  }

  public static getDocumentBuilder(): OpenApiDocumentBuilder {
    if (!OpenApiDocumentBuilder.instance) {
      throw new Error('Must initialize document before getting builder instance');
    }
    return OpenApiDocumentBuilder.instance;
  }

  public buildPathsObject(
    expressParserOutput: ExpressPath[],
    requireOpenApiDocs = false,
    includeExcludedPaths = false,
  ): void {
    this._document.paths = buildPathsObject(expressParserOutput, requireOpenApiDocs, includeExcludedPaths);
  }

  public get document(): OpenAPIV3.Document {
    return deepCopy(this._document) as OpenAPIV3.Document;
  }

  public allOf = (names: string[]) => {
    return this.compositeSchema(CompositeSchemaTypes.allOf, names);
  }

  public oneOf = (names: string[]) => {
    return this.compositeSchema(CompositeSchemaTypes.oneOf, names);
  }

  public anyOf = (names: string[]) => {
    return this.compositeSchema(CompositeSchemaTypes.anyOf, names);
  }

  public compositeSchema = (type: CompositeSchemaTypes, names: string[]): OpenAPIV3.SchemaObject => {
    const composite: any = {};
    composite[type] = names.map((name) => {
      const ref = this.component(ComponentFieldNames.schemas, { name });
      if (!ref) {
        throw new Error(`Provided component name ${name} does not exist on the document`);
      }
      return ref;
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return composite as OpenAPIV3.SchemaObject;
  };

  public component = (field: ComponentFieldNames, { component, name, copy }: ComponentParameter): Component | OpenAPIV3.ReferenceObject | undefined => {
    if (!Object.values(ComponentFieldNames).includes(field)) {
      throw new Error(
        `Provided component fields - ${field} - is invalid, must be one of: ${Object.values(
          ComponentFieldNames,
        ).toString()}`,
      );
    }
    if (component) {
      component = deepCopy(component) as Component;
      this.components.set(`${field}-${name}`, component);
    }
    if (!this._document.components) {
      this._document.components = {};
    }
    if (!this._document.components[field]) {
      this._document.components[field] = {};
    }
    (this._document.components as any)[field][name] = component;
    const key = `${field}-${name}`;
    if (this.components.has(key)) {
      if (copy) {
        return deepCopy(this.components.get(key)) as Component;
      } else {
        return { $ref: `#/components/${field}/${name}` };
      }
    }
    return undefined;
  };

  public schema = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.schemas, params);
  };
  public response = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.responses, params);
  };
  public parameter = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.parameters, params);
  };
  public example = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.examples, params);
  };
  public requestBody = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.requestBodies, params);
  };
  public header = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.headers, params);
  };
  public securityScheme = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.securitySchemes, params);
  };
  public link = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.links, params);
  };
  public callback = (params: ComponentParameter) => {
    return this.component(ComponentFieldNames.callbacks, params);
  };
}


const deepCopy = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};

const verifyBasicOpenApiReqs = (openApiDoc: OpenAPIV3.Document): string => {
  let missingFields = openApiDoc?.openapi ? '' : 'openapi, ';
  missingFields += openApiDoc?.info ? '' : 'info, ';
  missingFields += openApiDoc?.info?.title ? '' : 'title ';
  missingFields += openApiDoc?.info?.version ? '' : 'and version.';
  return missingFields;
};

const buildPathsObject = (
  expressParserOutput: ExpressPath[],
  requireOpenApiDocs: boolean,
  includeExcludedPaths: boolean,
): OpenAPIV3.PathsObject => {
  const paths: any = {};
  for (const path of expressParserOutput) {
    const excludeThisPath = (path.exclude && !includeExcludedPaths) || (requireOpenApiDocs && !path.openApiOperation);
    if (excludeThisPath) {
      continue;
    }
    transformExpressPathToOpenApi(path);
    paths[path.path] = {};
    paths[path.path][path.method] = path.openApiOperation || {};
    paths[path.path][path.method].operationId = path.operationId;
    let parameters =
      path.openApiOperation?.parameters || ([] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]);
    parameters = mergeParameters(parameters, path);
    if (parameters.length > 0) {
      paths[path.path][path.method].parameters = parameters;
    }

    if (!paths[path.path][path.method].responses) {
      paths[path.path][path.method].responses = { default: { description: 'Responses object not provided for this route' } };
    }
  }
  return paths as OpenAPIV3.PathsObject;
};

const transformExpressPathToOpenApi = (path: ExpressPath): void => {
  path.pathParams.forEach((param: OpenAPIV3.ParameterObject) => {
    path.path = path.path.replace(`:${param.name}`, `{${param.name}}`);
  });
};

const mergeParameters = (
  parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
  path: ExpressPath,
): (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] => {
  const indexesToRemove: number[] = []
  for (let i = 0; i < parameters.length; i++) {
    for (let j = 0; j < path.pathParams.length; j++) {
      if ((parameters[i] as OpenAPIV3.ParameterObject)?.name === path.pathParams[j].name) {
        parameters[i] = Object.assign(path.pathParams[j], parameters[i]);
        path.pathParams.splice(j, 1)
        break;
      }
    }
  }
  return [...parameters, ...path.pathParams];
};

export const onlyForTesting = {
  verifyBasicOpenApiReqs,
  buildPathsObject,
  transformExpressPathToOpenApi,
  mergeParameters,
};
