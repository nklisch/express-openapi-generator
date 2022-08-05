# express-openapi-generator
This package analyzes an Express app project, generating OpenApi v3 documentation. The optional middleware attaches additional documentation to routes and provides optional request validation. 

*This project takes a minimalist, un-opinionated approach with only a single dependency, express-route-parser, a dependency free package developed and maintained by me.*

### Features
- Parses your project routes with [express-route-parser](https://www.npmjs.com/package/express-route-parser) and generates a valid OpenApiv3 Document.
- Minimal dependencies - 1 package that is dependency free and created by myself
- Middleware to attach additional documentation to any route.
- Optional request validation with middleware using fully configurable [ajv](https://www.npmjs.com/package/ajv) client
- Easily exclude/include each route based on configurable flags, allowing public/private api docs to be generated
- OpenApiv3 builder classes allow creating open api components with reduced boiler plate

## Installation
```
npm i express-openapi-generator
```

## Usage
You can use this package to generate quick and dirty valid open api specs for every route on your project.

API Documentation: [TS Docs](https://nklisch.github.io/express-openapi-generator/)

**Warning**: *OpenApi does not support exotic route matching, such as `/p(ab)th`, `/p*ath/`, or optional path parameters `/:name?`. If these are in your project the generated document won't follow the OpenApi v3 spec. It may still work, since the route parser can handle these special routes, but plugins like swagger ui may fail.*

### Quick
```typescript
import express, { Request, Response } from 'express'
import { DocumentBuilder } from 'express-openapi-generator'
const app = express();
const router = express.Router();
// This initializes and creates our document builder interface
const documentBuilder = DocumentBuilder.initializeDocument({
    openapi: '3.0.1',
    info: {
        title: 'A example document',
        version: '1',
    },
    paths: {}, // You don't need to include any path objects, those will be generated later
});
app.use(express.json())
app.use('/api/v1', router);

router.get('/user/:id', (req: Request, res: Response) => {
    res.json({ id: '1', name: 'John Smith' });
});
router.post('/user', (req: Request, res: Response) => {
    const save = req.body;
    res.json(save);
});

// Generates our full open api document
documentBuilder.generatePathsObject(app);

// The final document can be retrieved with the build() method. A new deep copy is created each time.
console.log(documentBuilder.build()); 

```
**Output**
```typescript
const exampleDocumentOutput = {
    openapi: '3.0.1',
    info: { title: 'A example document', version: '1' },
    paths: {
        '/api/v1/user': {
            post: {
                responses: {
                    default: { description: 'Responses object not provided for this route' },
                },
            },
        },
        '/api/v1/user/{id}': {
            get: {
                responses: {
                    default: { description: 'Responses object not provided for this route' },
                },
                parameters: [{
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                            type: 'string',
                    },
                }],
            },
        },
    },
};

```

### With Added Documentation
```typescript
import express, { Request, Response } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { DocumentBuilder, PathMiddleware, ResponseBuilder, OperationBuilder } from '../index';
const app = express();
const router = express.Router();
// This initializes and creates our document builder interface
const documentBuilder = DocumentBuilder.initializeDocument({
    openapi: '3.0.1',
    info: {
        title: 'A example document',
        version: '1',
    },
    paths: {}, // You don't need to include any path objects, those will be generated later
});
const userSchema: OpenAPIV3.SchemaObject = {
    title: 'A user object',
    type: 'object',
    properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
    },
};
documentBuilder.schema('user', { component: userSchema });
app.use(express.json())
app.use('/api/v1', router);

// Create our open api operation object following OpenApiv3 specification
const createUserOperation: OpenAPIV3.OperationObject = {
    operationId: 'createUser',
    tags: ['users'],
    responses: {
        '200': {
            description: 'Create a User',
            content: {
                'application/json': {
                    schema: documentBuilder.schema('user'),
                },
            },
        },
    },
    requestBody: { content: { 'application/json': { schema: documentBuilder.schema('user') } } }
};

// Attach our middleware
router.post(
    '/user',
    PathMiddleware.path('createUser', { operationObject: createUserOperation }),
    (req: Request, res: Response): void => {
        const save = req.body;
        res.json(save);
    },
);

// ** As an alternative to passing the full operation object **
// ** there are some builder classes provided, with more planned  **

// Setup re-usable defaults for our ResponseBuilder object, 
// useful if your application sends mostly json
ResponseBuilder.defaults({ mimeType: 'application/json' });

// Build our open api operation object for this route, using the builder method
const getUserOperation: OpenAPIV3.OperationObject = OperationBuilder.new({
    '200': ResponseBuilder.new('Get user by id')
        .schema(documentBuilder.schema('user') as OpenAPIV3.ReferenceObject)
        .build(),
})
    .operationId('getUsers')
    .tags(['users'])
    .build();

// Attach our operation object to the route with the path middleware
router.get(
    '/user/:id',
    PathMiddleware.path('getUser', { operationObject: getUserOperation }),
    (req: Request, res: Response) => {
        res.json({ id: '1', name: 'John Smith' });
    },
);

// Generates our full open api document
documentBuilder.generatePathsObject(app);

// The final document can be retrieved with the .build() method. . A new deep copy is created each time.
console.log(documentBuilder.build());

```

**Output**
```typescript
const exampleOutputSchema = {
    openapi: '3.0.1',
    info: { title: 'An example document', version: '1' },
    paths: {
        '/api/v1/user': {
            post: {
                operationId: 'createUser',
                tags: ['users'],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/user' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Create a User',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/user' } },
                        },
                    },
                },
            },
        },
        '/api/v1/user/{id}': {
            get: {
                responses: {
                    '200': {
                        description: 'Get user by id',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/user' } },
                        },
                    },
                },
                parameters: [{
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                            type: 'string',
                    },
                }],
                operationId: 'getUser',
                tags: ['users'],
            },
        },
    },
    components: {
        schemas: {
            user: {
                title: 'A user object',
                type: 'object',
                properties: { id: { type: 'integer' }, name: { type: 'string' } },
            },
        },
    },
};
```
### Adding Request Validation
This is a incomplete code snippet, with just the changes needed from the prior example to work.
```typescript
// ... prior imports here
import Ajv from 'ajv';
import addFormats from 'ajv-formats'

// .... previous example here .... ///

documentBuilder.generatePathsObject(app); // generate open api doc

const ajv = new Ajv({ coerceTypes: true }) // choose any Ajv options

// For example, included coerceTypes: true and it will convert the path params, headers, query and body into the correct types.

addFormats(ajv); // Apply any desired ajv plugins

// Build and provide the document and ajv client to the validation middlewares
PathMiddleware.initializeValidation(documentBuilder.build(), ajv);

```
### Important Notes
Both DocumentBuilder and PathMiddleware use singleton patterns. This allows you to initialize the underlying objects and then import the classes in other modules directly from express-openapi-generator package. This allows the required state to be maintained throughout the project.

### Peer Dependencies
- [ajv](https://www.npmjs.com/package/ajv): *Required* package for the provided validation structure. It is not a package dependency, instead build a Ajv instance for use with the validator. This allows direct customization of the Ajv client.

### Recommended npm packages
These packages may integrate well into this eco-system/philosophy of documentation/validation generated from code. 
*This package has no direct affiliation with any of these packages.*
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express): provides a web-served GUI for Swagger UI. 
- [redoc-express](https://www.npmjs.com/package/redoc-express): provides a web-served GUI for Redoc UI.
- [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator): may be used instead of provided validation with Ajv. This provides validation for your routes based on the generated open api spec with a single middleware.
- [typescript-json-schema](https://www.npmjs.com/package/express-openapi-validator): Generate json-schemas for your typescript models. Can be used with openapi/jsonschema conversion packages to create schema's for your request/response bodies.
- [prisma-json-schema-generator](https://www.npmjs.com/package/prisma-json-schema-generator): Generate json schema's based on your prisma schema.
- [openapi-client-axios](https://www.npmjs.com/package/openapi-client-axios): Generates an axios client based on an open-api spec

## API Documentation
See the [TS Docs](https://nklisch.github.io/express-openapi-generator/)

### Credits
*Inspired by [@wesleytodd/express-openapi](https://www.npmjs.com/package/@wesleytodd/openapi). This project seeks to use the same philosophy of documentation from code, but provide a less opinionated interface, improved features and support more complex Express app router structures.*
