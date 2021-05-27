import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk';
import { IMAGES_S3_BUCKET, SIGNED_URL_EXPIRATION, TODOS_TABLE } from '../../utils/env'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../../utils/logger'
import { createResponse } from '../utils'

const bucketName = IMAGES_S3_BUCKET
const urlExpiration = SIGNED_URL_EXPIRATION

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

function getUploadUrl(id: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: id,
    Expires: urlExpiration
  })
}

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient()
const logger = createLogger('generateUploadUrl');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;
  const url = getUploadUrl(todoId);
  logger.debug("Upload URL: " + url);
  const response = await docClient.update({
    TableName: TODOS_TABLE,
    Key: {
      todoId
    },
    UpdateExpression: "SET attachmentUrl=:att",
    ExpressionAttributeValues: {
      ":att": `https://${IMAGES_S3_BUCKET}.s3.amazonaws.com/${todoId}`
    },
    ReturnValues: "ALL_NEW"
  }).promise();

  logger.debug("generateUploadUrl: ", response);

  return createResponse(201, { uploadUrl: url});
}
