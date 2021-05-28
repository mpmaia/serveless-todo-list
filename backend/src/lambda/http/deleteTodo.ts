import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createResponse, getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { TodoDAO } from '../../db/TodoDAO'
import { UploadFile } from '../../s3/UploadFile'
import { IMAGES_S3_BUCKET } from '../../utils/env'

const logger = createLogger('deleteTodo');
const todoDAO = new TodoDAO(logger);
const uploadFile = new UploadFile(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info("deleteTodo: ", event);

  if(await todoDAO.delete(getUserId(event), todoId)) {
    const deleted = await uploadFile.deleteObject(IMAGES_S3_BUCKET, todoId);
    logger.info("S3 deleteObject: ", deleted);
    return createResponse(204);
  } else {
    return createResponse(500);
  }
}
