import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createResponse, getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { TodoDAO } from '../../db/TodoDAO'

const logger = createLogger('deleteTodo');
const todoDAO = new TodoDAO(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info("deleteTodo: ", event);

  if(await todoDAO.delete(getUserId(event), todoId)) {
    return createResponse(204);
  } else {
    return createResponse(500);
  }
}
