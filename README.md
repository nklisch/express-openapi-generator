# express-openapi-generator
This package allows you to analyze an Express app project and generate OpenApi v3 documentation. A middleware is provided to attach additional documentation to routes and optional request validation. 

### Features
- **Express Parser**: Leveraging the [express-route-parser](https://www.npmjs.com/package/express-route-parser) npm package to parse an Express app's routes and relevant attached metadata. See the [npm package for more information](https://www.npmjs.com/package/express-route-parser).
- **Express OpenApi Middleware**: Creates an Express middleware that attaches relevant meta-data to an individual route. Also provides optional request validation.
- **OpenApi-Builder**: Uses the output of the Express Parser to generate OpenApi Path objects. Also helps generate a full OpenApi v3 specification json document. Includes a number of utility/builder methods to improve documentation creation.

## Installation
```
npm i express-openapi-generator
```

## Usage
You can use this package to simple generate quick and dirty valid open api specs for every route on your project.

**Warning**: *OpenApi does not support exotic route matching, such as `/p(ab)th`, `/p*ath/`, or optional path parameters `/:name?`. If these are in your project the generated document won't follow the OpenApi v3 spec. It may still work, since the route parser can handle these special routes, but plugins like swagger ui may fail.*
### Basic
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
app.use('/api/v1', router);

router.get('/user', (req: Request, res: Response) => {
    res.status(200).json([{ id: '1', name: 'John Smith' }]);
});
router.post('/user', (req: Request, res: Response) => {
    const save = req.body;
    res.status(200).json();
});

// Generates our full open api document
documentBuilder.generatePathsObject(app);

// The final can be retrieved with the build() method. A new deep copy is created each time.
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
            get: {
                responses: {
                    default: { description: 'Responses object not provided for this route' }
                }
            }
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
        res.status(200).json();
    },
);

// ** As an alternative to passing the full operation object **
// ** there are some builder classes provided, with more planned  **

// Setup re-usable defaults for our ResponseBuilder object, 
// useful if your application sends mostly json
ResponseBuilder.defaults({ mediaType: 'application/json' });

// Build our open api operation object for this route, using the builder method
const getUserOperation: OpenAPIV3.OperationObject = OperationBuilder.new({
    '200': ResponseBuilder.new('Gets all users')
        .mediaType({ schema: documentBuilder.schema('user') })
        .build(),
})
    .operationId('getUsers')
    .tags(['users'])
    .build();

// Attach our operation object to the route with the path middleware
router.get(
    '/user',
    PathMiddleware.path('getUsers', { operationObject: getUserOperation }),
    (req: Request, res: Response) => {
        res.status(200).json([{ id: '1', name: 'John Smith' }]);
    },
);

// Generates our full open api document
documentBuilder.generatePathsObject(app);

// The final document can be found on the read-only property 'document'. It returns a deep copy
console.log(documentBuilder.build());

```

**Output**
```typescript
const exampleOutputSchema = {
    openapi: '3.0.1',
    info: { title: 'A example document', version: '1' },
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
            get: {
                responses: {
                    '200': {
                        description: 'Gets all users',
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/user' } },
                        },
                    },
                },
                operationId: 'getUsers',
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

### Important Notes
singleton patterns

## Peer Dependencies
These packages are required for certain functionality: 
- [ajv](https://www.npmjs.com/package/ajv): *Required* package for the provided validation structure. It is not a package dependency, instead build a Ajv instance for use with the validator. This allows direct customization of the Ajv client.
### Recommended npm packages
These packages may integrate well into this eco-system/philosophy of documentation/validation generated from code. 
https://www.npmjs.com/package/openapi-schema-validator
*This package has no direct affiliation with any of these packages.*
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express): provides a web-served GUI for Swagger UI. 
- [redoc-express](https://www.npmjs.com/package/redoc-express): provides a web-served GUI for Redoc UI.
- [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator): Use instead of provided validation flow and Ajv. This provides validation for your routes based on the generated open api spec. Can be used instead of included validation flow. Ajv is not a direct dependency of this project.
- [typescript-json-schema](https://www.npmjs.com/package/express-openapi-validator): Generate json-schema's for your typescript models. Can be used with openapi/jsonschema conversion packages.
- [prisma-json-schema-generator](https://www.npmjs.com/package/prisma-json-schema-generator): Generate json schema's based on your prisma schema.
- [openapi-client-axios](https://www.npmjs.com/package/openapi-client-axios): Generates an axios client based on an open-api spec

## API Documentation

### express-openapi-middleware

### openapi-builder


### Credits
*Inspired by [@wesleytodd/express-openapi](https://www.npmjs.com/package/@wesleytodd/openapi). This project seeks to use the same philosophy of documentation from code, but provide a less opinionated interface, improved features and support more complex Express app router structures.*
