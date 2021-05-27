import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
import { createResponse } from '../utils'
import { TODOS_TABLE } from '../../utils/env'
import { createLogger } from '../../utils/logger'

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient()
const logger = createLogger('deleteTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const response = await docClient.delete({
    TableName: TODOS_TABLE,
    Key: {
      todoId
    }
  }).promise()

  logger.debug("deleteTodo: ", response);

  return createResponse(204, null);
}
