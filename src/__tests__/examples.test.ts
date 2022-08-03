/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express, { Request, Response } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { DocumentBuilder, PathMiddleware, ResponseBuilder, OperationBuilder } from '../index';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import supertest from 'supertest';

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
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                    },
                ],
            },
        },
    },
};
test('simple example works', () => {
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

    router.get('/user/:id', (req: Request, res: Response) => {
        res.status(200).json({ id: '1', name: 'John Smith' });
    });
    router.post('/user', (req: Request, res: Response) => {
        const save = req.body;
        res.status(200).json(save);
    });

    documentBuilder.generatePathsObject(app); // Generates our full open api document
    console.log(documentBuilder.build()); // The final document can be found on the read-only property 'document'. It returns a deep copy
    expect(documentBuilder.build()).toEqual(exampleDocumentOutput);
});

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
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                    },
                ],
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

test('example with added documentation works', () => {
    const app = express();
    const router = express.Router();
    // This initializes and creates our document builder interface
    const documentBuilder = DocumentBuilder.initializeDocument({
        openapi: '3.0.1',
        info: {
            title: 'An example document',
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
        requestBody: { content: { 'application/json': { schema: documentBuilder.schema('user') } } },
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

    // ** As an alternative to passing the full operation object, there are some helper builder classes provided **

    // Setup re-usable defaults for our ResponseBuilder object, useful if your application sends mostly json
    ResponseBuilder.defaults({ mimeType: 'application/json' });

    // Build our open api operation object for this route, using the builder method
    const getUserOperation: OpenAPIV3.OperationObject = OperationBuilder.new({
        '200': ResponseBuilder.new('Get user by id')
            .schema(documentBuilder.schema('user') as OpenAPIV3.SchemaObject)
            .build(),
    })
        .operationId('getUser')
        .tags(['users'])
        .build();

    // Attach our operation object to the route with the path middleware
    router.get(
        '/user/:id',
        PathMiddleware.path('getUser', { operationObject: getUserOperation }),
        (req: Request, res: Response) => {
            res.json([{ id: '1', name: 'John Smith' }]);
        },
    );

    // Generates our full open api document
    documentBuilder.generatePathsObject(app);

    // The final document can be found on the read-only property 'document'. It returns a deep copy
    console.log(documentBuilder.build());
    expect(documentBuilder.build()).toEqual(exampleOutputSchema);
});

test('example with validation works', async () => {
    const app = express();
    const router = express.Router();
    // This initializes and creates our document builder interface
    const documentBuilder = DocumentBuilder.initializeDocument({
        openapi: '3.0.1',
        info: {
            title: 'An example document',
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
    app.use(express.json());
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
        requestBody: { content: { 'application/json': { schema: documentBuilder.schema('user') } }, required: true },
    };

    // Attach our middleware
    router.post(
        '/user',
        PathMiddleware.path('createUser', { operationObject: createUserOperation, validate: true }),
        (req: Request, res: Response): void => {
            const save = req.body;
            res.json(save);
        },
    );

    // ** As an alternative to passing the full operation object, there are some helper builder classes provided **

    // Setup re-usable defaults for our ResponseBuilder object, useful if your application sends mostly json
    ResponseBuilder.defaults({ mimeType: 'application/json' });

    // Build our open api operation object for this route, using the builder method
    const getUserOperation: OpenAPIV3.OperationObject = OperationBuilder.new({
        '200': ResponseBuilder.new('Get user by id')
            .schema(documentBuilder.schema('user') as OpenAPIV3.ReferenceObject)
            .build(),
    })
        .operationId('getUser')
        .tags(['users'])
        .build();

    // Attach our operation object to the route with the path middleware
    router.get(
        '/user/:id',
        PathMiddleware.path('getUser', { operationObject: getUserOperation }),
        (req: Request, res: Response) => {
            res.json([{ id: '1', name: 'John Smith' }]);
        },
    );

    // Generates our full open api document
    documentBuilder.generatePathsObject(app);
    const ajv = new Ajv({ coerceTypes: true }); // choose any options you would like

    // For example, included coerceTypes: true and it will convert the path params, headers, query and body into the correct types.

    addFormats(ajv); // Apply any desired ajv plugins

    // build and provide the document and ajv client to the validation middlewares
    PathMiddleware.initializeValidation(documentBuilder.build(), ajv);

    const response = await supertest(app)
        .post('/api/v1/user')
        .send({ id: '2', name: 'Jane Smith' })
        .set('Accept', 'application/json');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ id: 2, name: 'Jane Smith' });
});
