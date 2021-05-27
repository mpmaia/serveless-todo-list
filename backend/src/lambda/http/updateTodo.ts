import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
import { TODOS_TABLE } from '../../utils/env'
import { createResponse } from '../utils'
import { createLogger } from '../../utils/logger'

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient();
const logger = createLogger('updateTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const response = await docClient.update({
    TableName: TODOS_TABLE,
    Key: {
      todoId
    },
    ExpressionAttributeNames: {
      "#n": "name",
    },
    UpdateExpression: "SET #n=:n, dueDate=:due, done=:done",
    ExpressionAttributeValues: {
      ":n": updatedTodo.name,
      ":due": updatedTodo.dueDate,
      ":done": updatedTodo.done
    },
    ReturnValues: "ALL_NEW"
  }).promise();

  logger.debug("updateTodo: ", response);

  return createResponse(200, {item: updatedTodo});
}
