/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express, { Request, Response } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { DocumentBuilder, PathMiddleware, ResponseBuilder, OperationBuilder } from '../index';

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
                    default: { description: 'Responses object not provided for this route' },
                },
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

    router.get('/user', (req: Request, res: Response) => {
        res.status(200).json([{ id: '1', name: 'John Smith' }]);
    });
    router.post('/user', (req: Request, res: Response) => {
        const save = req.body;
        res.status(200).json();
    });

    documentBuilder.generatePathsObject(app); // Generates our full open api document
    console.log(documentBuilder.build()); // The final document can be found on the read-only property 'document'. It returns a deep copy
    expect(documentBuilder.build()).toEqual(exampleDocumentOutput);
});

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

test('example with added documentation works', () => {
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
        requestBody: { content: { 'application/json': { schema: documentBuilder.schema('user') } } },
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

    // ** As an alternative to passing the full operation object, there are some helper builder classes provided **

    // Setup re-usable defaults for our ResponseBuilder object, useful if your application sends mostly json
    ResponseBuilder.defaults({ mimeType: 'application/json' });

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
    expect(documentBuilder.build()).toEqual(exampleOutputSchema);
});
