import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { IMAGES_S3_BUCKET } from '../../utils/env'
import { createLogger } from '../../utils/logger'
import { createResponse } from '../utils'
import { TodoDAO } from '../../db/TodoDAO'
import { UploadFile } from '../../s3/UploadFile'

const logger = createLogger('generateUploadUrl');
const todoDAO = new TodoDAO(logger);
const uploadFile = new UploadFile(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;
  const url = uploadFile.getUploadUrl(IMAGES_S3_BUCKET, todoId);
  logger.info("Upload URL: " + url);
  const updatedItem = await todoDAO.updateAttachmentURL(todoId, `https://${IMAGES_S3_BUCKET}.s3.amazonaws.com/${todoId}`);
  logger.info("generateUploadUrl: ", updatedItem);
  return createResponse(201, { uploadUrl: url});
}
