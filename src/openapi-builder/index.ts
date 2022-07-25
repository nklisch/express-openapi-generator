/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from 'openapi-types';
import { ComponentFieldNames, ExpressPath } from '../types';
type Component =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3.ResponseObject
  | OpenAPIV3.ParameterObject
  | OpenAPIV3.ExampleObject
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3.HeaderObject
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3.LinkObject
  | OpenAPIV3.CallbackObject;
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
  }

  public static initializeDocument(documentStub: OpenAPIV3.Document): OpenApiDocumentBuilder {
    if (!OpenApiDocumentBuilder.instance) {
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

  public component = (field: ComponentFieldNames, name: string, component: Component): Component | undefined => {
    component = deepCopy(component) as Component;
    if (component) {
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
      return deepCopy(this.components.get(key)) as Component;
    }
    return undefined;
  };
  public schema = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.schemas, name, component);
  };
  public response = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.responses, name, component);
  };
  public parameter = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.parameters, name, component);
  };
  public example = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.examples, name, component);
  };
  public requestBody = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.requestBodies, name, component);
  };
  public headers = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.headers, name, component);
  };
  public securitySchemes = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.securitySchemes, name, component);
  };
  public links = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.links, name, component);
  };
  public callbacks = (name: string, component: Component) => {
    return this.component(ComponentFieldNames.callbacks, name, component);
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
    paths[path.path][path.method] = {};
    let parameters =
      path.openApiOperation?.parameters || ([] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]);
    parameters = mergeParameters(parameters, path);

    paths[path.path][path.method] = parameters;
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
  for (let i = 0; i < parameters.length; i++) {
    for (let j = 0; j < path.pathParams.length; j++) {
      if ((parameters[i] as OpenAPIV3.ParameterObject)?.name === path.pathParams[j].name) {
        parameters[i] = Object.assign(path.pathParams[i], parameters[i]);
        path.pathParams.splice(i, 1);
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
