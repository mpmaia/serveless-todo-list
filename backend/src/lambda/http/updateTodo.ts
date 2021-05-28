import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createResponse } from '../utils'
import { createLogger } from '../../utils/logger'
import { TodoDAO } from '../../db/TodoDAO'

const logger = createLogger('updateTodo');
const todoDAO = new TodoDAO(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info("updateTodo: ", event);

  const item = await todoDAO.updateTodo(todoId, updatedTodo.name, updatedTodo.done, updatedTodo.dueDate);

  return createResponse(200, {item});
}
