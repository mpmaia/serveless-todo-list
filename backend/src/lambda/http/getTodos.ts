import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { TODOS_TABLE, USER_ID_INDEX } from '../../utils/env'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
import { TodoItem } from '../../models/TodoItem'
import { createResponse, getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient()
const logger = createLogger('getTodos');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const result = await docClient.scan({
      TableName: TODOS_TABLE,
      IndexName: USER_ID_INDEX,
      FilterExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': getUserId(event)
      }
    }).promise()
    logger.debug("getTodos: ", result);
    return createResponse(200, {items: result.Items as TodoItem[]});
}
