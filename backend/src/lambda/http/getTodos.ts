import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createResponse, getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { TodoDAO } from '../../db/TodoDAO'

const logger = createLogger('getTodos');
const todoDAO = new TodoDAO(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info("getTodos: ", event);
  const result = await todoDAO.getByUserId(getUserId(event));
  return createResponse(200, {items: result});
}
