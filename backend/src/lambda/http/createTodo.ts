import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../../models/TodoItem'
import { createResponse, getUserId } from '../utils'
import { TODOS_TABLE } from '../../utils/env'
import { createLogger } from '../../utils/logger'

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient();
const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);
  const userId = getUserId(event);
  if(!userId) {
      return createResponse(403, null);
  }

  const todoItem: TodoItem = {
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    done: false,
    createdAt: new Date().toISOString(),
    todoId: uuid.v4(),
    userId: userId
  }

  const response = await docClient.put({
    TableName: TODOS_TABLE,
    Item: todoItem
  }).promise()

  logger.debug("createTodo: ", response);

  return createResponse(201, {item: todoItem});
}
