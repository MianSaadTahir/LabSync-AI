import express from 'express';
import { routeToProject } from '../controllers/mcpController';

const router = express.Router();

router.post('/route', routeToProject);

export default router;





