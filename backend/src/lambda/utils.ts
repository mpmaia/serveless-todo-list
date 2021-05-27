import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { parseUserId } from "../auth/utils";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string | null {
  const authorization = event.headers.Authorization
  if(!authorization) {
    return null;
  }
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export function createResponse(httpCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode: httpCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(data)
  }
}
