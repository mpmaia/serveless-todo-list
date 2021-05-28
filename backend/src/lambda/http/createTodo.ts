import 'source-map-support/register'
import * as uuid from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { TodoItem } from '../../models/TodoItem'
import { createResponse, getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { TodoDAO } from '../../db/TodoDAO'

const logger = createLogger('createTodo');
const todoDAO = new TodoDAO(logger);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);
  const userId = getUserId(event);
  logger.info("createTodo: ", event);

  const todoItem: TodoItem = {
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    done: false,
    createdAt: new Date().toISOString(),
    todoId: uuid.v4(),
    userId: userId
  };

  const newItem = await todoDAO.create(todoItem);
  return createResponse(201, {item: newItem});
}
