/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express, { Request, Response } from 'express';
import { DocumentBuilder } from '../index';

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
it('simple example works', () => {
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

    documentBuilder.buildPathsObject(app); // Generates our full open api document
    console.log(documentBuilder.document); // The final document can be found on the read-only property 'document'. It returns a deep copy
    expect(documentBuilder.document).toEqual(exampleDocumentOutput);
});
