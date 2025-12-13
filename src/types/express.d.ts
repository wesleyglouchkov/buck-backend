import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      rawBody?: string | Buffer;
      cookies: {
        [key: string]: string;
      };
      headers: {
        [key: string]: string | string[] | undefined;
      };
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
  user: User;
  body: any;
  params: any;
  query: any;
  cookies: {
    [key: string]: string;
  };
  headers: {
    [key: string]: string | string[] | undefined;
  };
}
