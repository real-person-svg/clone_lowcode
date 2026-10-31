export class ServiceError extends Error {
  /** 封装业务错误码、HTTP 状态和可选错误详情。 */
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown
  ) {
    super(message);
  }
}
