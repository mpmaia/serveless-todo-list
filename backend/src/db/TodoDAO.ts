import { TodoItem } from '../models/TodoItem'
import { TODOS_TABLE, USER_ID_INDEX } from '../utils/env'
import * as AWS from 'aws-sdk'
import { Converter } from 'aws-sdk/clients/dynamodb'
import * as winston from 'winston'

export class TodoDAO {

  private docClient = new AWS.DynamoDB.DocumentClient();
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  public async create(todoItem: TodoItem): Promise<TodoItem> {
    const response = await this.docClient.put({
      TableName: TODOS_TABLE,
      Item: todoItem
    }).promise();
    this.logger.info("todoDAO create: ", response);
    return todoItem;
  }

  public async delete(todoId: string): Promise<boolean> {
    const result = await this.docClient.delete({
      TableName: TODOS_TABLE,
      Key: {
        todoId
      }
    }).promise()
    this.logger.info("todoDAO delete: ", result);
    return !result.$response.error;
  }

  public async getByUserId(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: TODOS_TABLE,
      IndexName: USER_ID_INDEX,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      }
    }).promise();
    this.logger.info("todoDAO getByUserId: ", result);
    return result.Items as TodoItem[];
  }

  public async updateTodo(todoId: string, name: string, done: boolean, dueDate: string) : Promise<TodoItem> {
    const response = await this.docClient.update({
      TableName: TODOS_TABLE,
      Key: {
        todoId
      },
      ExpressionAttributeNames: {
        "#n": "name",
      },
      UpdateExpression: "SET #n=:n, dueDate=:due, done=:done",
      ExpressionAttributeValues: {
        ":n": name,
        ":due": dueDate,
        ":done": done
      },
      ReturnValues: "ALL_NEW"
    }).promise();
    this.logger.info("todoDAO updateTodo: ", response);
    return Converter.output(response.Attributes);
  }

  public async updateAttachmentURL(todoId: string, url: string): Promise<TodoItem> {
    const response = await this.docClient.update({
      TableName: TODOS_TABLE,
      Key: {
        todoId
      },
      UpdateExpression: "SET attachmentUrl=:att",
      ExpressionAttributeValues: {
        ":att": url
      },
      ReturnValues: "ALL_NEW"
    }).promise();
    this.logger.info("updateAttachmentUrl: ", url);
    return Converter.output(response.Attributes);
  }
}
