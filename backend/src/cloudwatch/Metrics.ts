import * as winston from 'winston'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { CLOUDWATCH_NAMESPACE } from '../utils/env'

const XAWS = AWSXRay.captureAWS(AWS);

export class MetricClient {

  private cloudwatch = new XAWS.CloudWatch();
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public sendMetric(metricName: string, value: number) {
    var params = {
      MetricData: [
        {
          MetricName: metricName,
          Timestamp: new Date(),
          Value: value
        }
      ],
      Namespace: CLOUDWATCH_NAMESPACE
    };
    this.logger.info("Sending metric: ", params);
    return this.cloudwatch.putMetricData(params).promise().catch(function(err) {
        this.logger.error("Failed to publish metric: ", err);
    });
  }

}
