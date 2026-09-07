import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // NestJS's ValidationPipe throws a BadRequestException whose response
    // body is `{ statusCode, message: string[], error: 'Bad Request' }`.
    // exception.message in that case is NOT the array of validation
    // errors — HttpException falls back to a generic name derived from the
    // constructor ("Bad Request Exception") whenever `response.message`
    // isn't a plain string. We read the actual response body first so real
    // validation errors (or any custom message) reach the client instead of
    // that generic label.
    let message: string;
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const responseMessage = (exceptionResponse as { message: unknown }).message;
        message = Array.isArray(responseMessage)
          ? responseMessage.join(', ')
          : String(responseMessage);
      } else {
        message = exception.message;
      }
    } else {
      message = 'Something went wrong';
    }

    const error =
      exception instanceof HttpException
        ? exception.name
        : 'INTERNAL_SERVER_ERROR';

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
