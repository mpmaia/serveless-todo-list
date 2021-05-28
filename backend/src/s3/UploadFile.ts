import * as winston from 'winston'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { SIGNED_URL_EXPIRATION } from '../utils/env'

const XAWS = AWSXRay.captureAWS(AWS);

export class UploadFile {

  private logger: winston.Logger;
  private s3 = new XAWS.S3({
    signatureVersion: 'v4'
  });

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public getUploadUrl(bucket: string, id: string): string {
    this.logger.info("getUploadUrl: ", bucket, id);
    return this.s3.getSignedUrl('putObject', {
      Bucket: bucket,
      Key: id,
      Expires: SIGNED_URL_EXPIRATION
    })
  }
}
